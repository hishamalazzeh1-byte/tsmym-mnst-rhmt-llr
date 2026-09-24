import { redirect } from 'next/navigation'

export default function SubscriptionsPage() {
  // تم إلغاء الباقات والأسعار الثابتة تماماً وفق متطلبات التطبيق المحدثة
  redirect('/services')
}
