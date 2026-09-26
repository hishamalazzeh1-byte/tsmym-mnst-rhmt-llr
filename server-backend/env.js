// ==============================================================================
// التحقق من متغيرات البيئة قبل الإقلاع
// ------------------------------------------------------------------------------
// القاعدة: لا يبدأ الخادم في الإنتاج إلا بعد اجتياز كل الفحوص. الخادم الذي
// يعمل بإعداد ناقص هو أخطر من خادم لا يعمل.
// ==============================================================================
const crypto = require('crypto')

const isProduction = process.env.NODE_ENV === 'production'

/** قيم تُقبل محلياً (وضع التطوير) لكنها مرفوضة تماماً في الإنتاج */
const DEV_ONLY_DEFAULTS = {
  JWT_SECRET: ['', 'change-me', 'secret', 'dev-secret'],
  SESSION_CODE_KEY: ['', 'change-me', 'dev-insecure-code-key'],
  ADMIN_PHONE: ['01000000000'],
}

const errors = []
const warnings = []

function require_(name, hint) {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
    errors.push(`متغير البيئة ${name} مطلوب${hint ? ` (${hint})` : ''}`)
    return ''
  }
  return String(value).trim()
}

function validateEnv() {
  // ── قاعدة البيانات ───────────────────────────────────────────────────────
  const databaseUrl = process.env.DATABASE_URL
  if (isProduction) {
    if (!databaseUrl) {
      errors.push(
        'DATABASE_URL مطلوب في الإنتاج. ملفات JSON تُفقد مع كل نشر على بيئة سحابية ' +
          '(نظام الملفات للقراءة فقط ومؤقت) — لا يمكن تشغيل الإنتاج عليها.',
      )
    } else if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
      errors.push('DATABASE_URL يجب أن يكون رابط PostgreSQL يبدأ بـ postgres:// أو postgresql://')
    }
  }

  // ── الأسرار ──────────────────────────────────────────────────────────────
  const jwtSecret = process.env.JWT_SECRET
  if (isProduction) {
    if (!jwtSecret) {
      errors.push('JWT_SECRET مطلوب في الإنتاج. بدونه تُخترق كل الجلسات.')
    } else if (jwtSecret.length < 32) {
      errors.push(`JWT_SECRET قصير (${jwtSecret.length} حرفاً). الحد الأدنى 32 حرفاً.`)
    } else if (DEV_ONLY_DEFAULTS.JWT_SECRET.includes(jwtSecret)) {
      errors.push('JWT_SECRET يساوي قيمة تطوير معروفة. ولّد قيمة عشوائية حقيقية.')
    }
    if (!process.env.SESSION_CODE_KEY) {
      errors.push(
        'SESSION_CODE_KEY مطلوب في الإنتاج. بدونه رموز الجلسات قابلة للفك عند تسريب القاعدة.',
      )
    } else if (process.env.SESSION_CODE_KEY.length < 32) {
      errors.push('SESSION_CODE_KEY قصير. الحد الأدنى 32 حرفاً.')
    }
  }

  // ── المدير ───────────────────────────────────────────────────────────────
  const adminPhone = (process.env.ADMIN_PHONE || '').replace(/\D/g, '')
  if (!adminPhone) {
    errors.push('ADMIN_PHONE مطلوب. بدونه لا يمكن منح صلاحية الإدارة لأحد.')
  } else if (isProduction && DEV_ONLY_DEFAULTS.ADMIN_PHONE.includes(adminPhone)) {
    errors.push(
      `ADMIN_PHONE ما زال القيمة الافتراضية (${adminPhone}). أي شخص يسجّل بهذا الرقم ` +
        'يُرقّى إلى مدير تلقائياً عند أول دخول. غيّره قبل النشر.',
    )
  }

  // ── CORS ─────────────────────────────────────────────────────────────────
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (isProduction && corsOrigins.length === 0) {
    errors.push('CORS_ORIGINS مطلوب في الإنتاج.')
  } else {
    corsOrigins.forEach((origin) => {
      if (origin === '*') errors.push('CORS_ORIGINS لا يقبل "*" في الإنتاج.')
      if (/localhost|127\.0\.0\.1/.test(origin) && isProduction) {
        errors.push(`CORS_ORIGINS يحتوي على نطاق تطوير في الإنتاج: ${origin}`)
      }
    })
  }

  // ── التحذيرات (لا توقف الإقلاع) ─────────────────────────────────────────
  if (!isProduction) {
    ;['JWT_SECRET', 'SESSION_CODE_KEY', 'DATABASE_URL', 'ADMIN_PHONE'].forEach((name) => {
      const value = process.env[name]
      if (!value) warnings.push(`${name} غير مضبوط — سيعمل الخادم بإعداد تطوير.`)
    })
  }

  return {
    isProduction,
    databaseUrl: databaseUrl || '',
    corsOrigins,
    adminPhone,
    errors,
    warnings,
  }
}

/** يطبع تقريراً واضحاً، ويرمي خطأً إذا كانت هناك أخطاء قاطعة */
function assertProductionReady() {
  const result = validateEnv()
  result.warnings.forEach((w) => console.warn(`[env] تحذير: ${w}`))
  if (result.errors.length) {
    console.error('\n╔══════════════════════════════════════════════════════════╗')
    console.error('║  الخادم لن يبدأ — إعداد بيئة غير صالح                    ║')
    console.error('╚══════════════════════════════════════════════════════════╝')
    result.errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`))
    console.error('')
    const err = new Error('INVALID_ENVIRONMENT')
    err.code = 'INVALID_ENVIRONMENT'
    err.details = result.errors
    throw err
  }
  return result
}

module.exports = { validateEnv, assertProductionReady, isProduction, DEV_ONLY_DEFAULTS }

// مولّد أسرار عشوائية: node server-backend/env.js
if (require.main === module) {
  console.log('\n=== قيم مقترحة (انسخها إلى منصة الاستضافة) ===\n')
  console.log(`JWT_SECRET="${crypto.randomBytes(48).toString('hex')}"`)
  console.log(`SESSION_CODE_KEY="${crypto.randomBytes(48).toString('hex')}"`)
  console.log('\n')
}
