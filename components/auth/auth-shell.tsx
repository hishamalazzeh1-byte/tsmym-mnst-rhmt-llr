import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/logo'
import { ShieldCheck } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link href="/" className="text-sm font-medium opacity-80 hover:opacity-100 flex items-center gap-1">
            &rarr; العودة للرئيسية
          </Link>
          <div>
            <ShieldCheck className="mb-6 size-12 opacity-90" />
            <h2 className="text-3xl font-bold leading-snug">
              رعاية تمريضية موثوقة في جميع محافظات مصر
            </h2>
            <p className="mt-4 max-w-sm text-primary-foreground/80 leading-relaxed">
              جميع الممرضين معتمدون ومُتحقق من قيدهم بنقابة المهن التمريضية وبطاقة الرقم
              القومي، مع رصيد مبدئي 100 جنيه للممرض وعمولة تطبيق 10 جنيه فقط لكل جلسة مؤكدة.
            </p>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-2xl font-bold">٢٧</div>
              <div className="opacity-80">محافظة مغطاة</div>
            </div>
            <div>
              <div className="text-2xl font-bold">+١٥٠٠٠</div>
              <div className="opacity-80">جلسة منفذة</div>
            </div>
            <div>
              <div className="text-2xl font-bold">٤.٩</div>
              <div className="opacity-80">متوسط التقييم</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
