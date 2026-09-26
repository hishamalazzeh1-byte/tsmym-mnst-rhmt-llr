// ==============================================================================
// إرسال رسائل SMS الحقيقية
// ------------------------------------------------------------------------------
// المبدأ: fail-closed. إذا فشل الإرسال لا يُعتبر الرمز مُرسلاً، ولا يُكتب في
// قاعدة البيانات إطلاقاً — وإلا يستطيع المهاجم تجاوز التحقق برقم واحد.
// مزوّد "console" للتطوير المحلي فقط، ومرفوض تماماً في الإنتاج.
// ==============================================================================
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const PROVIDERS = {
  TWILIO: {
    label: 'Twilio',
    required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
    async send(phone, body) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      const msg = await twilio.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone.startsWith('+') ? phone : `+2${phone}`,
      })
      // لا يُعتبر الإرسال ناجحاً إلا بمعرّف رسالة من المزوّد
      if (!msg?.sid) throw new Error('TWILIO_NO_SID')
      return { sid: msg.sid, status: msg.status }
    },
  },

  SMS_MISR: {
    label: 'SMS Misr',
    required: ['SMS_MISR_USERNAME', 'SMS_MISR_PASSWORD'],
    async send(phone, body) {
      const params = new URLSearchParams({
        environment: process.env.SMS_MISR_ENVIRONMENT || '1',
        username: process.env.SMS_MISR_USERNAME,
        password: process.env.SMS_MISR_PASSWORD,
        sender: process.env.SMS_MISR_SENDER || 'Rahma',
        mobile: phone,
        template: body,
      })
      const url = `https://smsmisr.com/api/SMS/?${params.toString()}`
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      try {
        const res = await fetch(url, { method: 'GET', signal: controller.signal })
        const text = await res.text()
        if (!res.ok) throw new Error(`SMSMISR_HTTP_${res.status}: ${text.slice(0, 120)}`)
        // SMS Misr يرد بـ code/response — نتحقق من عدم وجود خطأ صريح
        if (/\berror\b|\binvalid\b|\bfailed\b/i.test(text) && !/\bok\b/i.test(text)) {
          throw new Error(`SMSMISR_REJECTED: ${text.slice(0, 120)}`)
        }
        return { status: text.slice(0, 200) }
      } finally {
        clearTimeout(timer)
      }
    },
  },

  CONSOLE: {
    label: 'Console (تطوير فقط)',
    required: [],
    async send(phone, body) {
      if (IS_PRODUCTION) {
        throw new Error(
          'مزوّد CONSOLE مرفوض في الإنتاج. اضبط SMS_PROVIDER=TWILIO أو SMS_MISR.',
        )
      }
      console.log(`\n  ┌─ [SMS → ${phone}]\n  │  ${body}\n  └─ (console — لا يُرسل فعلياً)\n`)
      return { status: 'console' }
    },
  },
}

/** يتحقق من اكتمال إعدادات المزوّد قبل التشغيل */
function validateSmsConfig() {
  const name = (process.env.SMS_PROVIDER || '').toUpperCase()
  if (!name) {
    if (IS_PRODUCTION) {
      throw new Error(
        'SMS_PROVIDER مطلوب في الإنتاج. لا يمكن تشغيل المنصة بدون وسيلة تحقق حقيقية.',
      )
    }
    return { provider: 'CONSOLE', warnings: ['SMS_PROVIDER غير مضبوط — سيُطبع الرمز في السجل'] }
  }

  const provider = PROVIDERS[name]
  if (!provider) {
    throw new Error(
      `SMS_PROVIDER غير معروف: "${name}". المتاح: ${Object.keys(PROVIDERS).join(', ')}`,
    )
  }
  // مزوّد console للطرفية فقط — وجوده في الإنتاج خطأ إعداد خطير
  if (IS_PRODUCTION && provider === PROVIDERS.CONSOLE) {
    throw new Error(
      'SMS_PROVIDER=CONSOLE مرفوض في الإنتاج. اضبطه إلى TWILIO أو SMS_MISR ' +
        'وإلا لم يستلم المستخدمون رسائل التحقق إطلاقاً.',
    )
  }
  const missing = provider.required.filter((key) => !process.env[key])
  if (missing.length) {
    throw new Error(
      `إعدادات مزوّد ${provider.label} ناقصة: ${missing.join(', ')}. لن يبدأ الخادم بإعداد ناقص.`,
    )
  }
  return { provider: name, warnings: [] }
}

/**
 * إرسال رسالة. يرمي خطأً عند الفشل (لا يبتلع الأخطاء أبداً).
 * @returns {Promise<{provider:string, detail:object}>}
 */
async function sendSms(phone, message) {
  const name = (process.env.SMS_PROVIDER || 'CONSOLE').toUpperCase()
  const provider = PROVIDERS[name]
  if (!provider) throw new Error(`SMS_PROVIDER غير معروف: ${name}`)

  const started = Date.now()
  try {
    const detail = await provider.send(phone, message)
    // نسجّل نجاح الإرسال فقط — دون الرمز نفسه
    console.log(
      `[sms] ${provider.label} → ${phone.slice(0, 4)}**** ok (${Date.now() - started}ms)`,
    )
    return { provider: provider.label, detail }
  } catch (err) {
    // نطبع سبب الفشل (يساعد في التشخيص) — لا نطبع الرسالة ولا الرمز
    console.error(`[sms] ${provider.label} → ${phone.slice(0, 4)}**** FAILED: ${err.message}`)
    const wrapped = new Error(`تعذر إرسال رسالة التحقق: ${err.message}`)
    wrapped.code = 'SMS_DELIVERY_FAILED'
    throw wrapped
  }
}

module.exports = { sendSms, validateSmsConfig, PROVIDERS, IS_PRODUCTION }
