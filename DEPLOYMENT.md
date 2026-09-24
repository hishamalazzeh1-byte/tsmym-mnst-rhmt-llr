# دليل النشر والإعدادات للإنتاج - منصة «رحمة» (Production & App Store Deployment Guide)

تم تجهيز التطبيق ليكون مرناً بالكامل للإنتاج (**Production-Ready**)، مع الأيقونة الرسمية المعتمدة، الهوية البصرية، وتطبيق الويب التقدمي (PWA) الجاهز للنشر على الاستضافة ومتاجر التطبيقات مباشرة، مع التركيز التام على سلاسة رحلة توصيل الممرض للمريض.

---

## 1. الهوية والاسم والأيقونة الرسمية (Branding & Official App Icon)

* **اسم المنصة:** **رحمة** | التمريض والإسعاف المنزلي في مصر
* **الأيقونة الرسمية المعتمدة:**
  * `public/app-icon.png`: أيقونة التطبيق بدقة فائقة (512x512) بتدرج طبي سماوي وأزرق ملكي مع قلب ونبض وصليب الرعاية التمريضية.
  * `public/apple-icon.png`: أيقونة مخصصة لأجهزة iPhone و iPad ونظام iOS (192x192).
  * `public/icon.svg`: أيقونة فيكتور فائقة الوضوح لكافة الشاشات والمتصفحات.
  * `app/manifest.ts`: ملف الـ Manifest الرسمي لدعم التثبيت الفوري كتطبيق هاتف (PWA) مع ألوان الهوية والشاشات الكاملة.

يمكن تخصيص الاسم والدومين عبر ملف المتغيرات البيئية [`.env`](file:///c:/Users/DELL/Desktop/tsmym-mnst-rhmt-llr/.env):
```env
NEXT_PUBLIC_APP_NAME="رحمة"
NEXT_PUBLIC_APP_TAGLINE="التمريض والإسعاف المنزلي في مصر"
NEXT_PUBLIC_APP_DOMAIN="rahma-health.com"
NEXT_PUBLIC_APP_URL="https://rahma-health.com"
NEXT_PUBLIC_SUPPORT_PHONE="16123"
NEXT_PUBLIC_SUPPORT_EMAIL="support@rahma-health.com"
```

---

## 2. دورة "توصيل الممرض للمريض" السلسة
1. **طلب الخدمة وتحديد الموقع:**
   * يختار المريض نوع الرعاية (غيار جروح، حقن، رعاية ما بعد العمليات، إلخ).
   * يحدد موقعه الجغرافي وعنوانه التفصيلي عبر GPS أو اختيار المحافظة والحي.
   * إشعار واضح: **«الدفع كاش للممرض باليد عند تقديم الخدمة المنزلية»**.
2. **توجيه الممرض عبر خرائط جوجل (Google Maps Navigation):**
   * تظهر للممرض تفاصيل الجلسة والعنوان وبيانات اتصال المريض.
   * زر مباشر **«فتح في خرائط جوجل»** لتوجيه الممرض إلى موقع المريض فوراً.
3. **تأكيد الوصول ورمز التحقق (4-Digit OTP):**
   * عند الوصول، يضغط الممرض «تأكيد الوصول للموقع».
   * يقدم الرعاية ويسجل القياسات الحيوية (الضغط، النبض، الحرارة).
   * يدخل الممرض رمز التحقق الرقمي المكون من 4 أرقام الممنوح للمريض لتأكيد الجلسة رسمياً وضمان حقوق الطرفين.

---

## 3. النظام المالي وعمولة الشركة (10 جنيه) والمحفظة
1. **عمولة التطبيق للشركة:** **10 جنيه مصري** ثابتة عن كل جلسة يتم إنهاء تنفيذها وتأكيدها برمز التحقق.
2. **الرصيد المبدئي للممرض:** يُمنح كل ممرض جديد رصيداً ترحيبياً قدره **100 جنيه مصري** فور التسجيل (يكفي لتنفيذ **أول 10 جلسات مجاناً**).
3. **الخصم التلقائي في الخلفية:** يتم خصم 10 جنيه تلقائياً من رصيد محفظة الممرض في الخلفية بمجرد تأكيد الجلسة برمز التحقق OTP، وتوثيق الخصم في سجل المعاملات.
4. **طريقة دفع المريض:** تسدد قيمة الخدمة التمريضية **كاش مباشرة للممرض** باليد على أرض الواقع دون أي تعقيد.

---

## 4. خطوات النشر على منصة Vercel (مستحسن وأسرع طريقة)

1. ارفع المشروع إلى حساب GitHub أو GitLab الخاص بك.
2. ادخل إلى [vercel.com](https://vercel.com) واضغط **Add New Project**.
3. استورد المستودع (Import Repository).
4. في قسم **Environment Variables**، أضف المتغيرات الموجودة في ملف `.env.production`.
5. اضغط **Deploy**.
6. في إعدادات المشروع **Settings -> Domains**، أضف دومينك الرسمي واضبط سجلات الـ DNS.

---

## 5. خطوات النشر على سيرفر خاص (VPS / Ubuntu / Node.js)

```bash
# 1. تحديث السيرفر وتثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# 2. تثبيت الاعتمادات
npm install

# 3. بناء نسخة الإنتاج
npm run build

# 4. تشغيل التطبيق في الخلفية بواسطة PM2
sudo npm install -g pm2
pm2 start npm --name "rahma-platform" -- start
pm2 save
pm2 startup

# 5. تفعيل شهادة SSL المجانية لدومينك بواسطة Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d rahma-health.com -d www.rahma-health.com
```

---

## 6. رفع التطبيق على متجر Google Play و Apple App Store

التطبيق مجهز بمعايير الـ Progressive Web App (PWA) الحديثة:
1. **التحويل لـ Android APK / AAB (Google Play):**
   * يمكنك استخدام أداة [PWABuilder](https://www.pwabuilder.com/) الرسمية من Microsoft: ضع رابط موقعك وسيقوم بتوليد حزمة Android TWA جاهزة للرفع على Google Play Console في دقائق.
   * أو استخدام **Capacitor**:
     ```bash
     npm install @capacitor/core @capacitor/cli @capacitor/android
     npx cap init "رحمة" "com.rahma.health"
     npx cap add android
     npx cap open android
     ```
2. **التحويل لـ iOS (Apple App Store):**
   * التثبيت المباشر: يفتح المستخدم Safari ويضغط «إضافة إلى الشاشة الرئيسية (Add to Home Screen)» ليصبح تطبيقاً كاملاً على الشاشة بدون شريط متصفح.
   * التغليف لـ App Store: عبر Capacitor لنظام iOS:
     ```bash
     npm install @capacitor/ios
     npx cap add ios
     npx cap open ios
     ```
