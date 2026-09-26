# دليل النشر — منصة «رحمة»

المكوّنات ثلاثة منفصلة:

| المكوّن | التقنية | مكان النشر |
|---|---|---|
| الواجهة | Next.js 16 | Vercel |
| الخادم | Express 4 | Railway / Render / Fly / VPS |
| قاعدة البيانات | PostgreSQL 14+ | Neon / Supabase / RDS |

> **الخادم لا يعمل على Vercel.** Vercel نظام serverless: نظام الملفات للقراءة فقط
> ومؤقت، ودواله ثوانٍ. خادم Express طويل العمر + اتصال قاعدة دائم لا يناسبانه.
> الواجهة فقط هي ما يُنشر على Vercel.

---

## 1) قاعدة البيانات (أولاً — يُبنى عليها كل شيء)

1. أنشئ قاعدة Neon أو Supabase أو RDS.
2. طبّق المخطط:

```bash
# بمعرّف مريح
psql "$DATABASE_URL" -f schema.sql

# أو بعد ضبط DATABASE_URL
npm run db:migrate
```

تحقّق بعدها:
```bash
npm run db:check     # يجب أن يطبع: كل الجداول موجودة (8/8)
```

المخطط يحتوي 8 جداول: `users` · `nurses` · `wallets` · `wallet_transactions` ·
`sessions` · `records` · `otps` · `login_attempts`

---

## 2) مزوّد الرسائل (SMS)

المنصة **ترفض الإقلاع** في الإنتاج بدون مزوّد حقيقي — وهذا مُختبَر آلياً:

```bash
npm run test:guard    # 6/6
```

### Twilio
1. سجّل في twilio.com واشترِ رقماً.
2. جهّز قالب رسالة:
   ```
   رمز التحقق لتطبيق رحمة: {{1}}. صالح 5 دقائق.
   ```
3. المتغيرات:
   ```
   SMS_PROVIDER=TWILIO
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```

> **مهم:** أرقام Twilio غير الناطقة ترفض الإرسال إلى مصر (+20). فعّل
> الحساب الهاتفي (A2P) أولاً، وإلا فشلت كل الرسائل.

### SMS Misr (مزوّد مصري — أبسط محلياً)
```
SMS_PROVIDER=SMS_MISR
SMS_MISR_USERNAME=xxxx
SMS_MISR_PASSWORD=xxxx
SMS_MISR_SENDER=Rahma
SMS_MISR_ENVIRONMENT=1
```

---

## 3) الأسرار

```bash
node server-backend/env.js      # يطبع قيمتين عشوائيتين 48 حرفاً
```

| المتغير | الاستخدام | ملاحظة |
|---|---|---|
| `JWT_SECRET` | توقيع جلسات الدخول | 32 حرفاً على الأقل |
| `SESSION_CODE_KEY` | تشفير رموز الجلسات (AES-256-GCM) | تغييره يُبطل كل الرموز القائمة |
| `ADMIN_PHONE` | رقم المدير | **غيّره فوراً** عن `01000000000` |

> `ADMIN_PHONE` الافتراضي خطر حقيقي: أي شخص يسجّل بهذا الرقم يُرقّى إلى
> `admin` تلقائياً عند أول تأكيد رمز. `env.js` يرفض الإقلاع ما دام على القيمة الافتراضية.

---

## 4) الخادم (Express)

### Railway (الأسهل)
1. `New Project` ← من GitHub.
2. **Root Directory**: `server-backend`
3. **Build Command**: `npm ci`
4. **Start Command**: `npm start`
5. أضف المتغيرات (القائمة الكاملة بالأسفل).
6. نطاق: `api.rahma-health.com` ← ضعه في `CORS_ORIGINS`.
7. Health check path: `GET /api/v1/health`

### Render
Root Directory = `server-backend` · Start = `npm start`

### Fly.io
```bash
fly launch --no-deploy        # ثم عدّل fly.toml
fly deploy
```

### متغيرات الخادم — القائمة الكاملة
```
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MAX=10

JWT_SECRET=<48 حرفاً>
SESSION_CODE_KEY=<48 حرفاً>
ADMIN_PHONE=01xxxxxxxxx

CORS_ORIGINS=https://rahma-health.com,https://www.rahma-health.com

SMS_PROVIDER=TWILIO
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

قائمة كاملة موثّقة في `server-backend/.env.example`.

---

## 5) الواجهة (Next.js) على Vercel

1. `vercel` ← **Import Project**.
2. **Root Directory**: جذر المستودع (وليس `server-backend`).
3. Framework Preset: Next.js — يقرأ `vercel.json` تلقائياً.
4. Environment Variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://api.rahma-health.com
   NEXT_PUBLIC_APP_URL=https://rahma-health.com
   ```
5. Domains ← `rahma-health.com`.

> `NEXT_PUBLIC_*` تُحقن وقت **البناء**. تغييرها يستلزم إعادة نشر كاملة (Redeploy)،
> لا مجرد إعادة تشغيل.

الإعدادات: نسخة التطوير في `server-backend/.env`، والمرجع الكامل للإنتاج
(بلا أسرار) في `server-backend/.env.example`.

`vercel.json` يضبط تلقائياً: `X-Frame-Options` · `nosniff` · HSTS ·
`Referrer-Policy` · `no-store` على مسارات API.

---

## 6) تطبيق الموبايل (Capacitor)

`capacitor.config.json` يشير إلى `https://rahma-health.com` — أي أن التطبيق يعرض
الموقع المنشور مباشرة، فأي تحديث ويب يصل المستخدمين فوراً دون إصدار جديد.

```bash
npm run build          # بناء الواجهة
npx cap sync android   # مزامنة Capacitor
npx cap open android   # Android Studio
```

من Android Studio: `Build` ← `Generate Signed Bundle (.aab)` ← رفعه إلى Google Play.

**إعدادات安卓:**
- `allowMixedContent: false` — يمنع HTTP داخل WebView الآمن.
- `webContentsDebuggingEnabled: false` — لا فحص عن بُعد في الإنتاج.
- **Signing key**: احتفظ بنسخة آمنة. فقدانه يعني عجزك عن نشر أي تحديث لاحقاً.

---

## 7) قائمة تحقّق قبل الإطلاق

```bash
npm run typecheck      # 0 أخطاء
npm run test:guard     # 6/6 حواجز الإنتاج
npm run test:e2e       # 57 اختبار (يتطلب الخادم يعمل)
npm run build          # بناء ناجح
```

- [ ] `npm run db:check` ← 8/8 جداول
- [ ] `GET /api/v1/health` يرجع `200` و `database.status: ok`
- [ ] `ADMIN_PHONE` غير الافتراضي
- [ ] رسالة SMS حقيقية تصل فعلاً من `POST /api/v1/auth/send-otp`
- [ ] تسجيل ممرض → **لا يظهر** في `/api/v1/nurses` قبل اعتماد الإدارة
- [ ] جلسة كاملة منظّفة → الرصيد ينقص 10 ج.م **مرة واحدة فقط**
- [ ] `CORS_ORIGINS` بلا `*` وبلا `localhost`
- [ ] النطاقان تحت TLS (شهادة خضراء في المتصفح)

---
## ملحق: مشاكل Supabase الشائعة (من تجربة فعلية)

### 1) `ENOTFOUND db.<ref>.supabase.co` — لا يوجد سجل IPv4

بعض مشاريع Supabase الحديثة تخدم مضيف قاعدة البيانات بـ **IPv6 فقط**:

```bash
nslookup -type=A    db.<ref>.supabase.co 8.8.8.8   # لا نتيجة
nslookup -type=AAAA db.<ref>.supabase.co 8.8.8.8   # 2a05:... فقط
```

إن كان جهازك بلا مسار IPv6 فلن يتوصّل إطلاقاً.

### 2) `tenant/user postgres.<ref> not found` على الـ Pooler

هذا **ليس** خطأ كلمة مرور. معناه أن الـ Session Pooler **غير مفعّل** لهذا المشروع.

الحل: Dashboard ← **Settings ← Database ← Connection Pooler** ← فعّل
**Session pooler**، ثم انسخ الرابط المعروض (يحتوي المنطقة الصحيحة).

### 3) الحل الأسرع والأضمن: SQL Editor

لا يحتاج منفذ قاعدة بيانات إطلاقاً — يعمل عبر HTTPS:

1. Dashboard ← **SQL Editor** ← New query
2. انسخ محتوى `schema.sql` كاملاً والصقه ← **Run**
3. تأقّد: `select count(*) from information_schema.tables where table_schema='public';`

### فحص الاتصال بعد الحل
```bash
npm run db:migrate   # طبّق المخطط
npm run db:check     # يجب أن يطبع 8/8
npm run test:e2e     # 57 اختباراً على Postgres الحقيقي
```

> هذا هو أول تشغيل حقيقي لمحوّل `db-postgres.js` — توقّع تعديلاً بسيطاً
> (غالباً أسماء أعمدة أو تحويل `NUMERIC` إلى `Number`).

---

## 8) استكشاف الأخطاء



| رسالة الإقلاع | السبب | الحل |
|---|---|---|
| `DATABASE_URL required in production` | لا قاعدة بيانات | اضبط `DATABASE_URL` |
| `JWT_SECRET مطلوب` / `قصير` | سر ضعيف | `node server-backend/env.js` |
| `ADMIN_PHONE ما زال القيمة الافتراضية` | لم تغيّره | غيّره لرقمك |
| `SMS_PROVIDER=CONSOLE مرفوض` | مزوّد تجريبي | اضبط Twilio / SMS Misr |
| `إعدادات مزوّد ... ناقصة` | متغيرات SMS ناقصة | أكملها |
| `CORS_ORIGINS لا يقبل "*"` | إعداد خطر | حدد نطاقاتك |
| `database.status: down` | رابط أو شبكة | `npm run db:check` |

---

## 9) أوامر التطوير المحلي

```bash
npm run seed          # حسابات تجربة
npm run server        # الخادم (Terminal 1)
npm run dev           # الواجهة (Terminal 2)
npm run verify:local  # فحص دخول + حجز
```

بدون `DATABASE_URL` يعمل الخادم بملفات JSON محلياً — ويطبع تحذيراً.
هذا الوضع **مرفوض تماماً** في الإنتاج، و`db.js` يرمي خطأ ويمنع الإقلاع.


