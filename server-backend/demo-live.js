// Ø¹Ø±Ø¶ Ø­ÙŠÙ‘: Ø¯ÙˆØ±Ø© Ø­ÙŠØ§Ø© ÙƒØ§Ù…Ù„Ø© Ø¹Ø¨Ø± HTTP Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ â€” Ù…Ù† Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø¥Ù„Ù‰ Ø®ØµÙ… Ø§Ù„Ø¹Ù…ÙˆÙ„Ø©
require('dotenv').config()
const fs = require('fs')
const path = require('path')

const BASE = 'http://localhost:5000'
const OTP = path.join(__dirname, 'data', 'otps.json')

async function api(p, { method = 'GET', body, token } = {}) {
  const res = await fetch(BASE + p, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

const step = (n, t) => console.log(`\n${'-'.repeat(56)}\n[${n}] ${t}\n${'-'.repeat(56)}`)

async function login(phone, role, name) {
  const body =
    role === 'nurse'
      ? { phone, password: '123456', name, role: 'nurse', syndicateNumber: `SN-${phone.slice(-5)}`, governorate: 'Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©', area: 'Ù…Ø¯ÙŠÙ†Ø© Ù†ØµØ±', experienceYears: 9, gender: 'female' }
      : { phone, password: '123456', name, role: 'patient', nationalId: '2' + phone.slice(1).padEnd(13, '0') }

  const reg = await api('/api/v1/auth/register', { method: 'POST', body })
  if (reg.status >= 400 && reg.status !== 409) {
    throw new Error(`register ${reg.status}: ${JSON.stringify(reg.body)}`)
  }
  const sent = await api('/api/v1/auth/send-otp', { method: 'POST', body: { phone } })
  if (sent.status !== 200) {
    throw new Error(`send-otp ${sent.status}: ${JSON.stringify(sent.body)}`)
  }
  if (!fs.existsSync(OTP)) throw new Error('otps.json Ù„Ù… ÙŠÙÙ†Ø´Ø£ Ø¨Ø¹Ø¯ send-otp')
  const table = JSON.parse(fs.readFileSync(OTP, 'utf8'))
  const code = [...table].reverse().find((o) => o.phone === phone && !o.isUsed)?.otpCode
  if (!code) throw new Error('Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø±Ù…Ø² ØªØ­Ù‚Ù‚ ØµØ§Ù„Ø­ ÙÙŠ Ø§Ù„Ù…Ù„Ù')
  const r = await api('/api/v1/auth/verify-otp', { method: 'POST', body: { phone, otpCode: code } })
  if (r.status !== 200) throw new Error(`verify-otp ${r.status}: ${JSON.stringify(r.body)}`)
  return r.body
}

async function main() {
  const H = await api('/api/v1/health')
  console.log(`\nØ§Ù„Ø®Ø§Ø¯Ù…: ${H.body.status} | Ø§Ù„Ù‚Ø§Ø¹Ø¯Ø©: ${H.body.database.engine} (${H.body.database.status}) | SMS: ${H.body.sms.provider}`)

  // Ø¨Ø§Ø¯Ø¦Ø© 5 Ø£Ø­Ø±Ù + 6 = 11 Ø±Ù‚Ù…Ø§Ù‹ (Ø§Ù„ØµÙŠØºØ© Ø§Ù„Ù…ØµØ±ÙŠØ© 01xxxxxxxxx)
  const n = String(Date.now()).slice(-6)
  const P = `01011${n}`
  const N = `01022${n}`

  step(1, 'ØªØ³Ø¬ÙŠÙ„ Ù…Ø±ÙŠØ¶ ÙˆÙ…Ù…Ø±Ø¶ (Ø­Ø³Ø§Ø¨Ø§Øª Ø¬Ø¯ÙŠØ¯Ø©)')
  const patient = await login(P, 'patient', 'Ø³Ø§Ø±Ø© Ø¥Ø¨Ø±Ø§Ù‡ÙŠÙ…')
  const nurse = await login(N, 'nurse', 'Ø£. Ù†ÙˆØ± Ø­Ø³Ù†')
  console.log(`  Ø§Ù„Ù…Ø±ÙŠØ¶ : ${patient.user.name}  (${patient.user.role})`)
  console.log(`  Ø§Ù„Ù…Ù…Ø±Ø¶ : ${nurse.user.name}  (${nurse.user.role})`)
  console.log(`  Ù…Ø­ÙØ¸Ø© Ø§Ù„Ù…Ù…Ø±Ø¶ Ø¹Ù†Ø¯ Ø§Ù„ØªØ³Ø¬ÙŠÙ„: ${nurse.wallet.currentBalance} Ø¬.Ù…`)

  step(2, 'Ø§Ù„Ù…Ù…Ø±Ø¶ ØºÙŠØ± Ù…Ø¹ØªÙ…Ø¯ Ø¨Ø¹Ø¯ â€” Ù…Ø®ÙÙŠ Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¹Ø§Ù…Ø©')
  let list = await api('/api/v1/nurses')
  console.log(`  Ù…Ù…Ø±Ø¶ÙˆÙ† ÙÙŠ /nurses: ${list.body.count}  <- Ø§Ù„Ù…Ù…Ø±Ø¶ Ø§Ù„Ø¬Ø¯ÙŠØ¯ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯`)

  step(3, 'Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…Ø¯ÙŠØ± ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ù…Ø±Ø¶')
  const admin = await login('01000000000', 'patient', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ù†ØµØ©')
  const approve = await api(`/api/v1/admin/nurses/${nurse.user.id}/approve`, { method: 'POST', token: admin.token })
  console.log(`  Ø§Ø¹ØªÙ…Ø§Ø¯: HTTP ${approve.status}  verified=${approve.body.nurse?.verified}`)
  list = await api('/api/v1/nurses')
  console.log(`  Ù…Ù…Ø±Ø¶ÙˆÙ† ÙÙŠ /nurses Ø§Ù„Ø¢Ù†: ${list.body.count}  <- Ø¸Ù‡Ø± Ø¨Ø¹Ø¯ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯`)

  step(4, 'Ø§Ù„Ù…Ø±ÙŠØ¶ ÙŠØ­Ø¬Ø² Ø¬Ù„Ø³Ø©')
  const target = list.body.nurses.find((x) => x.id === nurse.user.id)
  const booking = await api('/api/v1/sessions', {
    method: 'POST',
    token: patient.token,
    body: {
      nurseId: target.id, serviceId: 'wound-care',
      service: 'ØºÙŠØ§Ø± Ø§Ù„Ø¬Ø±ÙˆØ­ ÙˆØ§Ù„ØªÙ‚Ø±Ø­Ø§Øª', date: '2026-10-10', time: '10:00 Øµ',
      governorate: 'Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©', area: 'Ù…Ø¯ÙŠÙ†Ø© Ù†ØµØ±', address: 'Ø´Ø§Ø±Ø¹ Ø¹Ø¨Ø§Ø³ Ø§Ù„Ø¹Ù‚Ø§Ø¯ØŒ Ø¹Ù…Ø§Ø±Ø© 14',
    },
  })
  const sid = booking.body.session.id
  const code = booking.body.session.completionCode
  console.log(`  Ø§Ù„Ø¬Ù„Ø³Ø©: ${sid}  Ø§Ù„Ø­Ø§Ù„Ø©: ${booking.body.session.status}`)
  console.log(`  Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ (Ù„Ù„Ù…Ø±ÙŠØ¶ ÙÙ‚Ø·): ${code}`)

  step(5, 'Ø§Ù„Ù…Ù…Ø±Ø¶ ÙŠÙ‚Ø±Ø£ Ø§Ù„Ø¬Ù„Ø³Ø© â€” ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØ±Ù‰ Ø§Ù„Ø±Ù…Ø²')
  const nurseView = await api(`/api/v1/sessions/${sid}`, { token: nurse.token })
  console.log(`  completionCode Ø¹Ù†Ø¯ Ø§Ù„Ù…Ù…Ø±Ø¶: ${nurseView.body.session.completionCode ?? '(Ù…Ø®ÙÙŠ â€” ØµØ­ÙŠØ­)'}`)

  step(6, 'Ø¯ÙˆØ±Ø© Ø­Ø§Ù„Ø© Ø§Ù„Ø¬Ù„Ø³Ø©: Ø±Ø­Ù„Ø© -> ÙˆØµÙˆÙ„ -> Ø±Ø¹Ø§ÙŠØ© -> Ø¥Ù†Ù‡Ø§Ø¡')
  for (const action of ['start_trip', 'confirm_arrival', 'start_care', 'nurse_complete']) {
    const r = await api(`/api/v1/sessions/${sid}`, { method: 'PATCH', token: nurse.token, body: { action } })
    console.log(`  ${action.padEnd(16)} -> ${r.status}  Ø§Ù„Ø­Ø§Ù„Ø©: ${r.body.session?.status}`)
  }

  step(7, 'Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ù‚ÙØ² ÙÙˆÙ‚ Ø§Ù„Ø­Ø§Ù„Ø§Øª (ÙŠØ¬Ø¨ Ø£Ù† ØªÙØ±ÙØ¶)')
  const skip = await api(`/api/v1/sessions/${sid}`, { method: 'PATCH', token: nurse.token, body: { action: 'start_trip' } })
  console.log(`  start_trip Ø¨Ø¹Ø¯ Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡ -> HTTP ${skip.status}  ${skip.body.message ?? ''}`)

  step(8, 'ØªØ£ÙƒÙŠØ¯ Ø¨Ø±Ù…Ø² Ø®Ø§Ø·Ø¦ Ø«Ù… Ø§Ù„ØµØ­ÙŠØ­')
  const wrong = await api(`/api/v1/sessions/${sid}`, { method: 'PATCH', token: nurse.token, body: { action: 'verify_otp', code: '9999' } })
  console.log(`  Ø±Ù…Ø² Ø®Ø§Ø·Ø¦ -> HTTP ${wrong.status}  ${wrong.body.message}`)

  const before = (await api(`/api/v1/nurse/wallet/${nurse.user.id}`, { token: nurse.token })).body.wallet.currentBalance
  const ok = await api(`/api/v1/sessions/${sid}`, { method: 'PATCH', token: nurse.token, body: { action: 'verify_otp', code } })
  const after = (await api(`/api/v1/nurse/wallet/${nurse.user.id}`, { token: nurse.token })).body.wallet.currentBalance
  console.log(`  Ø±Ù…Ø² ØµØ­ÙŠØ­ -> HTTP ${ok.status}  Ø§Ù„Ø­Ø§Ù„Ø©: ${ok.body.session?.status}`)
  console.log(`  Ø§Ù„Ø±ØµÙŠØ¯: ${before} Ø¬.Ù…  ->  ${after} Ø¬.Ù…   (Ø®ØµÙ… ${before - after} Ø¬.Ù…)`)

  step(9, 'ØªØ£ÙƒÙŠØ¯ Ø«Ø§Ù†Ù â€” ÙŠØ¬Ø¨ Ø£Ù„Ø§ ÙŠØ®ØµÙ… Ù…Ø±ØªÙŠÙ†')
  const again = await api(`/api/v1/sessions/${sid}`, { method: 'PATCH', token: nurse.token, body: { action: 'verify_otp', code } })
  const final = (await api(`/api/v1/nurse/wallet/${nurse.user.id}`, { token: nurse.token })).body.wallet.currentBalance
  console.log(`  Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ£ÙƒÙŠØ¯ -> HTTP ${again.status}  (Ø¥Ø¬Ø±Ø§Ø¦ÙŠØ© / idempotent)`)
  console.log(`  Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ: ${final} Ø¬.Ù…  ${final === after ? '<- Ù„Ù… ÙŠØªØºÙŠØ±. ØµØ­ÙŠØ­' : '<- ØªØºÙŠØ±! Ø®Ø·Ø£'}`)

  step(10, 'Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙˆØµÙˆÙ„ ØºÙŠØ± Ù…ØµØ±Ø­')
  const stranger = await login(`01033${n}`, 'patient', 'Ø¯Ø®ÙŠÙ„')
  const spy = await api(`/api/v1/sessions/${sid}`, { token: stranger.token })
  console.log(`  Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…Ø´Ø§Ø±Ùƒ -> HTTP ${spy.status}  ${spy.body.error ?? ''}`)
  const adminSpy = await api('/api/v1/admin/nurses', { token: stranger.token })
  console.log(`  Ø¯Ø®ÙŠÙ„ ÙŠØ·Ù„Ø¨ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© -> HTTP ${adminSpy.status}  ${adminSpy.body.error ?? ''}`)

  step(11, 'Ø§Ù„ÙØ±Ø² Ø§Ù„Ø·Ø¨ÙŠ')
  const t1 = await api('/api/v1/triage', { method: 'POST', body: { symptoms: 'ألم شديد في الصدر وضيق تنفس' } })
  console.log(`  chest pain -> ${t1.body.urgency}`)
  console.log(`  Ø§Ù„Ù… ØµØ¯Ø± -> ${t1.body.urgency}`)
  const t2 = await api('/api/v1/triage', { method: 'POST', body: { symptoms: 'ألم في الظهر', age: '72', history: 'سكري' } })
  console.log(`  72y + diabetes -> ${t2.body.urgency}`)
  console.log(`  72 Ø³Ù†Ø© + Ø³ÙƒØ±ÙŠ -> ${t2.body.urgency}`)

  step(12, 'Ø§Ù„Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ù…Ù†Ø´Ø£Ø©')
  const recs = await api('/api/v1/records', { token: patient.token })
  console.log(`  Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø±ÙŠØ¶: ${recs.body.records?.length ?? 0}`)
  recs.body.records?.forEach((r) => console.log(`   - ${r.title}  (${r.date})`))

  console.log(`\n${'='.repeat(56)}\nØªÙ… - ÙƒÙ„ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ø¹Ù„Ø§Ù‡ ØªÙ…Øª Ø¹Ù„Ù‰ Ù‚Ø§Ø¹Ø¯Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ© Ø¹Ø¨Ø± HTTP\n${'='.repeat(56)}\n`)
}

main().catch((e) => { console.error('ÙØ´Ù„:', e.message); process.exit(1) })


