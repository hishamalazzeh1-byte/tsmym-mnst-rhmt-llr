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

  // النظام المالي والعمولات
  financial: {
    platformCommissionPerSession: 10, // عمولة المنصة الثابتة (10 جنيه مصري) لكل جلسة منتهية
    nurseInitialWelcomeCredit: 100, // رصيد مبدئي ترحيبي لكل ممرض جديد (100 جنيه = 10 جلسات)
    freeSessionsInitialQuota: 10, // عدد الجلسات المتاحة بالرصيد المبدئي
    paymentModel: 'cash_to_nurse', // الممرض يحصل على قيمة الجلسة كاش مباشرة باليد من المريض
  },

  // إعدادات قواعد البيانات والتكامل
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/rahma_db',
  },
} as const
