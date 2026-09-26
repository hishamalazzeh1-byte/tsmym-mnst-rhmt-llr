// يثبت أن الوسيط (proxy) يمرّر طلبات /api/v1 إلى الخادم الخلفي
// عبر نفس النطاق — بدون CORS وبدون نطاق مثبّت في الكود.
const FRONT = 'http://localhost:3000'
const BACK = 'http://localhost:5000'

async function get(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(40000) })
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* ليس JSON */ }
    return { status: res.status, json, text, head: text.slice(0, 120) }
  } catch (err) {
    return { status: 'ERR', json: null, text: '', head: err.message }
  }
}

async function main() {
  console.log('اختبار الوسيط: /api/v1/... على نطاق الواجهة\n')

  console.log('[1] المقارنة المباشرة')
  const direct = await get(`${BACK}/api/v1/health`)
  console.log(`    ${BACK}/api/v1/health  ->  ${direct.status}  ${direct.json?.status ?? direct.text}`)

  const viaProxy = await get(`${FRONT}/api/v1/health`)
  console.log(`    ${FRONT}/api/v1/health ->  ${viaProxy.status}  ${viaProxy.json?.status ?? viaProxy.text}`)

  console.log('\n[2] التحقق من المرور عبر الوسيط')
  const okDirect = direct.status === 200 && direct.json?.status === 'online'
  const okProxy = viaProxy.status === 200 && viaProxy.json?.status === 'online'
  console.log(`    الخادم مباشرة : ${okDirect ? 'يعمل' : 'لا يعمل'}`)
  console.log(`    عبر الوسيط    : ${okProxy ? 'يمرّر بنجاح' : 'فشل'}`)

  if (okProxy && okDirect) {
    const a = direct.json.serverTime
    const b = viaProxy.json.serverTime
    console.log(`    نفس المصدر   : ${typeof a === 'string' && typeof b === 'string' ? 'متطابق' : 'غير متاح'}`)
  }

  console.log('\n[3] مسارات أخرى عبر الوسيط')
  for (const p of ['/api/v1/nurses', '/api/v1/auth/me', '/api/v1/sessions']) {
    const r = await get(FRONT + p)
    const note = r.json?.count !== undefined ? `count=${r.json.count}`
      : r.json?.error ? r.json.error
      : r.status === 401 ? 'يتطلب توكن (صحيح)' : r.head
    console.log(`    ${p.padEnd(22)} -> ${r.status}  ${note}`)
  }

  // triage يقبل POST فقط — نختبره بالطريقة الصحيحة
  const triage = await fetch(`${FRONT}/api/v1/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms: 'ألم شديد في الصدر وضيق تنفس' }),
    signal: AbortSignal.timeout(40000),
  })
  const tBody = await triage.json().catch(() => null)
  console.log(`    POST /api/v1/triage   -> ${triage.status}  urgency=${tBody?.urgency}`)

  console.log('\n[4] صفحة الواجهة (بعد إحماء)')
  for (const p of ['/', '/nurses', '/auth/login']) {
    const r = await get(FRONT + p)
    const isError = /__next_error__|Application error/.test(r.text)
    console.log(`    ${p.padEnd(14)} -> ${r.status}  ${r.text.length} بايت  ${isError ? 'خطأ!' : 'سليمة'}`)
  }
}

main()
