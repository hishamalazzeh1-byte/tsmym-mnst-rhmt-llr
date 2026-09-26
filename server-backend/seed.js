// تعبئة قاعدة البيانات بحسابات جاهزة للتجربة المحلية
// التشغيل:  npm run seed   (لا يحتاج الخادم أن يكون يعمل)
// تحميل .env الخاص بالخادم (وليس جذر المشروع) — مهم عند التشغيل من أي مجلد
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const { UsersDB, NursesDB, WalletsDB, OtpDB } = require('./db')

const ACCOUNTS = [
  {
    key: 'PATIENT',
    label: 'مريض',
    phone: '01011112222',
    body: {
      phone: '01011112222',
      password: '123456',
      name: 'أحمد محمد',
      role: 'patient',
      nationalId: '29005122101234',
      governorate: 'القاهرة',
      area: 'مدينة نصر',
    },
  },
  {
    key: 'NURSE',
    label: 'ممرض',
    phone: '01022223333',
    body: {
      phone: '01022223333',
      password: '123456',
      name: 'أ. منى عبد الرحمن',
      role: 'nurse',
      syndicateNumber: 'SN-12345',
      governorate: 'القاهرة',
      area: 'مدينة نصر',
      experienceYears: 9,
      gender: 'female',
      title: 'ممرض مسجل',
      specialties: ['wound-care', 'injections', 'vitals'],
    },
  },
  {
    key: 'NURSE2',
    label: 'ممرض (للاختبار)',
    phone: '01022224444',
    body: {
      phone: '01022224444',
      password: '123456',
      name: 'أ. كريم سعيد',
      role: 'nurse',
      syndicateNumber: 'SN-67890',
      governorate: 'الجيزة',
      area: 'الدقي',
      experienceYears: 4,
      gender: 'male',
      title: 'ممرض مسجل',
      specialties: ['wound-care', 'elderly-care'],
    },
  },
  {
    key: 'ADMIN',
    label: 'إدارة',
    phone: process.env.ADMIN_PHONE || '01000000000',
    body: {
      phone: process.env.ADMIN_PHONE || '01000000000',
      password: '123456',
      name: 'إدارة منصة رحمة',
      role: 'patient',
      nationalId: '29005122109999',
    },
  },
]

console.log('\n=== تعبئة حسابات التجربة المحلية ===\n')
for (const acc of ACCOUNTS) {
  const existing = UsersDB.findByPhone(acc.phone)
  if (existing) {
    UsersDB.update(existing.id, { verified: true, role: acc.key === 'ADMIN' ? 'admin' : existing.role })
    console.log(`  = ${acc.label.padEnd(18)} ${acc.phone}  (موجود مسبقاً)`)
  } else {
    const created = UsersDB.insert(acc.body)
    UsersDB.update(created.id, { verified: true })
    if (acc.key === 'ADMIN') UsersDB.update(created.id, { role: 'admin' })
    console.log(`  + ${acc.label.padEnd(18)} ${acc.phone}  (تم الإنشاء)`)
  }
  // اعتمد كل الممرضين حتى تظهر في القائمة العامة وتستطيع الحجز معهم
  const user = UsersDB.findByPhone(acc.phone)
  if (user && user.role === 'nurse') {
    NursesDB.approve(user.id)
    if (!WalletsDB.getWallet(user.id)) WalletsDB.initWallet(user.id, user.name)
  }
}

// codes ثابتة تسهّل التجربة: 1234 لكل الحسابات
for (const acc of ACCOUNTS) OtpDB.createOtp(acc.phone, '1234')

console.log(`
تم. كل الحسابات تستخدم كلمة المرور: 1234
ورمز التحقق الثابت للتجربة: 1234

  المريض        01011112222
  الممرض        01022223333
  الممرض الثاني  01022224444
  الإدارة       ${ACCOUNTS[3].phone}

ملاحظة: التثبيت لرمز 1234 يبقى صالحاً حتى يُطلب رمز جديد من الواجهة،
عندها سيُطبع الرمز الحقيقي في سجل الخادم (Terminal 1).
`)