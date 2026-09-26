// فحص سريع لمسار التجربة: دخول -> حجز -> قراءة الرمز
// يجلب رمز تحقق جديداً ويقرأه من data/otps.json (وضع التطوير بلا مزوّد SMS)،
// فيمكن تشغيله أكثر من مرة دون أن يفشل.
const fs = require('fs')
const path = require('path')

const BASE = 'http://localhost:5000'
const OTP_FILE = path.join(__dirname, 'data', 'otps.json')

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, body: await res.json() }
}

// اطلب رمزاً جديداً ثم اقرأه من ملف التخزين المحلي
async function login(phone) {
  await call('/api/v1/auth/send-otp', { method: 'POST', body: { phone } })
  const table = JSON.parse(fs.readFileSync(OTP_FILE, 'utf8'))
  const code = [...table]
    .reverse()
    .find((o) => String(o.phone).replace(/\D/g, '') === phone && !o.isUsed)?.otpCode
  return call('/api/v1/auth/verify-otp', { method: 'POST', body: { phone, otpCode: code } })
}

async function main() {
  const nurses = await call('/api/v1/nurses')
  console.log('nurses listed:', nurses.body.nurses.map((n) => n.name).join(' | '))

  const patient = await login('01011112222')
  console.log('patient login:', patient.status, patient.body.user?.name, '| role:', patient.body.user?.role)

  const nurse = await login('01022223333')
  console.log('nurse login  :', nurse.status, nurse.body.user?.name, '| role:', nurse.body.user?.role)
  console.log('nurse wallet :', nurse.body.wallet?.currentBalance, 'EGP')

  const admin = await login('01000000000')
  console.log('admin login  :', admin.status, '| role:', admin.body.user?.role)

  const target = nurses.body.nurses[0]
  const booking = await call('/api/v1/sessions', {
    method: 'POST',
    token: patient.body.token,
    body: {
      nurseId: target.id,
      serviceId: 'wound-care',
      service: 'غيار الجروح والتقرحات',
      date: '2026-10-05',
      time: '10:00 ص',
      governorate: 'القاهرة',
      area: 'مدينة نصر',
      address: 'شارع عباس العقاد',
    },
  })
  console.log('booking      :', booking.status, booking.body.session?.id, '|', booking.body.session?.status)
  console.log('patient OTP  :', booking.body.session?.completionCode)

  const list = await call('/api/v1/sessions', { token: patient.body.token })
  console.log('my sessions  :', list.body.total)

  const adminList = await call('/api/v1/admin/nurses', { token: admin.body.token })
  console.log('admin nurses :', adminList.body.nurses?.length)
}

main().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})