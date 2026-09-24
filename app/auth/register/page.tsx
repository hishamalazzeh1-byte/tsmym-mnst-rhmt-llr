import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata = { title: 'إنشاء حساب | رحمة' }

export default function RegisterPage() {
  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="انضم إلى منصة رحمة للرعاية التمريضية المنزلية"
    >
      <RegisterForm />
    </AuthShell>
  )
}
