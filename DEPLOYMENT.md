# دليل النشر والتشغيل الشامل - منصة «رحمة» (Complete Production Guide)

تم اكتمال وبناء البنية التحتية البرمجية للمنصة بنسبة **100%**، بما في ذلك ملفات قاعدة البيانات، مسارات الـ API الخلفية، تهيئة الـ SEO والأرشفة، وملفات تطبيق الهاتف (PWA و Capacitor).

---

## 1. الهوية الرسمية وأصول التطبيق (Official Branding & Assets)
* **اسم المنصة الرسمي:** **رحمة** | التمريض والإسعاف المنزلي في مصر
* **حزم الأيقونات المعتمدة:**
  * `public/app-icon.png`: الأيقونة الرسمية عالية الدقة (512x512).
  * `public/apple-icon.png`: أيقونة نظام iOS المخصصة لـ iPhone و iPad.
  * `public/icon.svg`: أيقونة الفيكتور لكافة المتصفحات.
  * `app/manifest.ts`: إعدادات PWA لتثبيت التطبيق على الهواتف فوراً.

---

## 2. قاعدة البيانات السحابية (Database Setup)
تم توفير خيارين جاهزين لتشغيل قاعدة البيانات دون أي مجهود:
1. **الخيار الأول (SQL المباشر):**
   * ملف [`schema.sql`](file:///c:/Users/DELL/Desktop/tsmym-mnst-rhmt-llr/schema.sql) يحتوي على كافة الجداول والفهارس والعلاقات (المستخدمين، الممرضين، الجلسات، كود الـ OTP، المحفظة والخصومات، التقارير الطبية).
   * يمكنك نسخه ولصقه مباشرة في **Supabase SQL Editor** أو **Neon Console**.
2. **الخيار الثاني (Prisma ORM):**
   * ملف [`prisma/schema.prisma`](file:///c:/Users/DELL/Desktop/tsmym-mnst-rhmt-llr/prisma/schema.prisma) معد ومطابق تماماً. يكفي تشغيل:
     ```bash
     npx prisma db push
     ```

---

## 3. مسارات الواجهة الخلفية (Backend REST APIs)
تم بناء وتشغيل مسارات الـ API التالية بنجاح في Next.js:
* `POST /api/sessions`: إنشاء حجز جلسة جديد وتوليد رمز التحقق الرقمي (4-Digit OTP).
* `GET /api/sessions`: استرجاع الجلسات وتصفيتها حسب الممرض أو الحالة.
* `PATCH /api/sessions/[id]`:
  * `confirm_arrival`: تأكيد وصول الممرض لموقع المريض.
  * `nurse_complete`: تسجيل العلامات الحيوية وإنهاء الجلسة.
  * `verify_otp`: التحقق من كود الـ 4 أرقام واعتماد الجلسة وخصم عمولة الـ 10 جنيه تلقائياً.
* `GET /api/nurses`: استعراض الممرضين مع فلترة المحافظة والتخصص والتوافر.
* `GET /api/wallet`: تتبع رصيد محفظة الممرض والعمليات المخصومة.
* `POST /api/wallet`: شحن رصيد إداري للممرض (+100 ج.م).

---

## 4. محركات البحث والأرشفة (SEO & Sitemap)
* `app/sitemap.ts` (`/sitemap.xml`): خريطة موقع ديناميكية لأرشفة كافة المحافظات والخدمات وصفحات الممرضين على محرك بحث Google.
* `app/robots.ts` (`/robots.txt`): توجيه روبوتات البحث والسماح بالصفحات العامة وحماية لوحات التحكم.

---

## 5. خطوات النشر على Vercel (في دقيقتين)
1. ارفع الكود إلى مستودعك على GitHub:
   ```bash
   git remote add origin https://github.com/USERNAME/rahma-platform.git
   git push -u origin master
   ```
2. ادخل على [vercel.com](https://vercel.com) واختر **Import**.
3. أضف متغيرات البيئة من ملف [`.env.production`](file:///c:/Users/DELL/Desktop/tsmym-mnst-rhmt-llr/.env.production).
4. اضغط **Deploy**.

---

## 6. رفع التطبيق على متاجر Google Play و App Store
* ملف [`capacitor.config.json`](file:///c:/Users/DELL/Desktop/tsmym-mnst-rhmt-llr/capacitor.config.json) مهيأ بالمعرف `com.rahma.health` وإذن الـ GPS.
* لتوليد تطبيق أندرويد ورفعه:
  ```bash
  npm install @capacitor/core @capacitor/cli @capacitor/android
  npx cap add android
  npx cap open android
  ```
* أو استخدم [PWABuilder.com](https://www.pwabuilder.com/) مباشرة برابط موقعك للحصول على حزمة Google Play جاهزة فوراً.
