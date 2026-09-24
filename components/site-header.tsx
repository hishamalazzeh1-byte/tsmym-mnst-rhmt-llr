'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu, Stethoscope } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/nurses', label: 'الممرضون' },
  { href: '/services', label: 'الخدمات' },
  { href: '/triage', label: 'الفحص الذكي' },
  { href: '/sessions', label: 'تتبع الجلسات' },
  { href: '/dashboard', label: 'لوحة التحكم' },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                pathname === item.href && 'bg-muted text-foreground font-semibold',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/register">إنشاء حساب</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="القائمة">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-right">
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-1 px-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-muted',
                    pathname === item.href && 'bg-muted text-foreground font-semibold',
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 pt-2 border-t">
                <Button asChild variant="outline">
                  <Link href="/auth/login">تسجيل الدخول</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">إنشاء حساب</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
