/**
 * إعدادات التطبيق العامة والمتغيرات البيئية لمنصة «رحمة» (Production Configuration)
 */

export const APP_CONFIG = {
  // اسم المنصة وهوية البراند
  name: process.env.NEXT_PUBLIC_APP_NAME || 'رحمة',
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'التمريض والإسعاف المنزلي في مصر',
  description:
    process.env.NEXT_PUBLIC_APP_DESC ||
    'منصة ذكية وسلسة للرعاية التمريضية والإسعافية المنزلية تربط المريض بأقرب ممرض معتمد في كافة محافظات مصر.',

  // الدومين والروابط
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'rahma-health.com',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://rahma-health.com',

  // بيانات التواصل والدعم
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '16123',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@rahma-health.com',
  officialAmbulanceNumber: '123',

  // النظام المالي والعمولات — مصدر واحد للحقيقة (متغيرات البيئة)
  // تُقرأ القيم من الخادم في كل عملية حسابية؛ هذه مجرد نسخة للعرض
  financial: {
    platformCommissionPerSession: Number(
      process.env.NEXT_PUBLIC_PLATFORM_COMMISSION || 10,
    ),
    nurseInitialWelcomeCredit: Number(
      process.env.NEXT_PUBLIC_NURSE_INITIAL_CREDIT || 100,
    ),
    paymentModel: 'cash_to_nurse',
  },

  // رابط الخادم الذي يحوي قاعدة البيانات الحقيقية
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',

  // إعدادات قواعد البيانات والتكامل
  database: {
    engine: 'file-json',
    directory: process.env.RAHMA_DATA_DIR || 'server-backend/data',
  },
} as const
