// فحص وإدارة قاعدة بيانات Supabase
// يقبل الرابط من: متغير بيئة، أو --url، أو server-backend/.env
//   node db-admin.js check              فحص الجداول
//   node db-admin.js columns            أعمدة كل جدول
//   node db-admin.js rls                حالة RLS
//   node db-admin.js test               اختبار اتصال بسيط
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// استخرج الرابط من .env حتى لو كان معلّقاً بـ #
function urlFromEnvFile() {
  const file = path.join(__dirname, '.env')
  if (!fs.existsSync(file)) return ''
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    // يتجاهل التعليق والسطر الفارغ
    const line = raw.trim().replace(/^#\s*/, '')
    if (!line.startsWith('DATABASE_URL=')) continue
    return line.split('=').slice(1).join('=').replace(/^["']|["']$/g, '').trim()
  }
  return ''
}

const URL_ARG = process.argv.find((a) => a.startsWith('--url='))?.slice(6)
const URL_ = process.env.DATABASE_URL || URL_ARG || urlFromEnvFile()

if (!URL_) {
  console.error('لا يوجد رابط قاعدة بيانات.')
  console.error('مرّره هكذا:  node db-admin.js check --url="postgresql://..."')
  process.exit(1)
}

const { Client } = require('pg')
const c = new Client({
  connectionString: URL_,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
})

const EXPECTED = {
  users: ['id', 'name', 'phone', 'role', 'password_hash', 'verified', 'created_at'],
  nurses: ['id', 'phone', 'verified', 'available', 'wallet_balance', 'specialties'],
  wallets: ['nurse_id', 'current_balance', 'completed_sessions_count', 'total_commission_deducted'],
  wallet_transactions: ['id', 'nurse_id', 'type', 'amount', 'balance_after'],
  sessions: ['id', 'patient_id', 'nurse_id', 'status', 'completion_code', 'platform_commission', 'commission_deducted'],
  records: ['id', 'session_id', 'patient_phone', 'encrypted'],
  otps: ['id', 'phone', 'code_hash', 'attempts', 'expires_at', 'is_used'],
  login_attempts: ['id', 'phone', 'created_at'],
}

async function check() {
  const { rows } = await c.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
  )
  const found = rows.map((r) => r.table_name)
  console.log(`الجداول الموجودة (${found.length}):`)
  found.forEach((t) => console.log('  -', t))
  const missing = Object.keys(EXPECTED).filter((t) => !found.includes(t))
  if (missing.length) {
    console.log('\nناقص: ' + missing.join(', '))
  } else {
    console.log('\nكل الجداول الثمانية موجودة.')
  }
}

async function columns() {
  for (const [table, expected] of Object.entries(EXPECTED)) {
    const { rows } = await c.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [table],
    )
    if (!rows.length) {
      console.log(`\n[${table}] غير موجود`)
      continue
    }
    const names = rows.map((r) => r.column_name)
    const missing = expected.filter((e) => !names.includes(e))
    console.log(`\n[${table}] ${rows.length} عمود ${missing.length ? '— ناقص: ' + missing.join(', ') : '— مطابق ✓'}`)
    rows.forEach((r) => {
      const nullOk = r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
      console.log(`   ${r.column_name.padEnd(26)} ${String(r.data_type).padEnd(26)} ${nullOk}`)
    })
  }
}

async function rls() {
  const { rows } = await c.query(
    `SELECT c.relname AS table, c.relrowsecurity AS rls_enabled
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname`,
  )
  console.log('حالة RLS لكل جدول:\n')
  let on = 0
  for (const r of rows) {
    const ok = r.rls_enabled
    if (ok) on++
    console.log(`  ${ok ? 'ON ' : 'OFF'}  ${r.table}`)
  }
  console.log(`\nمفعّل: ${on}/${rows.length}`)
  if (on < rows.length) {
    console.log('\n⚠️  جداول بلا RLS متاحة عبر REST API لكل من يملك مفتاح anon.')
    console.log('    شغّل:  node db-admin.js rls-fix')
  }
}

async function test() {
  const v = await c.query('select version()')
  console.log(v.rows[0].version.split(' ').slice(0, 2).join(' '))
  const counts = await c.query(
    `SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM nurses) n,
            (SELECT count(*) FROM sessions) s`,
  ).catch(() => null)
  if (counts) {
    console.log(`\nusers=${counts.rows[0].u}  nurses=${counts.rows[0].n}  sessions=${counts.rows[0].s}`)
  }
}

const CMDS = { check, columns, rls, test }

async function main() {
  const cmd = process.argv[2] || 'check'
  try {
    await c.connect()
  } catch (err) {
    console.error('فشل الاتصال:', err.code || '', err.message)
    if (err.code === 'ENOTFOUND' || /getaddrinfo/.test(err.message)) {
      console.error('\nالسبب: مضيف قاعدة البيانات لا يُحلّ (لا سجل A — IPv6 فقط).')
      console.error('الحل: فعّل Session Pooler، أو استخدم SQL Editor للتحقق.')
    }
    process.exit(1)
  }
  try {
    const fn = CMDS[cmd]
    if (!fn) {
      console.error('أمر غير معروف. المتاح:', Object.keys(CMDS).join(', '))
      process.exit(1)
    }
    await fn()
  } finally {
    await c.end().catch(() => {})
  }
}

main()
