// ==============================================================================
// محوّل PostgreSQL — نفس واجهة db-json.js لكن بقاعدة بيانات حقيقية ومعاملات ذرّية.
// يُستخدم تلقائياً عند ضبط DATABASE_URL.
// ==============================================================================
const crypto = require('crypto')
const { Pool } = require('pg')

const COMMISSION = 10
const WELCOME_CREDIT = 100

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', (err) => console.error('[db] idle client error:', err.message))

const q = (text, params) => pool.query(text, params)

/** تنفيذ ضمن معاملة واحدة — كل شيء يُطبَّق أو لا شيء */
async function tx(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

const newId = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

// ── تشفير رموز الجلسة ───────────────────────────────────────────────────────
// رمز الجلسة (بخلاف OTP) يجب أن يبقى قابلاً للعرض للمريض، لذا لا يمكن تجزئته.
// لذلك نشفّره بمفتاح مشتق من SESSION_CODE_KEY: تسريب قاعدة البيانات لا يكشف
// الأكواد، ومع ذلك يظل المريض قادراً على رؤية رمزه في أي وقت.
const CODE_KEY = crypto
  .createHash('sha256')
  .update(process.env.SESSION_CODE_KEY || process.env.JWT_SECRET || 'dev-insecure-code-key')
  .digest()

function encryptCode(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', CODE_KEY, iv)
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  return `${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${enc.toString('base64')}`
}

function decryptCode(stored) {
  if (!stored) return null
  try {
    const [ivB, tagB, dataB] = String(stored).split(':')
    const decipher = crypto.createDecipheriv('aes-256-gcm', CODE_KEY, Buffer.from(ivB, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(dataB, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return null
  }
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
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(check, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** تجزئة رمز التحقق — مع سر إضافي حتى لا تُجدد الأكواد من القاعدة وحدها */
const otpDigest = (code) =>
  crypto.createHmac('sha256', String(code) + (process.env.JWT_SECRET || '')).digest('hex')

const stripSecret = (user) => {
  if (!user) return null
  const { passwordHash, ...safe } = user
  return safe
}

const iso = (v) => (v instanceof Date ? v.toISOString() : v || null)

// ── تحويل صفوف قاعدة البيانات إلى نفس الشكل الذي تتوقعه الواجهة ─────────────
const toUser = (r) =>
  r && {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    passwordHash: r.password_hash,
    role: r.role,
    nationalId: r.national_id,
    syndicateNumber: r.syndicate_number,
    governorate: r.governorate,
    area: r.area,
    address: r.address,
    gender: r.gender,
    verified: r.verified,
    createdAt: iso(r.created_at),
  }

const toNurse = (r) =>
  r && {
    id: r.id,
    name: r.name,
    phone: r.phone,
    gender: r.gender,
    title: r.title,
    bio: r.bio,
    specialties: r.specialties || [],
    languages: r.languages || [],
    governorate: r.governorate || '',
    area: r.area || '',
    coverageGovernorates: r.coverage_governorates || [],
    coordinates:
      r.latitude != null && r.longitude != null ? { lat: r.latitude, lng: r.longitude } : null,
    rating: Number(r.rating),
    reviews: r.reviews,
    experienceYears: r.experience_years,
    verified: r.verified,
    available: r.available,
    completedSessionsCount: r.completed_sessions_count,
    walletBalance: Number(r.wallet_balance),
    syndicateNumber: r.syndicate_number,
    createdAt: iso(r.created_at),
  }

const toSession = (r, { withCode = false } = {}) => {
  if (!r) return null
  const session = {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    nurseId: r.nurse_id,
    nurseName: r.nurse_name,
    service: r.service,
    serviceId: r.service_id,
    date: r.date,
    time: r.time,
    status: r.status,
    governorate: r.governorate,
    area: r.area,
    address: r.address,
    coordinates: r.coordinates || null,
    arrivalConfirmed: r.arrival_confirmed,
    arrivedAt: iso(r.arrived_at),
    platformCommission: Number(r.platform_commission),
    commissionDeducted: r.commission_deducted,
    completedAt: iso(r.completed_at),
    confirmedAt: iso(r.confirmed_at),
    nurseNotes: r.nurse_notes,
    vitalSigns: r.vital_signs,
    createdAt: iso(r.created_at),
  }
  // فك التشفير عند الطلب الصريح فقط من طرف مخوَّل (يركّبه الخادم في server.js)
  if (withCode) {
    const code = decryptCode(r.completion_code)
    if (code) {
      session.completionCode = code
      session.verificationCode = code
    }
  }
  return session
}


const USER_COLS =
  'id, name, phone, email, password_hash, role, national_id, syndicate_number, governorate, area, address, gender, verified, created_at'

const NURSE_COLS = `id, name, phone, gender, title, bio, specialties, languages, governorate,
                    area, coverage_governorates, latitude, longitude, rating, reviews,
                    experience_years, verified, available, completed_sessions_count,
                    wallet_balance, syndicate_number, created_at`

const SESSION_COLS = `id, patient_id, patient_name, patient_phone, nurse_id, nurse_name,
                      service, service_id, date, time, status, governorate, area, address,
                      coordinates, completion_code, arrival_confirmed, arrived_at,
                      platform_commission, commission_deducted, completed_at, confirmed_at,
                      nurse_notes, vital_signs, created_at`

// ==============================================================================
// UsersDB
// ==============================================================================
const UsersDB = {
  findAll: async () =>
    (await q(`SELECT ${USER_COLS} FROM users ORDER BY created_at DESC`)).rows.map(toUser),

  findByPhone: async (phone) =>
    toUser((await q(`SELECT ${USER_COLS} FROM users WHERE phone = $1`, [phone])).rows[0]),

  findById: async (id) =>
    toUser((await q(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [id])).rows[0]),

  insert: async (user) => {
    if (!String(user.name || '').trim()) throw new Error('NAME_REQUIRED')
    return tx(async (c) => {
      const id = newId('usr')
      try {
        await c.query(
          `INSERT INTO users (id, name, phone, email, password_hash, role, national_id,
                              syndicate_number, governorate, area, address, gender)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            id,
            String(user.name).trim(),
            user.phone,
            user.email || null,
            user.password ? hashPassword(user.password) : null,
            ['nurse', 'admin'].includes(user.role) ? user.role : 'patient',
            user.nationalId || null,
            user.syndicateNumber || null,
            user.governorate || null,
            user.area || null,
            user.address || null,
            user.gender || null,
          ],
        )
      } catch (err) {
        if (err.code === '23505') throw new Error('PHONE_EXISTS')
        throw err
      }
      const created = toUser(
        (await c.query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [id])).rows[0],
      )
      if (created.role === 'nurse') {
        await NursesDB.insertFromUser(c, created, user)
        await WalletsDB.initWallet(c, created.id, created.name)
      }
      return stripSecret(created)
    })
  },

  verifyCredentials: async (phone, password) => {
    const user = await UsersDB.findByPhone(phone)
    if (!user?.passwordHash) return null
    return verifyPassword(password, user.passwordHash) ? stripSecret(user) : null
  },

  update: async (id, updates) => {
    // نبني الجملة من قائمة حقول مسموح بها فقط (حماية من حقن SQL)
    const map = {
      name: 'name', email: 'email', role: 'role', nationalId: 'national_id',
      syndicateNumber: 'syndicate_number', governorate: 'governorate', area: 'area',
      address: 'address', gender: 'gender', verified: 'verified',
    }
    const sets = []
    const values = []
    for (const [key, column] of Object.entries(map)) {
      if (key in updates) {
        values.push(updates[key])
        sets.push(`${column} = $${values.length}`)
      }
    }
    if (updates.password) {
      values.push(hashPassword(updates.password))
      sets.push(`password_hash = $${values.length}`)
    }
    if (!sets.length) return stripSecret(await UsersDB.findById(id))
    values.push(id)
    await q(`UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length}`, values)
    return stripSecret(await UsersDB.findById(id))
  },
}

// ==============================================================================
// OtpDB — تجزئة + حد محاولات + صلاحية
// ==============================================================================
const MAX_OTP_ATTEMPTS = 5
const OTP_TTL_MINUTES = 5

const OtpDB = {
  /** يعيد false إذا تجاوز حد الإرسال (منع الإرسال المزعج والتكلفة) */
  createOtp: async (phone, code) => {
    const recent = await q(
      `SELECT count(*)::int AS n FROM otps
       WHERE phone = $1 AND created_at > now() - interval '15 minutes'`,
      [phone],
    )
    if (recent.rows[0].n >= 3) return false

    await q(`UPDATE otps SET is_used = TRUE WHERE phone = $1 AND is_used = FALSE`, [phone])
    await q(
      `INSERT INTO otps (id, phone, code_hash, salt, attempts, max_attempts, expires_at)
       VALUES ($1,$2,$3,$4,0,$5, now() + ($6 || ' minutes')::interval)`,
      [
        newId('otp'), phone, otpDigest(code),
        crypto.randomBytes(8).toString('hex'),
        MAX_OTP_ATTEMPTS, String(OTP_TTL_MINUTES),
      ],
    )
    return true
  },

  verifyOtp: async (phone, code) => {
    const { rows } = await q(
      `SELECT * FROM otps
       WHERE phone = $1 AND is_used = FALSE AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [phone],
    )
    const rec = rows[0]
    if (!rec) return false
    if (rec.attempts >= rec.max_attempts) {
      await q(`UPDATE otps SET is_used = TRUE WHERE id = $1`, [rec.id])
      return false
    }
    const expected = otpDigest(code)
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(rec.code_hash, 'utf8')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      await q(`UPDATE otps SET attempts = attempts + 1 WHERE id = $1`, [rec.id])
      return false
    }
    await q(`UPDATE otps SET is_used = TRUE WHERE id = $1`, [rec.id])
    return true
  },

  /** آخر رمز صالح للرقم (للاستخدام في أدوات التطوير والاختبار) */
  latestForPhone: async (phone) => {
    const { rows } = await q(
      `SELECT id, phone, attempts, max_attempts, expires_at, is_used, created_at
       FROM otps WHERE phone = $1 AND is_used = FALSE AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
      [phone],
    )
    return rows[0] || null
  },
}


// ==============================================================================
// NursesDB
// ==============================================================================
const NursesDB = {
  findAll: async () =>
    (await q(`SELECT ${NURSE_COLS} FROM nurses ORDER BY created_at DESC`)).rows.map(toNurse),

  findById: async (id) =>
    toNurse((await q(`SELECT ${NURSE_COLS} FROM nurses WHERE id = $1`, [id])).rows[0]),

  insertFromUser: async (client, user, extra = {}) => {
    const specialties =
      Array.isArray(extra.specialties) && extra.specialties.length
        ? extra.specialties
        : ['wound-care', 'injections']
    await client.query(
      `INSERT INTO nurses (id, name, phone, gender, title, bio, specialties, languages,
                           governorate, area, coverage_governorates, latitude, longitude,
                           experience_years, verified, available, syndicate_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO NOTHING`,
      [
        user.id, user.name, user.phone,
        extra.gender === 'male' || extra.gender === 'female' ? extra.gender : user.gender || 'female',
        extra.title || 'ممرض مسجل',
        extra.bio || '',
        specialties,
        extra.languages || ['العربية'],
        extra.governorate || user.governorate || '',
        extra.area || user.area || '',
        extra.coverageGovernorates || (extra.governorate ? [extra.governorate] : []),
        extra.coordinates?.lat ?? null,
        extra.coordinates?.lng ?? null,
        Number(extra.experienceYears) || 0,
        // الاعتماد المهني لا يُمنح بالتسجيل — قرار الإدارة وحدها
        false,
        false,
        extra.syndicateNumber || user.syndicateNumber || null,
      ],
    )
    return toNurse(
      (await client.query(`SELECT ${NURSE_COLS} FROM nurses WHERE id = $1`, [user.id])).rows[0],
    )
  },

  update: async (id, updates) => {
    const map = {
      name: 'name', gender: 'gender', title: 'title', bio: 'bio',
      governorate: 'governorate', area: 'area', verified: 'verified',
      available: 'available', rating: 'rating', reviews: 'reviews',
      experienceYears: 'experience_years', completedSessionsCount: 'completed_sessions_count',
      walletBalance: 'wallet_balance', syndicateNumber: 'syndicate_number',
    }
    const sets = []
    const values = []
    for (const [key, column] of Object.entries(map)) {
      if (key in updates) {
        values.push(updates[key])
        sets.push(`${column} = $${values.length}`)
      }
    }
    if (Array.isArray(updates.specialties)) {
      values.push(updates.specialties)
      sets.push(`specialties = $${values.length}`)
    }
    if (Array.isArray(updates.coverageGovernorates)) {
      values.push(updates.coverageGovernorates)
      sets.push(`coverage_governorates = $${values.length}`)
    }
    if (updates.coordinates) {
      values.push(updates.coordinates.lat ?? null)
      sets.push(`latitude = $${values.length}`)
      values.push(updates.coordinates.lng ?? null)
      sets.push(`longitude = $${values.length}`)
    }

    if (!sets.length) return NursesDB.findById(id)
    values.push(id)
    await q(`UPDATE nurses SET ${sets.join(', ')} WHERE id = $${values.length}`, values)
    return NursesDB.findById(id)
  },

  setAvailable: async (id, available) => NursesDB.update(id, { available: Boolean(available) }),
  approve: async (id) => NursesDB.update(id, { verified: true, available: true }),

  listPublic: async ({ gov, specialty, available } = {}) => {
    const where = ['verified = TRUE']
    const values = []
    if (gov) {
      values.push(gov)
      where.push(`(governorate = $${values.length} OR $${values.length} = ANY(coverage_governorates))`)
    }
    if (specialty) {
      values.push(specialty)
      where.push(`$${values.length} = ANY(specialties)`)
    }
    if (available === 'true' || available === true) where.push('available = TRUE')
    const { rows } = await q(
      `SELECT ${NURSE_COLS} FROM nurses WHERE ${where.join(' AND ')}
       ORDER BY rating DESC, created_at DESC`,
      values,
    )
    return rows.map(toNurse)
  },
}

// ==============================================================================
// WalletsDB
// ==============================================================================
const WALLET_SELECT = `
  SELECT nurse_id, nurse_name, initial_welcome_credit, current_balance,
         completed_sessions_count, total_commission_deducted
  FROM wallets WHERE nurse_id = $1`

const withTransactions = async (nurseId) => {
  const row = (await q(WALLET_SELECT, [nurseId])).rows[0]
  if (!row) return null
  const { rows: txs } = await q(
    `SELECT id, type, amount, description, session_id, balance_after, created_at
     FROM wallet_transactions WHERE nurse_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [nurseId],
  )
  const balance = Number(row.current_balance)
  return {
    nurseId: row.nurse_id,
    nurseName: row.nurse_name,
    initialWelcomeCredit: Number(row.initial_welcome_credit),
    currentBalance: balance,
    completedSessionsCount: row.completed_sessions_count,
    totalCommissionDeducted: Number(row.total_commission_deducted),
    remainingSessionsQuota: Math.floor(balance / COMMISSION),
    needsRecharge: balance < COMMISSION,
    transactions: txs.map((t) => ({
      id: t.id,
      date: iso(t.created_at),
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      sessionId: t.session_id,
      balanceAfter: Number(t.balance_after),
    })),
  }
}

const WalletsDB = {
  initWallet: async (client, nurseId, nurseName = '') => {
    await client.query(
      `INSERT INTO wallets (nurse_id, nurse_name, initial_welcome_credit, current_balance)
       VALUES ($1,$2,$3,$3) ON CONFLICT (nurse_id) DO NOTHING`,
      [nurseId, nurseName, WELCOME_CREDIT],
    )
    await client.query(
      `INSERT INTO wallet_transactions (id, nurse_id, type, amount, description, balance_after)
       SELECT $1, $2, 'welcome_credit', $3, 'رصيد ترحيبي عند إنشاء حساب الممرض', $3
       WHERE NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE nurse_id = $2)`,
      [newId('tx'), nurseId, WELCOME_CREDIT],
    )
    return withTransactions(nurseId)
  },

  getWallet: async (nurseId) => withTransactions(nurseId),

  credit: async (nurseId, amount, description) => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) throw new Error('INVALID_AMOUNT')
    return tx(async (c) => {
      await c.query(
        `INSERT INTO wallets (nurse_id, current_balance) VALUES ($1, 0)
         ON CONFLICT (nurse_id) DO NOTHING`,
        [nurseId],
      )
      // التحديث الذرّي يمنع تسابق الشحنات المتزامنة
      const { rows } = await c.query(
        `UPDATE wallets SET current_balance = current_balance + $2
         WHERE nurse_id = $1 RETURNING current_balance`,
        [nurseId, value],
      )
      const balance = Number(rows[0].current_balance)
      await c.query(
        `INSERT INTO wallet_transactions (id, nurse_id, type, amount, description, balance_after)
         VALUES ($1,$2,'wallet_recharge',$3,$4,$5)`,
        [newId('tx'), nurseId, value, description || `شحن إداري ${value} ج.م`, balance],
      )
      await c.query(`UPDATE nurses SET wallet_balance = $2 WHERE id = $1`, [nurseId, balance])
      return withTransactions(nurseId)
    })
  },

  deductCommission: async (nurseId, sessionId, amount = COMMISSION) =>
    tx(async (c) => {
      const { rows } = await c.query(
        `UPDATE wallets SET
           current_balance = current_balance - $2,
           completed_sessions_count = completed_sessions_count + 1,
           total_commission_deducted = total_commission_deducted + $2
         WHERE nurse_id = $1 AND current_balance >= $2
         RETURNING current_balance`,
        [nurseId, amount],
      )
      // صفر صفوف معدَّلة = رصيد غير كافٍ
      if (!rows.length) {
        return { error: 'INSUFFICIENT_BALANCE', wallet: await withTransactions(nurseId) }
      }
      const balance = Number(rows[0].current_balance)
      await c.query(
        `INSERT INTO wallet_transactions (id, nurse_id, type, amount, description, session_id, balance_after)
         VALUES ($1,$2,'session_commission_deduction',$3,$4,$5,$6)`,
        [newId('tx'), nurseId, -amount, `خصم عمولة المنصة عن الجلسة ${sessionId}`, sessionId, balance],
      )
      await c.query(
        `UPDATE nurses SET wallet_balance = $2, completed_sessions_count = completed_sessions_count + 1
         WHERE id = $1`,
        [nurseId, balance],
      )
      return { wallet: await withTransactions(nurseId) }
    }),
}

// ==============================================================================
// SessionsDB
// ==============================================================================
// آلة الحالات — نفس قواعد db-json.js
const NEXT_STATE = {
  start_trip: 'confirmed',
  confirm_arrival: 'nurse_en_route',
  start_care: 'nurse_arrived',
  nurse_complete: 'in_progress',
  verify_otp: 'completed_by_nurse',
}

const SessionsDB = {
  findAll: async () =>
    (await q(`SELECT ${SESSION_COLS} FROM sessions ORDER BY created_at DESC`)).rows.map((r) =>
      toSession(r),
    ),

  findById: async (id, opts) =>
    toSession((await q(`SELECT ${SESSION_COLS} FROM sessions WHERE id = $1`, [id])).rows[0], opts),

  findForUser: async (user, opts) => {
    if (!user) return []
    const text =
      user.role === 'admin'
        ? `SELECT ${SESSION_COLS} FROM sessions ORDER BY created_at DESC`
        : user.role === 'nurse'
          ? `SELECT ${SESSION_COLS} FROM sessions WHERE nurse_id = $1 ORDER BY created_at DESC`
          : `SELECT ${SESSION_COLS} FROM sessions WHERE patient_id = $1 OR patient_phone = $2 ORDER BY created_at DESC`
    const values = user.role === 'patient' ? [user.id, user.phone] : [user.id]
    const { rows } = await q(text, values)
    return rows.map((r) => toSession(r, opts))
  },

  createSession: async (data) => {
    if (!data.patientName || !data.patientPhone || !data.nurseId || !data.service) {
      throw new Error('INCOMPLETE_BOOKING')
    }
    const nurse = await NursesDB.findById(data.nurseId)
    if (!nurse) throw new Error('NURSE_NOT_FOUND')
    if (!nurse.verified) throw new Error('NURSE_NOT_VERIFIED')

    const wallet = await WalletsDB.getWallet(nurse.id)
    if (wallet && wallet.currentBalance < COMMISSION) throw new Error('NURSE_NO_CREDIT')

    const code = String(crypto.randomInt(1000, 10000))
    const encrypted = encryptCode(code)
    const { rows } = await q(
      `INSERT INTO sessions (id, patient_id, patient_name, patient_phone, nurse_id, nurse_name,
                             service, service_id, date, time, status, governorate, area, address,
                             coordinates, completion_code, verification_code, platform_commission)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16,$17)
       RETURNING ${SESSION_COLS}`,
      [
        newId('s'),
        data.patientId || null,
        data.patientName,
        data.patientPhone,
        nurse.id,
        nurse.name,
        data.service,
        data.serviceId || null,
        data.date || '',
        data.time || '',
        data.status || 'confirmed',
        data.governorate || '',
        data.area || '',
        data.address || '',
        data.coordinates ? JSON.stringify(data.coordinates) : null,
        encrypted,
        COMMISSION,
      ],
    )
    // الرمز يُفك مرة واحدة هنا؛ الخادم يقرّر لمن يُرسَل
    return { ...toSession(rows[0]), completionCode: code, verificationCode: code }
  },

  update: async (id, updates) => {
    const map = {
      status: 'status', nurseNotes: 'nurse_notes', commissionDeducted: 'commission_deducted',
      arrivalConfirmed: 'arrival_confirmed', governorate: 'governorate', area: 'area',
    }
    const sets = []
    const values = []
    for (const [key, column] of Object.entries(map)) {
      if (key in updates) {
        values.push(updates[key])
        sets.push(`${column} = $${values.length}`)
      }
    }
    const stamps = { arrivedAt: 'arrived_at', completedAt: 'completed_at', confirmedAt: 'confirmed_at' }
    for (const [key, column] of Object.entries(stamps)) {
      if (key in updates) {
        values.push(updates[key])
        sets.push(`${column} = $${values.length}`)
      }
    }
    if (updates.vitalSigns) {
      values.push(JSON.stringify(updates.vitalSigns))
      sets.push(`vital_signs = $${values.length}`)
    }
    if (updates.coordinates) {
      values.push(JSON.stringify(updates.coordinates))
      sets.push(`coordinates = $${values.length}`)
    }
    if (!sets.length) return SessionsDB.findById(id)
    values.push(id)
    await q(`UPDATE sessions SET ${sets.join(', ')} WHERE id = $${values.length}`, values)
    return SessionsDB.findById(id)
  },


  /**
   * تنفيذ إجراء داخل معاملة واحدة مع قفل الصف (SELECT ... FOR UPDATE).
   * هذا ما يجعل الخصم المزدوج مستحيلاً: الطلبان المتزامنان يُسلسَلان، فيرى
   * الثاني الحالة بعد الأول ويتوقف بلا خصم إضافي. وقيد UNIQUE على
   * records.session_id خط دفاع ثانٍ على مستوى المحرك نفسه.
   */
  applyAction: async (id, action, payload = {}) => {
    const { rows: found } = await q(`SELECT id FROM sessions WHERE id = $1`, [id])
    if (!found.length) return { success: false, message: 'الجلسة غير موجودة' }

    try {
      return await tx(async (c) => {
        const { rows } = await c.query(`SELECT * FROM sessions WHERE id = $1 FOR UPDATE`, [id])
        const session = rows[0]
        const stamp = new Date().toISOString()

        const finish = async () => {
          const { rows: r } = await c.query(`SELECT ${SESSION_COLS} FROM sessions WHERE id = $1`, [id])
          return { success: true, session: toSession(r[0]) }
        }

        // 1) قواعد آلة الحالات
        if (action in NEXT_STATE) {
          if (action === 'verify_otp') {
            if (
              session.status !== 'completed_by_nurse' &&
              session.status !== 'confirmed_completed'
            ) {
              return { success: false, message: 'لا يمكن تأكيد الجلسة قبل إنهائها من الممرض' }
            }
          } else if (session.status !== NEXT_STATE[action]) {
            return { success: false, message: 'هذا الإجراء غير متاح في الوضع الحالي للجلسة' }
          }
        }

        // 2) إجراءات الممرض
        if (action === 'start_trip') {
          await c.query(`UPDATE sessions SET status = 'nurse_en_route' WHERE id = $1`, [id])
          return finish()
        }
        if (action === 'confirm_arrival') {
          await c.query(
            `UPDATE sessions SET status = 'nurse_arrived', arrival_confirmed = TRUE,
               arrived_at = $2 WHERE id = $1`,
            [id, stamp],
          )
          return finish()
        }
        if (action === 'start_care') {
          await c.query(`UPDATE sessions SET status = 'in_progress' WHERE id = $1`, [id])
          return finish()
        }
        if (action === 'nurse_complete') {
          await c.query(
            `UPDATE sessions SET status = 'completed_by_nurse', completed_at = $2,
               nurse_notes = COALESCE($3, nurse_notes),
               vital_signs = COALESCE($4, vital_signs)
             WHERE id = $1`,
            [
              id, stamp, payload.nurseNotes || null,
              payload.vitalSigns ? JSON.stringify(payload.vitalSigns) : null,
            ],
          )
          return finish()
        }

        // 3) تأكيد الرمز + خصم العمولة (كله في معاملة واحدة)
        if (action === 'verify_otp') {
          const given = String(payload.code || '').trim()
          const expected = decryptCode(session.completion_code)
          if (!expected || given !== expected) {
            return { success: false, message: 'رمز التحقق غير صحيح' }
          }
          // طلب مكرر لنفس الجلسة المؤكدة: نجاح إجرائي بلا خصم
          if (session.status === 'confirmed_completed') {
            return { success: true, session: toSession(session) }
          }

          // الخصم ذرّي: شرط الرصيد مضمّن داخل جملة UPDATE نفسها
          const { rows: debited } = await c.query(
            `UPDATE wallets SET
               current_balance = current_balance - $2,
               completed_sessions_count = completed_sessions_count + 1,
               total_commission_deducted = total_commission_deducted + $2
             WHERE nurse_id = $1 AND current_balance >= $2
             RETURNING current_balance`,
            [session.nurse_id, COMMISSION],
          )
          if (!debited.length) {
            return { success: false, message: 'رصيد الممرض غير كافٍ لخصم العمولة' }
          }
          const balance = Number(debited[0].current_balance)

          await c.query(
            `INSERT INTO wallet_transactions (id, nurse_id, type, amount, description, session_id, balance_after)
             VALUES ($1,$2,'session_commission_deduction',$3,$4,$5,$6)`,
            [
              newId('tx'), session.nurse_id, -COMMISSION,
              `خصم عمولة المنصة عن الجلسة ${session.id}`, session.id, balance,
            ],
          )
          await c.query(
            `UPDATE nurses SET wallet_balance = $2, completed_sessions_count = completed_sessions_count + 1
             WHERE id = $1`,
            [session.nurse_id, balance],
          )
          await c.query(
            `UPDATE sessions SET status = 'confirmed_completed', arrival_confirmed = TRUE,
               commission_deducted = TRUE, confirmed_at = $2 WHERE id = $1`,
            [id, stamp],
          )
          // قيد UNIQUE على records.session_id يمنع التوثيق المزدوج نهائياً
          try {
            await c.query(
              `INSERT INTO records (id, session_id, patient_id, patient_phone, title, type, date, encrypted, notes)
               VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8)`,
              [
                newId('r'), session.id, session.patient_id, session.patient_phone,
                `تقرير جلسة: ${session.service}`, 'تقرير',
                stamp.slice(0, 10), session.nurse_notes || '',
              ],
            )
          } catch (err) {
            if (err.code === '23505') throw new Error('ALREADY_DOCUMENTED')
            throw err
          }
          const { rows: r } = await c.query(`SELECT ${SESSION_COLS} FROM sessions WHERE id = $1`, [id])
          return {
            success: true,
            session: toSession(r[0]),
            wallet: await withTransactions(session.nurse_id),
          }
        }

        return { success: false, message: 'إجراء غير معروف' }
      })
    } catch (err) {
      if (err.message === 'ALREADY_DOCUMENTED') {
        return {
          success: false,
          message: 'تم توثيق هذه الجلسة مسبقاً. لا يمكن الخصم مرتين على نفس الجلسة.',
        }
      }
      throw err
    }
  },
}

// ==============================================================================
// RecordsDB
// ==============================================================================
const RecordsDB = {
  findAll: async () => (await q('SELECT * FROM records ORDER BY created_at DESC')).rows,

  findForPatient: async (patientId, patientPhone) =>
    (await q(
      `SELECT * FROM records WHERE patient_id = $1 OR patient_phone = $2
       ORDER BY created_at DESC`,
      [patientId, patientPhone],
    )).rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      patientId: r.patient_id,
      patientPhone: r.patient_phone,
      title: r.title,
      type: r.type,
      date: r.date,
      encrypted: r.encrypted,
      notes: r.notes,
    })),

  /** توثيق جلسة — القيد UNIQUE على session_id يجعل الاستدعاء المتكرر آمناً */
  createFromSession: async (session) => {
    if (!session) return null
    const id = newId('r')
    try {
      await q(
        `INSERT INTO records (id, session_id, patient_id, patient_phone, title, type, date, encrypted, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8)
         ON CONFLICT (session_id) DO NOTHING`,
        [
          id, session.id, session.patientId || null, session.patientPhone,
          `تقرير جلسة: ${session.service}`, 'تقرير',
          String(session.date || new Date().toISOString().slice(0, 10)),
          session.nurseNotes || '',
        ],
      )
    } catch (err) {
      if (err.code === '23505') return null
      throw err
    }
    return { id, sessionId: session.id }
  },
}

module.exports = {
  pool, tx, COMMISSION, WELCOME_CREDIT,
  UsersDB, OtpDB, NursesDB, WalletsDB, SessionsDB, RecordsDB,
  verifyPassword, hashPassword, encryptCode, decryptCode,
  isPostgres: true,
}

