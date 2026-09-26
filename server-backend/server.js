// نُحمّل .env الخاص بالخادم صراحةً بغض النظر عن مجلد التشغيل.
// dotenv الافتراضي يقرأ من process.cwd()، فتشغيل الخادم من جذر المشروع
// كان يقرأ .env الجذري (قيم NEXT_PUBLIC_* فقط) فيفشل بـ INVALID_ENVIRONMENT.
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const fs = require('fs')
const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { assertProductionReady } = require('./env')
const { sendSms, validateSmsConfig } = require('./sms')
const db = require('./db')
const {
  COMMISSION,
  UsersDB,
  OtpDB,
  NursesDB,
  WalletsDB,
  SessionsDB,
  RecordsDB,
} = db

// التحقق من البيئة قبل أي استيراد/App — الخادم لا يقلع بإعداد ناقص
const envCheck = assertProductionReady()
const SMS = validateSmsConfig()

// ملفات JSON تُنشأ هنا فقط في التطوير؛ في الإنتاج القاعدة خارجية
const DATA_DIR = process.env.RAHMA_DATA_DIR
  ? path.resolve(process.env.RAHMA_DATA_DIR)
  : path.join(__dirname, 'data')

function loadJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (envCheck.isProduction) {
    throw new Error('JWT_SECRET مطلوب في الإنتاج (يفحصه assertProductionReady)')
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  const secretFile = path.join(DATA_DIR, '.jwt-secret')
  if (fs.existsSync(secretFile)) return fs.readFileSync(secretFile, 'utf8').trim()
  const generated = crypto.randomBytes(48).toString('hex')
  fs.writeFileSync(secretFile, generated, 'utf8')
  return generated
}

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = loadJwtSecret()
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '').replace(/\D/g, '')

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(
  cors({
    origin(origin, callback) {
      // الطلبات بدون Origin (تطبيق الموبايل / نفس المصدر) مسموحة
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
      return callback(new Error('Origin not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '100kb' }))

app.use((req, res, next) => {
  // نُسجّل الطريقة والمسار فقط — لا الرمز ولا البيانات الحساسة
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// مصيدة أخطاء مركزية: لا نكشف تفاصيل داخلية في الإنتاج
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  console.error('[error]', req.method, req.path, '-', err.message)
  if (err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'المصدر غير مسموح' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'حجم الطلب كبير جداً' })
  }
  if (envCheck.isProduction) {
    return res.status(500).json({ error: 'حدث خطأ داخلي' })
  }
  res.status(500).json({ error: err.message })
})

function cleanPhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

function isValidEgyptianMobile(phone) {
  return /^01[0125]\d{8}$/.test(phone)
}

function signToken(user) {
  return jwt.sign({ userId: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
}

async function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'يلزم تسجيل الدخول' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await UsersDB.findById(payload.userId)
    if (!user) return res.status(401).json({ error: 'الجلسة غير صالحة' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'الجلسة منتهية أو غير صالحة' })
  }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحية الإدارة مطلوبة' })
  }
  next()
}

/** إخفاء رمز الجلسة عمّن ليس مخوَّلاً به (مريض / إدارة فقط) */
function publicSession(session, viewer) {
  if (!session) return null
  const copy = { ...session }
  const canSeeCode =
    viewer &&
    (viewer.role === 'admin' || viewer.id === session.patientId || viewer.phone === session.patientPhone)
  if (!canSeeCode) {
    delete copy.completionCode
    delete copy.verificationCode
  }
  return copy
}

/** هل يحق لهذا المشاهد رؤية رمز الجلسة؟ (يُستخدم لطلب فك التشفير) */
function maySeeCode(viewer, session) {
  if (!viewer || !session) return false
  return (
    viewer.role === 'admin' ||
    viewer.id === session.patientId ||
    viewer.phone === session.patientPhone
  )
}

async function maybePromoteAdmin(user) {
  if (ADMIN_PHONE && user.phone === ADMIN_PHONE && user.role !== 'admin') {
    return UsersDB.update(user.id, { role: 'admin', verified: true })
  }
  return user
}

app.get('/api/v1/health', async (req, res) => {
  // فحص فعلي للاتصال بالقاعدة، لا مجرد "أنا يعمل"
  let dbStatus = 'ok'
  let dbError = null
  try {
    if (db.pool) await db.pool.query('SELECT 1')
  } catch (err) {
    dbStatus = 'down'
    dbError = err.message
  }
  const healthy = dbStatus === 'ok'
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'online' : 'degraded',
    app: 'رحمة',
    serverTime: new Date().toISOString(),
    database: { engine: db.isPostgres ? 'postgresql' : 'file-json', status: dbStatus, error: dbError },
    sms: { provider: SMS.provider },
    environment: envCheck.isProduction ? 'production' : 'development',
  })
})

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      name,
      phone,
      password,
      role,
      nationalId,
      syndicateNumber,
      governorate,
      area,
      gender,
      title,
      specialties,
      experienceYears,
      bio,
    } = req.body || {}

    const cleanedPhone = cleanPhone(phone)
    if (!isValidEgyptianMobile(cleanedPhone)) {
      return res.status(400).json({ error: 'أدخل رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 01)' })
    }
    const fullName = String(name || `${firstName || ''} ${lastName || ''}`).trim()
    if (fullName.length < 3) {
      return res.status(400).json({ error: 'الاسم مطلوب' })
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' })
    }
    const accountRole = role === 'nurse' ? 'nurse' : 'patient'
    if (accountRole === 'patient' && !/^\d{14}$/.test(String(nationalId || ''))) {
      return res.status(400).json({ error: 'الرقم القومي يجب أن يكون 14 رقماً' })
    }
    if (accountRole === 'nurse' && !syndicateNumber) {
      return res.status(400).json({ error: 'رقم قيد النقابة مطلوب لحساب الممرض' })
    }

    const user = await UsersDB.insert({
      name: fullName,
      phone: cleanedPhone,
      password,
      role: accountRole,
      nationalId,
      syndicateNumber,
      governorate,
      area,
      gender,
      title,
      specialties,
      experienceYears,
      bio,
    })

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب. أكمل الدخول برمز التحقق المرسل إلى هاتفك.',
      user,
    })
  } catch (err) {
    if (err.message === 'PHONE_EXISTS') {
      return res.status(409).json({ error: 'هذا الرقم مسجّل مسبقاً، استخدم تسجيل الدخول' })
    }
    console.error(err)
    return res.status(500).json({ error: 'تعذر إنشاء الحساب' })
  }
})

app.post('/api/v1/auth/send-otp', async (req, res) => {
  try {
    const cleanedPhone = cleanPhone(req.body?.phone)
    if (!isValidEgyptianMobile(cleanedPhone)) {
      return res.status(400).json({ error: 'رقم الهاتف غير صحيح' })
    }
    const user = await UsersDB.findByPhone(cleanedPhone)
    if (!user) {
      return res.status(404).json({ error: 'لا يوجد حساب بهذا الرقم. سجّل أولاً.' })
    }

    const otpCode = String(crypto.randomInt(1000, 10000))
    const message = `رمز التحقق لتطبيق رحمة: ${otpCode}. صالح 5 دقائق.`

    // fail-closed: لا يُكتب الرمز في القاعدة إلا بعد نجاح الإرسال فعلياً.
    // لولا ذلك لاستطاع المهاجم تجاوز التحقق برقم واحد.
    try {
      await sendSms(cleanedPhone, message)
    } catch (err) {
      console.error('[auth] OTP delivery failed:', err.message)
      return res.status(503).json({
        error: 'تعذر إرسال رمز التحقق الآن. حاول بعد قليل.',
      })
    }

    const created = await OtpDB.createOtp(cleanedPhone, otpCode)
    if (!created) {
      return res.status(429).json({
        error: 'تم إرسال عدة رموز خلال وقت قصير. حاول بعد قليل.',
      })
    }

    return res.json({
      success: true,
      message: 'تم إرسال رمز التحقق إلى هاتفك.',
      phone: cleanedPhone,
      provider: SMS.provider,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'تعذر إرسال رمز التحقق' })
  }
})

app.post('/api/v1/auth/verify-otp', async (req, res) => {
  try {
    const cleanedPhone = cleanPhone(req.body?.phone)
    const otpCode = String(req.body?.otpCode || '')
    if (!cleanedPhone || !otpCode) {
      return res.status(400).json({ error: 'رقم الهاتف ورمز التحقق مطلوبان' })
    }
    if (!(await OtpDB.verifyOtp(cleanedPhone, otpCode))) {
      return res.status(400).json({ error: 'رمز التحقق غير صحيح أو منتهي' })
    }
    let user = await UsersDB.findByPhone(cleanedPhone)
    if (!user) {
      return res.status(404).json({ error: 'الحساب غير موجود' })
    }
    user = await UsersDB.update(user.id, { verified: true }) || user
    user = await maybePromoteAdmin(user)
    if (user.role === 'nurse') {
      // تأكيد الرمز يثبت الحساب فقط. الاعتماد المهني يبقى بيد الإدارة،
      // وإلا لاستطاع أي شخص يملك رقم نقابة الظهور في القائمة العامة فوراً.
      const nurse = await NursesDB.findById(user.id)
      if (nurse && nurse.verified) await NursesDB.update(user.id, { available: true })
    }
    const wallet = user.role === 'nurse' ? await WalletsDB.getWallet(user.id) : null
    const token = signToken(user)
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        nationalId: user.nationalId,
        governorate: user.governorate,
        area: user.area,
        isAuthenticated: true,
      },
      wallet,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'تعذر تأكيد الحساب' })
  }
})

app.get('/api/v1/auth/me', authRequired, (req, res) => {
  const wallet = req.user.role === 'nurse' ? WalletsDB.getWallet(req.user.id) : null
  res.json({ success: true, user: req.user, wallet })
})

app.get('/api/v1/nurses', async (req, res) => {
  const { gov, specialty, available } = req.query
  const list = await NursesDB.listPublic({ gov, specialty, available })
  res.json({ success: true, count: list.length, nurses: list })
})

app.get('/api/v1/nurses/:id', async (req, res) => {
  const nurse = await NursesDB.findById(req.params.id)
  if (!nurse || !nurse.verified) {
    return res.status(404).json({ error: 'الممرض غير موجود' })
  }
  res.json({ success: true, nurse })
})

app.patch('/api/v1/nurses/:id/availability', authRequired, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح' })
  }
  const nurse = await NursesDB.setAvailable(req.params.id, req.body?.available)
  if (!nurse) return res.status(404).json({ error: 'الممرض غير موجود' })
  res.json({ success: true, nurse })
})

app.post('/api/v1/admin/nurses/:id/approve', authRequired, adminRequired, async (req, res) => {
  const nurse = await NursesDB.approve(req.params.id)
  if (!nurse) return res.status(404).json({ error: 'الممرض غير موجود' })
  await UsersDB.update(req.params.id, { verified: true })
  res.json({ success: true, nurse })
})

// قائمة إدارية: كل الممرضين (بما في ذلك غير المعتمدين) مع أرصدتهم الحقيقية
app.get('/api/v1/admin/nurses', authRequired, adminRequired, async (req, res) => {
  const all = await NursesDB.findAll()
  const nurses = await Promise.all(
    all.map(async (n) => {
      const wallet = await WalletsDB.getWallet(n.id)
      return { ...n, walletBalance: wallet ? wallet.currentBalance : 0 }
    }),
  )
  res.json({ success: true, count: nurses.length, nurses })
})

// تحديث الموقع والنطاق الجغرافي للممرض (الممرض نفسه أو الإدارة)
app.patch('/api/v1/nurses/:id/location', authRequired, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح' })
  }
  const { governorate, area, coverageGovernorates, coordinates } = req.body || {}
  const patches = {}
  if (governorate) patches.governorate = String(governorate)
  if (area) patches.area = String(area)
  if (Array.isArray(coverageGovernorates)) patches.coverageGovernorates = coverageGovernorates
  if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
    patches.coordinates = { lat: coordinates.lat, lng: coordinates.lng }
  }
  const nurse = await NursesDB.update(req.params.id, patches)
  if (!nurse) return res.status(404).json({ error: 'الممرض غير موجود' })
  res.json({ success: true, nurse })
})

app.get('/api/v1/nurse/wallet/:nurseId', authRequired, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.nurseId) {
    return res.status(403).json({ error: 'غير مصرح' })
  }
  const wallet = await WalletsDB.getWallet(req.params.nurseId)
  if (!wallet) return res.status(404).json({ error: 'المحفظة غير موجودة' })
  res.json({ success: true, wallet })
})

app.post('/api/v1/admin/wallets/:nurseId/credit', authRequired, adminRequired, async (req, res) => {
  try {
    const wallet = await WalletsDB.credit(
      req.params.nurseId,
      req.body?.amount,
      req.body?.description,
    )
    res.json({ success: true, wallet })
  } catch {
    res.status(400).json({ error: 'قيمة الشحن غير صالحة' })
  }
})

app.get('/api/v1/sessions', authRequired, async (req, res) => {
  // نطلب فك تشفير الرمز مسبقاً لأن المشاهد قد يكون المريض
  const raw = await SessionsDB.findForUser(req.user, { withCode: false })
  const sessions = await Promise.all(
    raw.map(async (s) => {
      const full = maySeeCode(req.user, s)
        ? await SessionsDB.findById(s.id, { withCode: true })
        : s
      return publicSession(full, req.user)
    }),
  )
  res.json({ success: true, total: sessions.length, sessions })
})

app.post('/api/v1/sessions', authRequired, async (req, res) => {
  try {
    const session = await SessionsDB.createSession({
      ...req.body,
      patientId: req.user.id,
      patientName: req.body?.patientName || req.user.name,
      patientPhone: req.body?.patientPhone || req.user.phone,
    })
    // الرمز يُعاد مرة واحدة هنا للمريض الذي أنشأ الحجز
    res.status(201).json({ success: true, session: publicSession(session, req.user) })
  } catch (err) {
    const map = {
      INCOMPLETE_BOOKING: [400, 'بيانات الحجز غير مكتملة'],
      NURSE_NOT_FOUND: [404, 'الممرض غير موجود'],
      NURSE_NOT_VERIFIED: [400, 'حساب الممرض غير مكتمل التوثيق'],
      NURSE_NO_CREDIT: [400, 'رصيد الممرض لا يسمح باستقبال جلسة حالياً'],
    }
    const [status, message] = map[err.message] || [500, 'تعذر إنشاء الجلسة']
    res.status(status).json({ error: message })
  }
})

app.get('/api/v1/sessions/:id', authRequired, async (req, res) => {
  const session = await SessionsDB.findById(req.params.id)
  if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' })
  const allowed =
    req.user.role === 'admin' ||
    req.user.id === session.nurseId ||
    req.user.id === session.patientId ||
    req.user.phone === session.patientPhone
  if (!allowed) return res.status(403).json({ error: 'غير مصرح' })
  // فك الرمز للمريض/الإدارة فقط
  const full = maySeeCode(req.user, session)
    ? await SessionsDB.findById(req.params.id, { withCode: true })
    : session
  res.json({ success: true, session: publicSession(full, req.user) })
})

app.patch('/api/v1/sessions/:id', authRequired, async (req, res) => {
  const session = await SessionsDB.findById(req.params.id)
  if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' })
  const action = req.body?.action
  const isNurse = req.user.id === session.nurseId
  const isPatient = req.user.id === session.patientId || req.user.phone === session.patientPhone
  const isAdmin = req.user.role === 'admin'

  if (['start_trip', 'confirm_arrival', 'start_care', 'nurse_complete'].includes(action) && !isNurse && !isAdmin) {
    return res.status(403).json({ error: 'هذا الإجراء للممرض فقط' })
  }
  if (action === 'verify_otp' && !isNurse && !isPatient && !isAdmin) {
    return res.status(403).json({ error: 'غير مصرح بتأكيد الجلسة' })
  }

  const result = await SessionsDB.applyAction(req.params.id, action, req.body)
  if (!result.success) return res.status(400).json(result)
  res.json({
    success: true,
    session: publicSession(result.session, req.user),
    wallet: result.wallet || undefined,
  })
})

// تأكيد رمز التحقق — المسموح للمريض أو الممرض المعني أو الإدارة فقط.
app.post('/api/v1/sessions/confirm-otp', authRequired, async (req, res) => {
  const { sessionId, completionCode } = req.body || {}
  if (!sessionId || !completionCode) {
    return res.status(400).json({ error: 'معرّف الجلسة ورمز التحقق مطلوبان' })
  }
  const session = await SessionsDB.findById(sessionId)
  if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' })

  const allowed =
    req.user.role === 'admin' ||
    req.user.id === session.nurseId ||
    req.user.id === session.patientId ||
    req.user.phone === session.patientPhone
  if (!allowed) return res.status(403).json({ error: 'غير مصرح بتأكيد الجلسة' })

  const result = await SessionsDB.applyAction(sessionId, 'verify_otp', { code: completionCode })
  if (!result.success) return res.status(400).json(result)
  res.json({ success: true, session: publicSession(result.session, req.user), wallet: result.wallet || undefined })
})

app.get('/api/v1/records', authRequired, async (req, res) => {
  const records = await RecordsDB.findForPatient(req.user.id, req.user.phone)
  res.json({ success: true, records })
})

// فرز طبي إرشادي على الخادم — يقبل كامل التفاصيل السريرية التي يجمعها النموذج
app.post('/api/v1/triage', (req, res) => {
  const { symptoms, age, gender, duration, history } = req.body || {}
  if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
    return res.status(400).json({ error: 'الأعراض مطلوبة' })
  }
  // ندمج كل الحقول في نص واحد حتى تُبنى القواعد على الصورة السريرية الكاملة
  const text = [symptoms, duration, history].filter(Boolean).join(' ').toLowerCase()
  const ageNum = Number(age)
  const hasValidAge = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 120

  // عوامل خطورة ترفع الأولوية فوق مطابقة النص وحده
  const isInfantOrElderly = hasValidAge && (ageNum < 1 || ageNum >= 65)
  const chronicHistory = /(سكري|ضغط|قلب|كلى|ربو|مناعة|سيولة)/.test(String(history || '').toLowerCase())
    || /(سكري|ضغط|قلب|كلى|ربو)/.test(text)
  const fastOnset = /(منذ دقائق|فجأة|مفاجئ|حالياً|الآن)/.test(text)

  let result
  if (/(صدر|قلب|تنفس|إغماء|وعي|نزيف|تشنج)/.test(text)) {
    result = {
      urgency: 'emergency',
      summary: 'الأعراض قد تشير إلى حالة طارئة تستلزم تدخلاً فورياً.',
      possibleConditions: ['حالة قلبية أو تنفسية حادة'],
      recommendedActions: ['الاتصال بالإسعاف على 123'],
      recommendedServiceId: 'emergency',
      redFlags: ['ألم صدر', 'صعوبة تنفس', 'فقدان وعي'],
    }
  } else if (/(جرح|خياطة|غرز|قرح)/.test(text)) {
    result = {
      urgency: 'routine',
      summary: 'الحالة تحتاج غياراً وتعقيماً طبياً.',
      possibleConditions: ['جرح يحتاج غياراً دورياً'],
      recommendedActions: ['حجز ممرض معتمد لعمل غيار معقم'],
      recommendedServiceId: 'wound-care',
      redFlags: ['إفرازات صديدية', 'ارتفاع حرارة'],
    }
  } else if (isInfantOrElderly || fastOnset || chronicHistory) {
    // لا يوجد عرض طارئ صريح، لكن عوامل الخطر ترفع الحالة درجة واحدة
    const reasons = []
    if (isInfantOrElderly) reasons.push('الفئة العمرية عالية الخطورة (أقل من سنة أو 65 سنة فأكثر)')
    if (fastOnset) reasons.push('بداية مفاجئة للأعراض')
    if (chronicHistory) reasons.push('تاريخ مرضي مزمن يزيد من تعقيد الحالة')
    result = {
      urgency: 'urgent',
      summary: 'لا توجد علامة طوارئ صريحة، لكن عوامل الخطر تستدعي رعاية طبية عاجلة: ' + reasons.join('، ') + '.',
      possibleConditions: ['حالة تحتاج تقييماً طبياً سريعاً'],
      recommendedActions: ['حجز ممرض معتمد لتقييم العلامات الحيوية خلال ساعات'],
      recommendedServiceId: 'vitals',
      redFlags: ['تدهور سريع للأعراض', 'ارتفاع درجة الحرارة مع توعّك'],
    }
  } else {
    result = {
      urgency: 'routine',
      summary: 'يمكن تقييم الحالة بزيارة تمريضية منزلية.',
      possibleConditions: ['أعراض عامة تستوجب فحصاً مبدئياً'],
      recommendedActions: ['حجز ممرض معتمد لقياس العلامات الحيوية'],
      recommendedServiceId: null,
      redFlags: ['صعوبة تنفس', 'ألم حاد مفاجئ'],
    }
  }

  res.json({
    ...result,
    // البيانات السريرية التي بُني عليها التقييم (تسهل التتبع والتدقيق)
    input: {
      age: hasValidAge ? ageNum : null,
      gender: gender || null,
      duration: duration || null,
      history: history || null,
    },
  })
})

// ── الإقلاع ────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  const engine = db.isPostgres ? 'postgresql' : 'file-json (تطوير فقط)'
  console.log('──────────────────────────────────────────────')
  console.log(`  رحمة — الخادم يعمل`)
  console.log(`  العنوان      : http://localhost:${PORT}`)
  console.log(`  البيئة       : ${envCheck.isProduction ? 'production' : 'development'}`)
  console.log(`  قاعدة البيانات: ${engine}`)
  console.log(`  مزوّد الرسائل: ${SMS.provider}`)
  console.log('──────────────────────────────────────────────')
})

// إغلاق مرتّب: ننهي اتصالات القاعدة قبل الخروج حتى لا تُقطع معاملة جارية
async function shutdown(signal) {
  console.log(`\n[${signal}] جارٍ الإيقاف المرتّب...`)
  server.close(async () => {
    try {
      if (db.pool) await db.pool.end()
      console.log('[shutdown] تم إغلاق اتصالات قاعدة البيانات.')
    } catch (err) {
      console.error('[shutdown] خطأ أثناء إغلاق القاعدة:', err.message)
    }
    process.exit(0)
  })
  // لا ننتظر بلا حد
  setTimeout(() => {
    console.error('[shutdown] تجاوز المهلة — إيقاف قسري.')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason instanceof Error ? reason.message : reason)
})
