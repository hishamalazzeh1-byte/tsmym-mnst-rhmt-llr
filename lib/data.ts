import type { ServiceCategory } from './types'

// جميع محافظات جمهورية مصر العربية (27 محافظة)
export const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'المنوفية',
  'الغربية',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'البحيرة',
]

export const SERVICES: ServiceCategory[] = [
  {
    id: 'post-op',
    title: 'رعاية ما بعد العمليات',
    description:
      'متابعة دقيقة بعد الجراحة تشمل تغيير الغيارات، متابعة الأدوية، والعناية بالجرح لتعافٍ آمن في المنزل.',
    icon: 'Stethoscope',
  },
  {
    id: 'wound-care',
    title: 'غيار الجروح والتقرحات',
    description:
      'تنظيف وتعقيم الجروح والتقرحات وقرح الفراش باستخدام أدوات معقمة وبروتوكولات طبية معتمدة.',
    icon: 'Bandage',
  },
  {
    id: 'injections',
    title: 'الحقن والمحاليل الطبية',
    description:
      'إعطاء الحقن العضلية والوريدية وتركيب المحاليل الطبية بأمان تام وعلى يد ممرض محترف.',
    icon: 'Syringe',
  },
  {
    id: 'newborn',
    title: 'رعاية حديثي الولادة والأم',
    description:
      'العناية بالمولود والأم بعد الولادة، الرضاعة، متابعة الوزن والعلامات الحيوية والدعم المنزلي.',
    icon: 'Baby',
  },
  {
    id: 'physio',
    title: 'جلسات العلاج الطبيعي',
    description:
      'جلسات علاج طبيعي مبدئية لإعادة التأهيل الحركي وتخفيف الآلام تحت إشراف أخصائي معتمد.',
    icon: 'Activity',
  },
  {
    id: 'elderly',
    title: 'مرافقة ورعاية كبار السن',
    description:
      'رعاية شاملة لكبار السن تشمل المتابعة اليومية، الأدوية، والمرافقة الإنسانية والصحية.',
    icon: 'Users',
  },
  {
    id: 'emergency',
    title: 'إسعافات أولية طارئة',
    description:
      'دعم إسعافي أولي سريع للحالات الطارئة قبل الوصول للمستشفى مع توجيه فوري للطوارئ.',
    icon: 'Ambulance',
  },
]

export function serviceTitle(id: string) {
  return SERVICES.find((s) => s.id === id)?.title ?? id
}

export const SESSION_STATUS_MAP: Record<
  string,
  { label: string; color: string; step: number; description: string }
> = {
  pending: {
    label: 'طلب جديد',
    color: 'bg-muted text-muted-foreground border-border',
    step: 1,
    description: 'تم إرسال طلب الحجز وفي انتظار تأكيد الممرض.',
  },
  confirmed: {
    label: 'تم تأكيد الموعد',
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    step: 2,
    description: 'وافق الممرض على الجلسة ومستعد للموعد المحدد.',
  },
  nurse_en_route: {
    label: 'الممرض في الطريق',
    color: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    step: 3,
    description: 'الممرض تحرك نحو موقعك الجغرافي المسجل عبر GPS.',
  },
  nurse_arrived: {
    label: 'وصل الممرض إلى الموقع',
    color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
    step: 4,
    description: 'تم تأكيد وصول الممرض إلى الموقع، وجارٍ بدء تقديم الرعاية.',
  },
  in_progress: {
    label: 'الجلسة جارية الآن',
    color: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
    step: 5,
    description: 'الممرض متواجد في المنزل ويقدم الخدمة التمريضية.',
  },
  completed_by_nurse: {
    label: 'أنهى الممرض الجلسة — بانتظار التأكيد',
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    step: 6,
    description: 'سجّل الممرض انتهاء الجلسة، في انتظار إدخال رمز التحقق لتأكيد الجلسة رسمياً وخصم 10 ج.م عمولة التطبيق.',
  },
  confirmed_completed: {
    label: 'تمت الجلسة وتأكيدها بنجاح',
    color: 'bg-primary/10 text-primary border-primary/30',
    step: 7,
    description: 'تم تأكيد إتمام الجلسة رسمياً برمز التحقق وخصم 10 جنيه عمولة التطبيق من رصيد الممرض.',
  },
  cancelled: {
    label: 'ملغاة',
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    step: 0,
    description: 'تم إلغاء هذه الجلسة.',
  },
}
