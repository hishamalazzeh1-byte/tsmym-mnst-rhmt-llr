import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2.5 font-bold group', className)}
      aria-label="رحمة - الصفحة الرئيسية"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-xs ring-1 ring-border/40 transition-transform group-hover:scale-105">
        <Image
          src="/app-icon.png"
          alt="رحمة"
          width={40}
          height={40}
          className="size-full object-cover"
          priority
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-xl font-bold text-primary tracking-tight">رحمة</span>
        <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
          التمريض والإسعاف المنزلي
        </span>
      </span>
    </Link>
  )
}
