/** @type {import('next').NextConfig} */

// وجهة الخادم — تُقرأ من متغير خادمي (غير NEXT_PUBLIC) حتى لا تُحرق قيمته
// في حزمة العميل. القيمة الافتراضية للتطوير المحلي فقط.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:5000'

const nextConfig = {
  // لا يتم تجاهل أخطاء TypeScript — يجب أن يكون الكود نظيفاً فعلياً
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },

  /**
   * وسيط (proxy) لطلبات الـ API.
   *
   * السبب: المتصفح يستدعي /api/v1/... على نفس نطاق الواجهة، ثم يمرّر Next.js
   * الطلب من جهة الخادم إلى الخادم الخلفي. الفوائد:
   *   1) لا حاجة لضبط CORS إطلاقاً
   *   2) لا نطاق مكتوب في الكود — يعمل على أي نطاق دون إعادة بناء
   *   3) عنوان الخادم الخلفي لا يُكشف للمتصفح
   *
   * هذا يتطلب خادماً فعلياً، لذلك أزلنا output:'export'.
   */
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${BACKEND_ORIGIN}/api/v1/:path*` }]
  },
}

export default nextConfig

