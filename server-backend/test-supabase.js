// اختبار شامل لاتصال Supabase: مباشر + كل مناطق الـ pooler
require('dotenv').config()
const { Client } = require('pg')
const dns = require('dns')

// يقرأ الرابط من .env حتى لو كان معلّقاً
function urlFromEnvFile() {
  const fs = require('fs')
  const path = require('path')
  const file = path.join(__dirname, '.env')
  if (!fs.existsSync(file)) return ''
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim().replace(/^#\s*/, '')
    if (line.startsWith('DATABASE_URL=')) {
      return line.split('=').slice(1).join('=').replace(/^["']|["']$/g, '').trim()
    }
  }
  return ''
}

const URL_ = process.env.DATABASE_URL || urlFromEnvFile()
const u = new URL(URL_)
const REF = u.hostname.split('.')[1]
const PW = decodeURIComponent(u.password)

const REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'sa-east-1',
  'eu-central-1', 'eu-west-1', 'eu-west-2',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
]

async function attempt(label, url, timeout = 12_000) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: timeout })
  try {
    await c.connect()
    const v = await c.query(`select current_database() db, current_user usr, version() ver`)
    const t = await c.query(
      `select count(*)::int n from information_schema.tables where table_schema='public'`,
    ).catch(() => null)
    await c.end()
    return { ok: true, msg: `db=${v.rows[0].db} user=${v.rows[0].usr} | ${v.rows[0].ver.split(' ').slice(0, 2).join(' ')} | جداول=${t ? t.rows[0].n : '?'}` }
  } catch (err) {
    await c.end().catch(() => {})
    return { ok: false, msg: `${err.code || ''} ${String(err.message || '').split('\n')[0].slice(0, 95)}` }
  }
}

async function main() {
  console.log(`project ref : ${REF}`)
  console.log(`password    : ${PW.length} chars`)
  console.log(`in .env     : ${/^\s*#\s*DATABASE_URL=/m.test(require('fs').readFileSync(require('path').join(__dirname, '.env'), 'utf8')) ? 'معلّق (معطّل)' : 'مفعّل'}`)
  console.log('')

  console.log('[1] الاتصال المباشر')
  const dnsResult = await new Promise((r) => {
    dns.lookup(u.hostname, { all: true }, (e, a) => r(e ? null : a))
  })
  console.log('    DNS :', dnsResult ? dnsResult.map((x) => `${x.family === 6 ? 'IPv6' : 'IPv4'} ${x.address}`).join(', ') : 'ENOTFOUND')
  const direct = await attempt('direct', URL_)
  console.log('    نتيجة:', direct.ok ? 'OK ' + direct.msg : 'FAIL ' + direct.msg)

  console.log('\n[2] Session Pooler')
  for (const port of [6543, 5432]) {
    for (const r of REGIONS) {
      const url = `postgresql://postgres.${REF}:${encodeURIComponent(PW)}@aws-0-${r}.pooler.supabase.com:${port}/postgres`
      const res = await attempt(r, url)
      if (res.ok) {
        console.log(`    ✔ ${r}:${port}  ${res.msg}`)
        console.log(`\n★ رابط صالح:\n  postgresql://postgres.${REF}:<password>@aws-0-${r}.pooler.supabase.com:${port}/postgres`)
        return
      }
      if (!/not found/.test(res.msg)) console.log(`    · ${r}:${port}  ${res.msg}`)
    }
  }
  console.log('    لا نتيجة — الـ Pooler غير مفعّل أو كلمة المرور غير صحيحة')
}

main()
