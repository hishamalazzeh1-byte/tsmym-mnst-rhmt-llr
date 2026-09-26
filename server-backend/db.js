// ==============================================================================
// مُبدِّل قاعدة البيانات
// ------------------------------------------------------------------------------
//   DATABASE_URL مضبوط  ->  PostgreSQL (الوضع المطلوب للإنتاج)
//   غير مضبوط          ->  ملفات JSON (تطوير محلي فقط)
// ==============================================================================
if (process.env.DATABASE_URL) {
  module.exports = require('./db-postgres')
  if (process.env.NODE_ENV !== 'production') {
    console.log('[db] PostgreSQL —', process.env.DATABASE_URL.replace(/\/\/[^@]*@/, '//***@'))
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    // حاجز صريح: ملفات JSON تُفقد مع كل نشر على Vercel/Any Serverless
    console.error(
      '\n[db] رُفض الإقلاع: DATABASE_URL غير مضبوط.\n' +
        '     ملفات JSON لا تصلح للإنتاج — نظام الملفات في البيئات السحابية للقراءة\n' +
        '     فقط ومؤقت، فتُفقد كل الحسابات والمحافظ والجلسات مع كل نشر.\n',
    )
    const err = new Error('DATABASE_URL required in production')
    err.code = 'NO_DATABASE'
    throw err
  }
  console.warn('[db] ملفات JSON — تطوير محلي فقط، لا تستخدمها في الإنتاج.')
  module.exports = require('./db-json')
}

