// اختبار شامل من طرف إلى طرف لمنطق العمل الحقيقي على قاعدة البيانات
// التشغيل:  node e2e-test.js   (بعد تشغيل الخادم)
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

const BASE = process.env.TEST_BASE || `http://localhost:${process.env.PORT || 5000}`
const DATA_DIR = path.join(__dirname, 'data')

let pass = 0
let fail = 0
const failures = []
const trace = []

function check(name, cond, extra) {
  if (cond) {
    pass++
    trace.push(`PASS | ${name}`)
    console.log(`  OK  ${name}`)
  } else {
    fail++
    failures.push(`${name}${extra !== undefined ? ` -> ${JSON.stringify(extra)}` : ''}`)
    trace.push(`FAIL | ${name} | ${JSON.stringify(extra)}`)
    console.log(`  FAIL ${name}${extra !== undefined ? ` -> ${JSON.stringify(extra)}` : ''}`)
  }
}

async function api(pathname, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await res.json()
  } catch {
    /* استجابة بلا JSON */
  }
  return { status: res.status, body: json }
}

// قراءة رمز التحقق الفعلي من ملف التخزين (وضع التطوير بلا مزوّد SMS)
function readOtp(phone) {
  const file = path.join(DATA_DIR, 'otps.json')
  if (!fs.existsSync(file)) return null
  const table = JSON.parse(fs.readFileSync(file, 'utf8'))
  const digitsOnly = String(phone).replace(/\D/g, '')
  const entry = [...table]
    .reverse()
    .find((o) => String(o.phone || '').replace(/\D/g, '') === digitsOnly && !o.isUsed)
  return entry ? entry.otpCode : null
}

// أرقام عشوائية صالحة (11 رقماً تبدأ بـ 01) لكل تشغيل حتى لا تتعارض الاختبارات
const digits = crypto.randomInt(1000, 9999).toString()
const PATIENT_PHONE = `0111000${digits}`
const NURSE_PHONE = `0122000${digits}`
const STRANGER_PHONE = `0153000${digits}`
const ADMIN_PHONE = '01000000000'

// تسجيل (إن لم يكن موجوداً) ثم الدخول برمز التحقق
async function login(phone, role, name) {
  const account =
    role === 'nurse'
      ? {
          phone,
          password: 'Str0ngPass!123',
          name,
          role: 'nurse',
          syndicateNumber: `SN-${phone.slice(-6)}`,
          governorate: 'القاهرة',
          area: 'مدينة نصر',
          experienceYears: 7,
        }
      : {
          phone,
          password: 'Str0ngPass!123',
          name,
          role: 'patient',
          nationalId: '2' + phone.slice(1).padEnd(13, '0'),
        }
  await api('/api/v1/auth/register', { method: 'POST', body: account })

  const sent = await api('/api/v1/auth/send-otp', { method: 'POST', body: { phone } })
  if (sent.status !== 200) {
    throw new Error(`فشل إرسال الرمز للرقم ${phone} (len=${phone.length}): ${JSON.stringify(sent.body)}`)
  }

  const code = readOtp(phone)
  if (!code) throw new Error(`تعذّر قراءة رمز التحقق للرقم ${phone}`)
  const res = await api('/api/v1/auth/verify-otp', {
    method: 'POST',
    body: { phone, otpCode: code },
  })
  if (res.status !== 200) throw new Error(`فشل الدخول: ${JSON.stringify(res.body)}`)
  return res.body.token
}

module.exports = { api, check, readOtp, PATIENT_PHONE, NURSE_PHONE, STRANGER_PHONE, ADMIN_PHONE, login, BASE, DATA_DIR, crypto,
  results: () => ({ pass, fail, failures }) }

async function main() {
  console.log(`\n=== اختبار شامل على ${BASE} ===\n`)

  console.log('[1] الصحة والتسجيل والدخول')
  const health = await api('/api/v1/health')
  check('الخادم يعمل', health.status === 200 && health.body.status === 'online')

  const reg = await api('/api/v1/auth/register', {
    method: 'POST',
    body: {
      phone: PATIENT_PHONE,
      password: 'Str0ngPass!123',
      name: 'مريض الاختبار',
      role: 'patient',
      nationalId: '2' + PATIENT_PHONE.slice(1).padEnd(13, '0'),
    },
  })
  check('تسجيل مريض جديد', reg.status === 201, reg.body)

  const dupReg = await api('/api/v1/auth/register', {
    method: 'POST',
    body: {
      phone: PATIENT_PHONE,
      password: 'Str0ngPass!123',
      name: 'مريض مكرر',
      role: 'patient',
      nationalId: '2' + PATIENT_PHONE.slice(1).padEnd(13, '0'),
    },
  })
  check('منع التسجيل برقم مكرر', dupReg.status === 409, dupReg.body)

  const shortPass = await api('/api/v1/auth/register', {
    method: 'POST',
    body: { phone: `0155000${digits}`, password: '123', name: 'ضعيف', role: 'patient', nationalId: '29999999999999' },
  })
  check('رفض كلمة مرور قصيرة', shortPass.status === 400, shortPass.body)

  const nurseNoSyndicate = await api('/api/v1/auth/register', {
    method: 'POST',
    body: { phone: `0156000${digits}`, password: 'Str0ngPass!123', name: 'ممرض بلا نقابة', role: 'nurse' },
  })
  check('رفض ممرض بلا رقم نقابة', nurseNoSyndicate.status === 400, nurseNoSyndicate.body)

  const patientNoNational = await api('/api/v1/auth/register', {
    method: 'POST',
    body: { phone: `0157000${digits}`, password: 'Str0ngPass!123', name: 'مريض بلا رقم', role: 'patient' },
  })
  check('رفض مريض بلا رقم قومي', patientNoNational.status === 400, patientNoNational.body)

  // كلمة مرور خاطئة يجب ألا تمنح تسجيلاً
  const beforeWrongPass = await api('/api/v1/auth/send-otp', {
    method: 'POST',
    body: { phone: `0158000${digits}` },
  })
  check('لا يمكن إرسال رمز لرقم غير مسجّل', beforeWrongPass.status === 404, beforeWrongPass.body)

  const badOtp = await api('/api/v1/auth/verify-otp', {
    method: 'POST',
    body: { phone: PATIENT_PHONE, otpCode: '0000' },
  })
  check('رفض رمز تحقق خاطئ', badOtp.status === 400, badOtp.body)

  const patientToken = await login(PATIENT_PHONE, 'patient', 'مريض الاختبار')
  const nurseToken = await login(NURSE_PHONE, 'nurse', 'ممرض الاختبار')
  const adminToken = await login(ADMIN_PHONE, 'admin', 'إدارة المنصة')
  const strangerToken = await login(STRANGER_PHONE, 'patient', 'دخيل')
  check('الحصول على توكن مريض', Boolean(patientToken))
  check('الحصول على توكن ممرض', Boolean(nurseToken))
  check('ترقية الرقم المحدد إلى مدير', Boolean(adminToken))

  const noAuth = await api('/api/v1/sessions')
  check('رفض الطلبات بدون توكن', noAuth.status === 401, noAuth.body)

  const fakeAuth = await api('/api/v1/sessions', { token: 'invalid.token.here' })
  check('رفض التوكن المزيّف', fakeAuth.status === 401, fakeAuth.body)

  console.log('\n[2] الملف الشخصي والأدوار')
  const me = await api('/api/v1/auth/me', { token: nurseToken })
  check('مسار /auth/me يعمل للممرض', me.status === 200 && me.body.user.role === 'nurse', me.body)
  check('محفظة الممرض مصاحبة للملف', Boolean(me.body.wallet), me.body.wallet)

  const mePatient = await api('/api/v1/auth/me', { token: patientToken })
  check('المريض لا يرى محفظة', mePatient.body.wallet === null, mePatient.body.wallet)

  const escalated = await api('/api/v1/admin/nurses', { token: patientToken })
  check('المريض ممنوع من قائمة الإدارة', escalated.status === 403, escalated.body)

  const roleHijack = await api('/api/v1/auth/me', { token: patientToken, method: 'POST' })
  check('لا يمكن انتحال دور عبر الطلب', roleHijack.status === 405 || roleHijack.status === 404)

  console.log('\n[3] اعتماد الممرض من الإدارة')
  const publicBefore = await api('/api/v1/nurses')
  const listedBefore = publicBefore.body.nurses || []
  check(
    'الممرض غير المعتمد مخفي من القائمة العامة',
    !listedBefore.some((n) => String(n.phone) === NURSE_PHONE),
    { total: listedBefore.length },
  )

  const adminList = await api('/api/v1/admin/nurses', { token: adminToken })
  check('الإدارة ترى كل الممرضين', adminList.status === 200 && (adminList.body.nurses || []).length > 0)

  const target = (adminList.body.nurses || []).find((n) => String(n.phone) === NURSE_PHONE)
  check('وجود الممرض في قائمة الإدارة', Boolean(target))

  const approve = await api(`/api/v1/admin/nurses/${target.id}/approve`, {
    method: 'POST',
    token: adminToken,
  })
  check('اعتماد الممرض', approve.status === 200, approve.body)

  const patientApprove = await api(`/api/v1/admin/nurses/${target.id}/approve`, {
    method: 'POST',
    token: patientToken,
  })
  check('المريض لا يستطيع اعتماد ممرض', patientApprove.status === 403, patientApprove.body)

  const publicAfter = await api('/api/v1/nurses')
  check(
    'الممرض المعتمد ظهر في القائمة العامة',
    (publicAfter.body.nurses || []).some((n) => n.id === target.id),
  )

  console.log('\n[4] تحديث الموقع والتوفر')
  const wrongOwner = await api(`/api/v1/nurses/${target.id}/location`, {
    method: 'PATCH',
    token: patientToken,
    body: { governorate: 'أسيوط' },
  })
  check('منع المريض من تعديل موقع ممرض آخر', wrongOwner.status === 403, wrongOwner.body)

  const loc = await api(`/api/v1/nurses/${target.id}/location`, {
    method: 'PATCH',
    token: nurseToken,
    body: { governorate: 'القاهرة', area: 'مدينة نصر', available: true },
  })
  check('الممرض يحدّث موقعه', loc.status === 200, loc.body)

  const locVerify = await api(`/api/v1/nurses/${target.id}`)
  check('الموقع محفوظ فعلياً', locVerify.body.nurse?.governorate === 'القاهرة', locVerify.body.nurse)

  console.log('\n[5] حجز جلسة')
  const session = await api('/api/v1/sessions', {
    method: 'POST',
    token: patientToken,
    body: {
      nurseId: target.id,
      serviceId: 'wound-care',
      service: 'غيار الجروح والتقرحات',
      date: '2026-10-01',
      time: '10:00 ص',
      governorate: 'القاهرة',
      area: 'مدينة نصر',
      address: 'شارع عباس العقاد، عمارة 14',
    },
  })
  check('إنشاء جلسة', session.status === 201, session.body)
  const sid = session.body.session?.id
  check('الجلسة تحتوي رمز تحقق للمريض', Boolean(session.body.session?.completionCode))

  const incomplete = await api('/api/v1/sessions', {
    method: 'POST',
    token: patientToken,
    body: { nurseId: target.id },
  })
  check('رفض حجز ناقص البيانات', incomplete.status === 400, incomplete.body)

  const badNurse = await api('/api/v1/sessions', {
    method: 'POST',
    token: patientToken,
    body: {
      nurseId: 'nurse-9999',
      serviceId: 'wound-care',
      service: 'x',
      date: '2026-10-01',
      time: '10:00 ص',
      governorate: 'القاهرة',
      area: 'x',
      address: 'x',
    },
  })
  check('رفض الحجز بممرض غير موجود', badNurse.status === 404, badNurse.body)

  console.log('\n[6] دورة الحالة والصلاحيات')
  const spy = await api(`/api/v1/sessions/${sid}`, { token: strangerToken })
  check('منع مستخدم غير مشارك من قراءة الجلسة', spy.status === 403, spy.body)

  const patientStart = await api(`/api/v1/sessions/${sid}`, {
    method: 'PATCH',
    token: patientToken,
    body: { action: 'start_trip' },
  })
  check(
    'patient-cannot-start-nurse-trip',
    patientStart.status === 403,
    { http: patientStart.status, body: patientStart.body },
  )

  const steps = [
    ['start_trip', 'بدء الرحلة'],
    ['confirm_arrival', 'تأكيد الوصول'],
    ['start_care', 'بدء الرعاية'],
    ['nurse_complete', 'إنهاء من الممرض'],
  ]
  for (const [action, label] of steps) {
    const r = await api(`/api/v1/sessions/${sid}`, {
      method: 'PATCH',
      token: nurseToken,
      body: { action },
    })
    check(label, r.status === 200, r.body)
  }

  const skip = await api(`/api/v1/sessions/${sid}`, {
    method: 'PATCH',
    token: nurseToken,
    body: { action: 'start_trip' },
  })
  check('منع القفز فوق الحالات', skip.status === 400, skip.body)

  const nurseView = await api(`/api/v1/sessions/${sid}`, { token: nurseToken })
  check(
    'الممرض لا يرى رمز التحقق',
    nurseView.body.session?.completionCode === undefined,
    nurseView.body.session,
  )

  const patientView = await api(`/api/v1/sessions/${sid}`, { token: patientToken })
  const code = patientView.body.session?.completionCode
  check('المريض يرى رمز التحقق الخاص به', Boolean(code))

  console.log('\n[7] تأكيد الرمز والعمولة')
  const walletBefore = await api(`/api/v1/nurse/wallet/${target.id}`, { token: nurseToken })
  const balBefore = walletBefore.body.wallet?.currentBalance
  check('قراءة رصيد قبل التأكيد', typeof balBefore === 'number', walletBefore.body)

  const wrongCode = await api(`/api/v1/sessions/${sid}`, {
    method: 'PATCH',
    token: nurseToken,
    body: { action: 'verify_otp', code: '9999' },
  })
  check('رفض رمز تحقق خاطئ', wrongCode.status === 400, wrongCode.body)

  const strangerConfirm = await api('/api/v1/sessions/confirm-otp', {
    method: 'POST',
    token: strangerToken,
    body: { sessionId: sid, completionCode: code },
  })
  check('منع الغريب من تأكيد الجلسة', strangerConfirm.status === 403, strangerConfirm.body)

  const patientConfirmFirst = await api('/api/v1/sessions/confirm-otp', {
    method: 'POST',
    token: patientToken,
    body: { sessionId: sid, completionCode: code },
  })
  check('المريض المعني يستطيع التأكيد عبر المسار المخصص', patientConfirmFirst.status === 200, patientConfirmFirst.body)

  const walletAfter = await api(`/api/v1/nurse/wallet/${target.id}`, { token: nurseToken })
  const balAfter = walletAfter.body.wallet?.currentBalance
  check('خصم العمولة مرة واحدة فقط', balAfter === balBefore - 10, { balBefore, balAfter })

  const doubleConfirm = await api(`/api/v1/sessions/${sid}`, {
    method: 'PATCH',
    token: nurseToken,
    body: { action: 'verify_otp', code },
  })
  // إعادة التأكيد إجرائية (idempotent): يعيد نفس النتيجة بلا خصم ثانٍ
  check('double-confirm-is-idempotent', doubleConfirm.status === 200, {
    http: doubleConfirm.status,
    body: doubleConfirm.body,
  })

  const walletFinal = await api(`/api/v1/nurse/wallet/${target.id}`, { token: nurseToken })
  check(
    'balance-unchanged-after-second-attempt',
    walletFinal.body.wallet?.currentBalance === balAfter,
    {
      http: walletFinal.status,
      balBefore,
      balAfter,
      final: walletFinal.body.wallet?.currentBalance,
      doubleConfirmHttp: doubleConfirm.status,
      doubleConfirmBody: doubleConfirm.body,
    },
  )

  const confirmAgain = await api('/api/v1/sessions/confirm-otp', {
    method: 'POST',
    token: adminToken,
    body: { sessionId: sid, completionCode: code },
  })
  check('confirm-otp-endpoint-is-idempotent', confirmAgain.status === 200, {
    http: confirmAgain.status,
    body: confirmAgain.body,
  })

  console.log('\n[8] السجلات وقائمة الجلسات')
  const records = await api('/api/v1/records', { token: patientToken })
  check('سجلات المريض موجودة', records.status === 200 && (records.body.records || []).length > 0, records.body)

  const mySessions = await api('/api/v1/sessions', { token: patientToken })
  check('قائمة جلسات المريض', (mySessions.body.sessions || []).some((s) => s.id === sid))

  const strangerSessions = await api('/api/v1/sessions', { token: strangerToken })
  check(
    'لا تظهر جلسات الغريب له',
    !(strangerSessions.body.sessions || []).some((s) => s.id === sid),
  )

  const strangerWallet = await api(`/api/v1/nurse/wallet/${target.id}`, { token: strangerToken })
  check('منع الغريب من قراءة محفظة غيره', strangerWallet.status === 403, strangerWallet.body)

  console.log('\n[9] الفرز الطبي')
  const t1 = await api('/api/v1/triage', { method: 'POST', body: { symptoms: 'ألم شديد في الصدر' } })
  check('ألم الصدر => طارئ', t1.body.urgency === 'emergency', t1.body)

  const t2 = await api('/api/v1/triage', {
    method: 'POST',
    body: { symptoms: 'جرح في الساق يحتاج غيار', age: '40' },
  })
  check('جرح => روتين', t2.body.urgency === 'routine', t2.body)

  const t3 = await api('/api/v1/triage', {
    method: 'POST',
    body: { symptoms: 'ألم في الظهر', age: '72', history: 'سكري' },
  })
  check('كبار السن + مزمن => عاجل', t3.body.urgency === 'urgent', t3.body)
  check('الخادم يعيد البيانات السريرية', t3.body.input?.age === 72, t3.body.input)

  const t4 = await api('/api/v1/triage', { method: 'POST', body: {} })
  check('رفض طلب بلا أعراض', t4.status === 400)

  console.log(`\n=== النتيجة: ${pass} ناجح / ${fail} فاشل ===`)
  if (fail) {
    console.log('الاختبارات الفاشلة:')
    failures.forEach((f) => console.log(`  - ${f}`))
  }
  // ملخص بترميز ASCII ليسهل قراءته من أي محرر طرف
  fs.writeFileSync(
    path.join(__dirname, 'e2e-result.txt'),
    `PASS=${pass}\nFAIL=${fail}\n--- FAILURES ---\n${failures.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n--- TRACE ---\n${trace.join('\n')}\n`,
    'utf8',
  )
  if (fail) process.exit(1)
}

main().catch((err) => {
  console.error('\nفشل الاختبار:', err)
  process.exit(1)
})