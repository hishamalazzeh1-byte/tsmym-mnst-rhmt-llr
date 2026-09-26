// اختبار أن حواجز الإنتاج ترفض الإقلاع فعلياً
const { execFileSync } = require('child_process')
const path = require('path')

function boot(env) {
  try {
    execFileSync(process.execPath, ['server.js'], {
      cwd: __dirname,
      env: { ...process.env, ...env },
      timeout: 8000,
      stdio: 'pipe',
      encoding: 'utf8',
    })
    return { started: true, output: '' }
  } catch (err) {
    return { started: false, output: `${err.stdout || ''}${err.stderr || ''}` }
  }
}

let pass = 0
let fail = 0
const check = (name, cond, extra) => {
  if (cond) {
    pass++
    console.log(`  OK   ${name}`)
  } else {
    fail++
    console.log(`  FAIL ${name}${extra ? ` -> ${extra}` : ''}`)
  }
}

console.log('\n=== اختبار حواجز الإنتاج ===\n')

// 1) production بلا أي إعداد → يجب أن يُرفض
const bare = boot({ NODE_ENV: 'production', DATABASE_URL: '', JWT_SECRET: '', SESSION_CODE_KEY: '', ADMIN_PHONE: '', SMS_PROVIDER: '' })
check('production-blank-env is rejected', !bare.started && /DATABASE_URL/.test(bare.output))

// 2) production بأساسيات لكن بلا JWT → يُرفض
const noJwt = boot({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://u:p@host/db',
  JWT_SECRET: '',
  SESSION_CODE_KEY: 'a'.repeat(48),
  ADMIN_PHONE: '01099999999',
  CORS_ORIGINS: 'https://rahma-health.com',
  SMS_PROVIDER: 'CONSOLE',
})
check('production-without-JWT is rejected', !noJwt.started && /JWT_SECRET/.test(noJwt.output), noJwt.output.slice(0, 120))

// 3) production بـ ADMIN_PHONE افتراضي → يُرفض
const defaultAdmin = boot({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://u:p@host/db',
  JWT_SECRET: 'b'.repeat(48),
  SESSION_CODE_KEY: 'c'.repeat(48),
  ADMIN_PHONE: '01000000000',
  CORS_ORIGINS: 'https://rahma-health.com',
  SMS_PROVIDER: 'TWILIO',
  TWILIO_ACCOUNT_SID: 'x',
  TWILIO_AUTH_TOKEN: 'y',
  TWILIO_PHONE_NUMBER: '+100',
})
check('default-ADMIN_PHONE is rejected', !defaultAdmin.started && /ADMIN_PHONE/.test(defaultAdmin.output), defaultAdmin.output.slice(0, 120))

// 4) production بمزوّد console → يُرفض
const consoleSms = boot({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://u:p@host/db',
  JWT_SECRET: 'b'.repeat(48),
  SESSION_CODE_KEY: 'c'.repeat(48),
  ADMIN_PHONE: '01099999999',
  CORS_ORIGINS: 'https://rahma-health.com',
  SMS_PROVIDER: 'CONSOLE',
})
check('CONSOLE-SMS is rejected in production', !consoleSms.started && /SMS_PROVIDER|CONSOLE/.test(consoleSms.output), consoleSms.output.slice(0, 120))

// 5) production بمزوّد ناقص الإعدادات → يُرفض
const partialSms = boot({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://u:p@host/db',
  JWT_SECRET: 'b'.repeat(48),
  SESSION_CODE_KEY: 'c'.repeat(48),
  ADMIN_PHONE: '01099999999',
  CORS_ORIGINS: 'https://rahma-health.com',
  SMS_PROVIDER: 'TWILIO',
  TWILIO_ACCOUNT_SID: '',
  TWILIO_AUTH_TOKEN: '',
  TWILIO_PHONE_NUMBER: '',
})
check('incomplete-Twilio-config is rejected', !partialSms.started && /TWILIO/.test(partialSms.output), partialSms.output.slice(0, 120))

// 6) production بـ CORS_THAT_ALLOWS_ALL → يُرفض
const wildcard = boot({
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://u:p@host/db',
  JWT_SECRET: 'b'.repeat(48),
  SESSION_CODE_KEY: 'c'.repeat(48),
  ADMIN_PHONE: '01099999999',
  CORS_ORIGINS: '*',
  SMS_PROVIDER: 'TWILIO',
  TWILIO_ACCOUNT_SID: 'x',
  TWILIO_AUTH_TOKEN: 'y',
  TWILIO_PHONE_NUMBER: '+100',
})
check('wildcard-CORS is rejected', !wildcard.started && /CORS_ORIGINS/.test(wildcard.output), wildcard.output.slice(0, 120))

console.log(`\n=== النتيجة: ${pass} ناجح / ${fail} فاشل ===`)
process.exit(fail ? 1 : 0)
