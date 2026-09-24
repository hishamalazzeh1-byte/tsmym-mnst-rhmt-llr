import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = { title: 'تسجيل الدخول | رحمة' }

export default function LoginPage() {
  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="أدخل بياناتك للوصول إلى حسابك"
    >
      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input id="phone" type="tel" inputMode="tel" placeholder="01xxxxxxxxx" dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link href="#" className="text-xs text-primary hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" dir="ltr" />
        </div>
        <Button asChild className="w-full" size="lg">
          <Link href="/dashboard">دخول</Link>
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          أنشئ حساباً جديداً
        </Link>
      </p>
    </AuthShell>
  )
}
