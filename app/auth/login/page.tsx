// app/auth/login/page.tsx
// صفحة تسجيل الدخول — تستخدم LoginForm التفاعلية

import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'تسجيل الدخول | رحمة' }

export default function LoginPage() {
  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="اختر طريقة الدخول المناسبة لك"
    >
      <LoginForm />
    </AuthShell>
  )
}
