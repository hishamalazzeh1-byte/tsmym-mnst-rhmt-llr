// ضمانة: لا بيانات وهمية في أي مسار
// 1) لا مصدر بيانات احتياطي  2) لا قيم مخترعة  3) الفشل صريح لا صامت
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
let pass = 0
let fail = 0
const failures = []
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log(`  OK   ${name}`) }
  else { fail++; failures.push(name); console.log(`  FAIL ${name}${extra ? ` -> ${extra}` : ''}`) }
}

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(ROOT, rel))

console.log('\n=== ضمانة عدم وجود بيانات وهمية ===\n')

console.log('[1] لا مصادر بيانات احتياطية في الشيفرة')
const SOURCE = [
  'lib/app-state.ts', 'lib/api.ts', 'lib/auth-session.ts', 'lib/data.ts',
  'server-backend/server.js', 'server-backend/db-json.js', 'server-backend/db-postgres.js',
]
for (const f of SOURCE) {
  if (!exists(f)) { console.log(`  --   ${f} (غير موجود)`); continue }
  const src = read(f)
  // كلمة تُبنى بها بيانات وهمية
  const bad = /\b(getLive\w+|mockData|dummyData|fakeData|seedDemo|generateSample|hardcodedNurses)\b/.exec(src)
  check(`${f} بلا مولّد بيانات وهمية`, !bad, bad && bad[0])
}

console.log('\n[2] لا قيم مخترعة تُعرض كبيانات حقيقية')
// نمط: كائن مصفوفة كبير داخل lib/ أو components/ (سجلات وهمية مضمّنة)
for (const dir of ['lib', 'components', 'app']) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) continue
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name)
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p)
    return /\.(ts|tsx|js|jsx)$/.test(e.name) ? [p] : []
  })
  for (const file of walk(full)) {
    const src = fs.readFileSync(file, 'utf8')
    // كلمات دالة على بيانات تجريبية داخل مصفوفة كائنات
    const hasHardcodedArray = /:\s*\[\s*\{[^}]*id:\s*['"](n|s|r|p)-\d+['"]/.test(src)
    check(`${path.relative(ROOT, file)} بلا سجلات مضمّنة`, !hasHardcodedArray)
  }
}

console.log('\n[3] الفشل لا يُخفى كـ"بيانات فارغة"')
const appState = read('lib/app-state.ts')
check('fetchRecords لا يبتلع الأخطاء', !/fetchRecords[\s\S]{0,220}?catch[\s\S]{0,80}?return \[\]/.test(appState))
const dbJson = read('server-backend/db-json.js')
check('readTable لا يرجع [] عند التلف', !/catch[\s\S]{0,120}?return \[\]\s*\n\s*\}/.test(dbJson))

console.log('\n[4] لا احتياطي صامت لملفات JSON في الإنتاج')
const db = read('server-backend/db.js')
check('db.js يرفض JSON في الإنتاج', /NODE_ENV === 'production'[\s\S]{0,900}?throw err/.test(db))
const env = read('server-backend/env.js')
check('env.js يشترط DATABASE_URL في الإنتاج', /isProduction[\s\S]{0,300}?DATABASE_URL/.test(env))

console.log('\n[5] لا حزم بناء قديمة تُشحن (ملفات وهمية داخل التطبيق)')
const androidAssets = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public')
if (exists('android/app/src/main/assets/public')) {
  const stale = fs.readdirSync(androidAssets).filter((f) => f.endsWith('.html'))
  check('لا HTML مبنيّ قديم داخل تطبيق أندرويد', stale.length === 0, `${stale.length} ملف: ${stale.slice(0, 3).join(', ')}`)
} else {
  console.log('  --   لا يوجد حزمة أندرويد (ok)')
}

console.log(`\n=== النتيجة: ${pass} ناجح / ${fail} فاشل ===`)
if (fail) {
  console.log('الفاشلة:')
  failures.forEach((f) => console.log(`  - ${f}`))
  process.exit(1)
}
