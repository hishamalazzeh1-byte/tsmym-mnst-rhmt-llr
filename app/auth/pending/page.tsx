import Link from 'next/link'
import { Clock, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'قيد المراجعة | رحمة' }

export default function PendingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <Logo />
      </div>
      <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Clock className="size-8" />
      </span>
      <h1 className="text-2xl font-bold">طلبك قيد المراجعة</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        شكراً لتسجيلك كمقدم رعاية. يقوم فريقنا بالتحقق من قيدك بنقابة المهن
        التمريضية ومستنداتك. سنخطرك برسالة نصية عند اعتماد حسابك خلال 24 - 48
        ساعة.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 text-primary" />
        عملية التحقق تحمي المرضى وتضمن جودة الخدمة
      </div>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">العودة للرئيسية</Link>
      </Button>
    </div>
  )
}
