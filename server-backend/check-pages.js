// فحص صفحات الواجهة: حالة + حجم + عنوان + هل المحتوى حقيقي
const BASE = 'http://localhost:3000'
const PAGES = ['/', '/nurses', '/services', '/triage', '/auth/login', '/auth/register', '/dashboard']

async function check(path) {
  try {
    const res = await fetch(BASE + path, { signal: AbortSignal.timeout(45000) })
    const html = await res.text()
    const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || '(بلا عنوان)'
    // هل الصفحة تعرض محتوى حقيقي أم شاشة خطأ؟
    const isError = /__next_error__|Application error|Internal Server Error/.test(html)
    return { path, status: res.status, size: html.length, title, isError }
  } catch (err) {
    return { path, status: 'ERR', size: 0, title: err.message, isError: true }
  }
}

async function main() {
  console.log('فحص صفحات الواجهة\n')
  console.log('المسار            الحالة   الحجم      العنوان')
  console.log('-'.repeat(70))
  let ok = 0
  for (const p of PAGES) {
    const r = await check(p)
    if (r.status === 200 && !r.isError) ok++
    const mark = r.status === 200 && !r.isError ? 'OK  ' : 'ERR '
    console.log(
      `${p.padEnd(18)} ${mark} ${String(r.status).padEnd(7)} ${String(r.size).padEnd(10)} ${r.title.slice(0, 30)}`,
    )
  }
  console.log('-'.repeat(70))
  console.log(`${ok}/${PAGES.length} صفحة تعمل`)

  // الخلفية
  try {
    const h = await fetch('http://localhost:5000/api/v1/health', { signal: AbortSignal.timeout(10000) })
    const hb = await h.json()
    console.log(`\nالخادم: ${hb.status} | القاعدة: ${hb.database.engine} | SMS: ${hb.sms.provider}`)
  } catch {
    console.log('\nالخادم: لا يعمل')
  }
}

main()
