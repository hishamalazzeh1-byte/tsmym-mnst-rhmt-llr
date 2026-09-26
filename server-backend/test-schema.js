// تحقق من المخطط: 8 جداول، ترتيب التبعيات صحيح، لا تكرار
const fs = require('fs')
const path = require('path')
const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8')

let pass = 0
let fail = 0
const check = (n, c, e) => {
  if (c) { pass++; console.log(`  OK   ${n}`) }
  else { fail++; console.log(`  FAIL ${n}${e ? ` -> ${e}` : ''}`) }
}

console.log('\n=== فحص المخطط ===\n')

const TABLES = ['users', 'nurses', 'wallets', 'wallet_transactions', 'sessions', 'records', 'otps', 'login_attempts']

const created = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1])
check('عدد الجداول = 8', created.length === 8, `وُجد ${created.length}: ${created.join(', ')}`)
for (const t of TABLES) check(`جدول ${t} موجود`, created.includes(t))

const dupes = created.filter((t, i) => created.indexOf(t) !== i)
check('لا جداول مكررة', dupes.length === 0, dupes.join(', '))

const idx = (name) => sql.indexOf(`CREATE TABLE IF NOT EXISTS ${name}`)
check('users قبل nurses', idx('users') < idx('nurses'))
check('nurses قبل wallets', idx('nurses') < idx('wallets'))
check('nurses قبل wallet_transactions', idx('nurses') < idx('wallet_transactions'))
check('users قبل sessions', idx('users') < idx('sessions'))
check('nurses قبل sessions', idx('nurses') < idx('sessions'))
check('sessions قبل records', idx('sessions') < idx('records'))

check('records.session_id UNIQUE (يمنع الخصم المزدوج)', /session_id\s+TEXT NOT NULL UNIQUE/.test(sql))
check('wallets.current_balance موجود', /current_balance\s+NUMERIC/.test(sql))
check('sessions.completion_code NOT NULL', /completion_code\s+TEXT NOT NULL/.test(sql))
check('otps.code_hash موجود (لا نص صريح)', /code_hash\s+TEXT NOT NULL/.test(sql))
check('otps.expires_at موجود', /expires_at\s+TIMESTAMPTZ NOT NULL/.test(sql))
check('nurses.verified افتراضي FALSE', /verified\s+BOOLEAN\s+NOT NULL DEFAULT FALSE/.test(sql))

const open = (sql.match(/\(/g) || []).length
const close = (sql.match(/\)/g) || []).length
check('الأقواس متوازنة', open === close, `${open} مقابل ${close}`)

const idxCount = [...sql.matchAll(/CREATE INDEX IF NOT EXISTS/g)].length
check('فهارس كافية', idxCount >= 12, `${idxCount} فهرس`)

check('لا CREATE EXTENSION (يمنع خطأ الصلاحيات)', !/CREATE EXTENSION/i.test(sql))

console.log(`\n=== النتيجة: ${pass} ناجح / ${fail} فاشل ===`)
process.exit(fail ? 1 : 0)
