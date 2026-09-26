// ==============================================================================
// تنفيذ قاعدة البيانات بملفات JSON — تطوير محلي فقط
// لا يُستخدم في الإنتاج: db.js يرفضه صراحةً عند NODE_ENV=production.
// ==============================================================================
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_DIR = path.join(__dirname, 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const COMMISSION = 10
const WELCOME_CREDIT = 100

function getFilePath(table) {
  return path.join(DATA_DIR, `${table}.json`)
}

function readTable(table) {
  const file = getFilePath(table)
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]', 'utf8')
    return []
  }
  let raw
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch (err) {
    // لا نُرجع قائمة فارغة: ذلك سيبدو كـ"لا توجد بيانات" بينما الملف تالف.
    throw new Error(`تعذر قراءة جدول ${table}: ${err.message}`)
  }
  try {
    return JSON.parse(raw || '[]')
  } catch (err) {
    throw new Error(
      `ملف جدول ${table} تالف (JSON غير صالح): ${err.message}. ` +
        `أصلحه يدوياً — لن نستبدل بياناتك ببدائل.`,
    )
  }
}

function writeTable(table, data) {
  fs.writeFileSync(getFilePath(table), JSON.stringify(data, null, 2), 'utf8')
}

function nowIso() {
  return new Date().toISOString()
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  if (!stored || !password) return false
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const check = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'))
}

const UsersDB = {
  findAll: () => readTable('users'),
  findByPhone: (phone) => readTable('users').find((u) => u.phone === phone),
  findById: (id) => readTable('users').find((u) => u.id === id),
  insert: (user) => {
    const users = readTable('users')
    if (users.some((u) => u.phone === user.phone)) {
      throw new Error('PHONE_EXISTS')
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: String(user.name || '').trim(),
      phone: user.phone,
      email: user.email || null,
      passwordHash: user.password ? hashPassword(user.password) : null,
      role: user.role === 'nurse' || user.role === 'admin' ? user.role : 'patient',
      nationalId: user.nationalId || null,
      syndicateNumber: user.syndicateNumber || null,
      governorate: user.governorate || null,
      area: user.area || null,
      address: user.address || null,
      gender: user.gender || null,
      verified: false,
      createdAt: nowIso(),
    }
    if (!newUser.name) {
      throw new Error('NAME_REQUIRED')
    }
    users.push(newUser)
    writeTable('users', users)
    if (newUser.role === 'nurse') {
      NursesDB.insertFromUser(newUser, user)
      WalletsDB.initWallet(newUser.id, newUser.name)
    }
    return stripSecret(newUser)
  },
  verifyCredentials: (phone, password) => {
    const user = UsersDB.findByPhone(phone)
    if (!user || !user.passwordHash) return null
    if (!verifyPassword(password, user.passwordHash)) return null
    return stripSecret(user)
  },
  update: (id, updates) => {
    const users = readTable('users')
    const idx = users.findIndex((u) => u.id === id)
    if (idx === -1) return null
    const next = { ...users[idx], ...updates, id: users[idx].id, phone: users[idx].phone }
    if (updates.password) {
      next.passwordHash = hashPassword(updates.password)
      delete next.password
    }
    users[idx] = next
    writeTable('users', users)
    return stripSecret(users[idx])
  },
}

function stripSecret(user) {
  if (!user) return null
  const { passwordHash, ...safe } = user
  return safe
}

const OtpDB = {
  createOtp: (phone, otpCode) => {
    const otps = readTable('otps').filter((r) => r.phone !== phone || r.isUsed)
    const record = {
      id: `otp-${Date.now()}`,
      phone,
      otpCode,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      isUsed: false,
      createdAt: nowIso(),
    }
    otps.push(record)
    writeTable('otps', otps)
    return record
  },
  latestForPhone: (phone) => {
    const otps = readTable('otps')
    return [...otps].reverse().find((r) => r.phone === phone && !r.isUsed) || null
  },
  verifyOtp: (phone, otpCode) => {
    const otps = readTable('otps')
    const now = Date.now()
    const record = otps.find(
      (r) =>
        r.phone === phone &&
        r.otpCode === String(otpCode) &&
        !r.isUsed &&
        new Date(r.expiresAt).getTime() > now,
    )
    if (!record) return false
    record.isUsed = true
    writeTable('otps', otps)
    return true
  },
}

const NursesDB = {
  findAll: () => readTable('nurses'),
  findById: (id) => readTable('nurses').find((n) => n.id === id),
  insertFromUser: (user, extra = {}) => {
    const nurses = readTable('nurses')
    if (nurses.some((n) => n.id === user.id)) return nurses.find((n) => n.id === user.id)
    const specialties = Array.isArray(extra.specialties) && extra.specialties.length
      ? extra.specialties
      : ['wound-care', 'injections']
    const nurse = {
      id: user.id,
      name: user.name,
      // الهاتف مطلوب للإدارة للتواصل والتحقق من هوية الممرض
      phone: user.phone || null,
      gender: extra.gender === 'male' || extra.gender === 'female' ? extra.gender : 'female',
      title: extra.title || 'ممرض مسجل',
      specialties,
      governorate: extra.governorate || user.governorate || '',
      area: extra.area || user.area || '',
      coverageGovernorates: extra.coverageGovernorates || (extra.governorate ? [extra.governorate] : []),
      coordinates: extra.coordinates || null,
      rating: 0,
      reviews: 0,
      experienceYears: Number(extra.experienceYears) || 0,
      // الاعتماد المهني لا يتحقق بالتسجيل — يتطلب اعتماد الإدارة صراحةً
      verified: false,
      available: false,
      bio: extra.bio || '',
      languages: extra.languages || ['العربية'],
      completedSessionsCount: 0,
      walletBalance: WELCOME_CREDIT,
      syndicateNumber: extra.syndicateNumber || user.syndicateNumber || null,
      createdAt: nowIso(),
    }
    nurses.push(nurse)
    writeTable('nurses', nurses)
    return nurse
  },
  update: (id, updates) => {
    const nurses = readTable('nurses')
    const idx = nurses.findIndex((n) => n.id === id)
    if (idx === -1) return null
    nurses[idx] = { ...nurses[idx], ...updates, id: nurses[idx].id }
    writeTable('nurses', nurses)
    return nurses[idx]
  },
  setAvailable: (id, available) => NursesDB.update(id, { available: Boolean(available) }),
  approve: (id) => NursesDB.update(id, { verified: true, available: true }),
  listPublic: () => readTable('nurses').filter((n) => n.verified),
}

const WalletsDB = {
  initWallet: (nurseId, nurseName = '') => {
    const wallets = readTable('wallets')
    const existing = wallets.find((w) => w.nurseId === nurseId)
    if (existing) return existing
    const wallet = {
      nurseId,
      nurseName,
      initialWelcomeCredit: WELCOME_CREDIT,
      currentBalance: WELCOME_CREDIT,
      completedSessionsCount: 0,
      totalCommissionDeducted: 0,
      remainingSessionsQuota: Math.floor(WELCOME_CREDIT / COMMISSION),
      needsRecharge: false,
      transactions: [
        {
          id: `tx-welcome-${Date.now()}`,
          date: nowIso(),
          type: 'welcome_credit',
          amount: WELCOME_CREDIT,
          description: 'رصيد ترحيبي عند إنشاء حساب الممرض',
          balanceAfter: WELCOME_CREDIT,
        },
      ],
    }
    wallets.push(wallet)
    writeTable('wallets', wallets)
    return wallet
  },
  getWallet: (nurseId) => {
    const wallets = readTable('wallets')
    return wallets.find((x) => x.nurseId === nurseId) || null
  },
  credit: (nurseId, amount, description) => {
    const wallets = readTable('wallets')
    let w = wallets.find((x) => x.nurseId === nurseId)
    if (!w) w = WalletsDB.initWallet(nurseId)
    const creditAmount = Number(amount)
    if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
      throw new Error('INVALID_AMOUNT')
    }
    w.currentBalance += creditAmount
    w.remainingSessionsQuota = Math.floor(w.currentBalance / COMMISSION)
    w.needsRecharge = w.currentBalance < COMMISSION
    w.transactions.unshift({
      id: `tx-credit-${Date.now()}`,
      date: nowIso(),
      type: 'wallet_recharge',
      amount: creditAmount,
      description: description || `شحن إداري ${creditAmount} ج.م`,
      balanceAfter: w.currentBalance,
    })
    const idx = wallets.findIndex((x) => x.nurseId === nurseId)
    if (idx === -1) wallets.push(w)
    else wallets[idx] = w
    writeTable('wallets', wallets)
    NursesDB.update(nurseId, { walletBalance: w.currentBalance })
    return w
  },
  deductCommission: (nurseId, sessionId, commissionAmount = COMMISSION) => {
    const wallets = readTable('wallets')
    let w = wallets.find((x) => x.nurseId === nurseId)
    if (!w) w = WalletsDB.initWallet(nurseId)
    if (w.currentBalance < commissionAmount) {
      return { error: 'INSUFFICIENT_BALANCE', wallet: w }
    }
    w.currentBalance = Math.round((w.currentBalance - commissionAmount) * 100) / 100
    w.completedSessionsCount += 1
    w.totalCommissionDeducted += commissionAmount
    w.remainingSessionsQuota = Math.floor(w.currentBalance / COMMISSION)
    w.needsRecharge = w.currentBalance < COMMISSION
    w.transactions.unshift({
      id: `tx-deduct-${Date.now()}`,
      date: nowIso(),
      type: 'session_commission_deduction',
      amount: -commissionAmount,
      description: `خصم عمولة المنصة عن الجلسة ${sessionId}`,
      sessionId,
      balanceAfter: w.currentBalance,
    })
    const idx = wallets.findIndex((x) => x.nurseId === nurseId)
    if (idx === -1) wallets.push(w)
    else wallets[idx] = w
    writeTable('wallets', wallets)
    NursesDB.update(nurseId, {
      walletBalance: w.currentBalance,
      completedSessionsCount: w.completedSessionsCount,
    })
    return { wallet: w }
  },
}

const SessionsDB = {
  findAll: () => readTable('sessions'),
  findById: (id) => readTable('sessions').find((s) => s.id === id),
  findForUser: (user) => {
    const sessions = readTable('sessions')
    if (!user) return []
    if (user.role === 'admin') return sessions
    if (user.role === 'nurse') return sessions.filter((s) => s.nurseId === user.id)
    return sessions.filter((s) => s.patientId === user.id || s.patientPhone === user.phone)
  },
  createSession: (sessionData) => {
    if (!sessionData.patientName || !sessionData.patientPhone || !sessionData.nurseId || !sessionData.service) {
      throw new Error('INCOMPLETE_BOOKING')
    }
    const nurse = NursesDB.findById(sessionData.nurseId)
    if (!nurse) throw new Error('NURSE_NOT_FOUND')
    if (!nurse.verified) throw new Error('NURSE_NOT_VERIFIED')
    const wallet = WalletsDB.getWallet(nurse.id)
    if (wallet && wallet.currentBalance < COMMISSION) throw new Error('NURSE_NO_CREDIT')

    const completionCode = String(crypto.randomInt(1000, 10000))
    const sessions = readTable('sessions')
    const newSession = {
      id: `s-${Date.now()}`,
      patientId: sessionData.patientId || null,
      patientName: String(sessionData.patientName).trim(),
      patientPhone: String(sessionData.patientPhone).replace(/\D/g, ''),
      nurseId: nurse.id,
      nurseName: nurse.name,
      service: sessionData.service,
      serviceId: sessionData.serviceId || null,
      date: sessionData.date || new Date().toISOString().split('T')[0],
      time: sessionData.time || null,
      status: 'confirmed',
      governorate: sessionData.governorate || nurse.governorate || '',
      area: sessionData.area || nurse.area || '',
      address: sessionData.address || '',
      coordinates: sessionData.coordinates || null,
      completionCode,
      verificationCode: completionCode,
      arrivalConfirmed: false,
      platformCommission: COMMISSION,
      commissionDeducted: false,
      nurseNotes: sessionData.notes || '',
      createdAt: nowIso(),
    }
    sessions.unshift(newSession)
    writeTable('sessions', sessions)
    return newSession
  },
  update: (id, updates) => {
    const sessions = readTable('sessions')
    const idx = sessions.findIndex((s) => s.id === id)
    if (idx === -1) return null
    sessions[idx] = { ...sessions[idx], ...updates, id: sessions[idx].id }
    writeTable('sessions', sessions)
    return sessions[idx]
  },
  applyAction: (id, action, payload = {}) => {
    const session = SessionsDB.findById(id)
    if (!session) return { success: false, message: 'الجلسة غير موجودة' }

    // machine de estados: لا يُسمح بالانتقال العشوائي بين المراحل
    const NEXT_STATE = {
      start_trip: 'confirmed',
      confirm_arrival: 'nurse_en_route',
      start_care: 'nurse_arrived',
      nurse_complete: 'in_progress',
      verify_otp: 'completed_by_nurse',
    }

    const stamp = nowIso()
    if (action in NEXT_STATE) {
      const required = NEXT_STATE[action]
      if (action === 'verify_otp') {
        if (session.status !== 'completed_by_nurse' && session.status !== 'confirmed_completed') {
          return { success: false, message: 'لا يمكن تأكيد الجلسة قبل إنهائها من الممرض' }
        }
      } else if (session.status !== required) {
        return {
          success: false,
          message: 'هذا الإجراء غير متاح في الوضع الحالي للجلسة',
        }
      }
    }

    if (action === 'start_trip') {
      return { success: true, session: SessionsDB.update(id, { status: 'nurse_en_route' }) }
    }
    if (action === 'confirm_arrival') {
      return {
        success: true,
        session: SessionsDB.update(id, {
          status: 'nurse_arrived',
          arrivalConfirmed: true,
          arrivedAt: stamp,
        }),
      }
    }
    if (action === 'start_care') {
      return { success: true, session: SessionsDB.update(id, { status: 'in_progress' }) }
    }
    if (action === 'nurse_complete') {
      return {
        success: true,
        session: SessionsDB.update(id, {
          status: 'completed_by_nurse',
          completedAt: stamp,
          nurseNotes: payload.nurseNotes || session.nurseNotes,
          vitalSigns: payload.vitalSigns || session.vitalSigns,
        }),
      }
    }
    if (action === 'verify_otp') {
      if (String(payload.code || '').trim() !== String(session.completionCode)) {
        return { success: false, message: 'رمز التحقق غير صحيح' }
      }
      if (session.status === 'confirmed_completed') {
        return { success: true, session }
      }
      const records = readTable('records')
      if (records.some((r) => r.sessionId === session.id)) {
        return {
          success: false,
          message: 'تم توثيق هذه الجلسة مسبقاً. لا يمكن الخصم مرتين على نفس الجلسة.',
        }
      }
      const deducted = WalletsDB.deductCommission(session.nurseId, session.id, COMMISSION)
      if (deducted.error) {
        return { success: false, message: 'رصيد الممرض غير كافٍ لخصم العمولة', wallet: deducted.wallet }
      }
      const updated = SessionsDB.update(id, {
        status: 'confirmed_completed',
        arrivalConfirmed: true,
        commissionDeducted: true,
        confirmedAt: stamp,
      })
      RecordsDB.createFromSession(updated)
      return { success: true, session: updated, wallet: deducted.wallet }
    }
    return { success: false, message: 'إجراء غير معروف' }
  },
}

const RecordsDB = {
  findAll: () => readTable('records'),
  findForPatient: (patientId, patientPhone) =>
    readTable('records').filter((r) => r.patientId === patientId || r.patientPhone === patientPhone),
  createFromSession: (session) => {
    if (!session) return null
    const records = readTable('records')
    const record = {
      id: `r-${Date.now()}`,
      sessionId: session.id,
      patientId: session.patientId,
      patientPhone: session.patientPhone,
      title: `تقرير جلسة: ${session.service}`,
      type: 'تقرير',
      date: nowIso().split('T')[0],
      encrypted: true,
      notes: session.nurseNotes || '',
    }
    records.unshift(record)
    writeTable('records', records)
    return record
  },
}

module.exports = {
  DATA_DIR,
  COMMISSION,
  WELCOME_CREDIT,
  UsersDB,
  OtpDB,
  NursesDB,
  WalletsDB,
  SessionsDB,
  RecordsDB,
}
