// ==============================================================================
// ترحيل قاعدة البيانات — يطبّق schema.sql على PostgreSQL
// ------------------------------------------------------------------------------
//   node migrate.js            طبّق المخطط
//   node migrate.js --check    تحقّق أن الجداول موجودة فقط (بلا كتابة)
// ==============================================================================
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const SCHEMA_PATH = path.join(__dirname, '..', 'schema.sql')
const checkOnly = process.argv.includes('--check')
const quiet = process.argv.includes('--if-available')

async function main() {
  if (!process.env.DATABASE_URL) {
    if (quiet) process.exit(0) // لا قاعدة = لا ترحيل (تطوير بملفات JSON)
    console.error(
      '\nDATABASE_URL غير مضبوط — لا يوجد ما يُرحَّل.\n' +
        'لتطوير محلي بلا قاعدة بيانات، تجاهل هذا الأمر.\n',
    )
    process.exit(checkOnly ? 0 : 1)
  }

  let Pool
  try {
    ({ Pool } = require('pg'))
  } catch {
    if (quiet) process.exit(0)
    console.error("الحزمة 'pg' غير مثبّتة. نفّذ: npm install --prefix server-backend")
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  })

  const EXPECTED = [
    'users', 'nurses', 'wallets', 'wallet_transactions',
    'sessions', 'records', 'otps', 'login_attempts',
  ]

  try {
    if (checkOnly) {
      const { rows } = await pool.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
      )
      const existing = new Set(rows.map((r) => r.table_name))
      const missing = EXPECTED.filter((t) => !existing.has(t))
      if (missing.length) {
        console.error(`\nجداول ناقصة: ${missing.join(', ')}\nشغّل:  npm run db:migrate\n`)
        process.exitCode = 1
      } else {
        console.log(`[db] كل الجداول موجودة (${EXPECTED.length}/${EXPECTED.length}).`)
      }
      return
    }

    console.log('[db] تطبيق المخطط...')
    const sql = fs.readFileSync(SCHEMA_PATH, 'utf8')
    await pool.query(sql)
    console.log(`[db] تم تطبيق المخطط من ${path.basename(SCHEMA_PATH)} بنجاح.`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[db] فشل الترحيل:', err.message)
  process.exit(1)
})