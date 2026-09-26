// فحص اتصال قاعدة البيانات الفعلي مع تشخيص مفصّل لسبب الفشل
require('dotenv').config()
const { Client } = require('pg')

const url = process.env.DATABASE_URL
if (!url) {
  console.log('DATABASE_URL غير مضبوط')
  process.exit(1)
}

const safe = url.replace(/\/\/([^:]+):[^@]+@/, '//$1:***@')
console.log('الهدف:', safe)

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20_000,
})

const hints = {
  ENOTFOUND: 'اسم المضيف لا يُحلّ — تحقق من الرابط أو من DNS/الإنترنت',
  ETIMEDOUT: 'انتهت المهلة — الجدار الناري يمنع المنفذ 5432، أو Supabase يطلب (pooler) على 6543',
  ECONNREFUSED: 'لا يوجد خادم على هذا المنفذ — قد تحتاج Transaction Pooler بدل الاتصال المباشر',
  EHOSTUNREACH: 'المضيف غير قابل للوصول من شبكتك',
  28: 'p1001 / لا يمكن فتح اتصال — انظر ملاحظات الجدار الناري في DEPLOYMENT.md',
  EPROTO: 'فشل التفاوض على SSL — جرّب DATABASE_SSL=false',
  'bad password': 'كلمة المرور خاطئة — أعيد تعيينها من Supabase ثم حدّث الرابط',
  'role "postgres" does not exist': 'المستخدم غير صحيح',
  'database "postgres" does not exist': 'اسم القاعدة غير صحيح',
}

client
  .connect()
  .then(async () => {
    const v = await client.query('SELECT version()')
    console.log('متصل بنجاح.')
    console.log(v.rows[0].version.split(' ').slice(0, 2).join(' '))

    const t = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
    )
    console.log('\nالجداول الموجودة في public:')
    if (!t.rows.length) console.log('  (لا شيء بعد)')
    t.rows.forEach((r) => console.log('  -', r.table_name))
  })
  .catch((err) => {
    const key = Object.keys(hints).find((k) => String(err.message).includes(k) || String(err.code) === k)
    console.log('\nفشل الاتصال:', err.code || '', '-', err.message)
    if (key) console.log('التشخيص:', hints[key])
  })
  .finally(() => client.end().catch(() => {}))
