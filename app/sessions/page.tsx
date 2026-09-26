'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  MapPin,
  Navigation,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react'
import { PageHeader, PageShell } from '@/components/page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SESSION_STATUS_MAP } from '@/lib/data'
import { fetchSessions } from '@/lib/app-state'
import type { SessionBooking } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionBooking[]>([])

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
  }, [])

  return (
    <PageShell>
      <PageHeader
        title="تتبع وتأكيد الجلسات التمريضية"
        description="نظام متابعة حي لمسار الجلسات التمريضية وتأكيد إتمامها بنجاح مع تسجيل استحقاق عمولة الممرضين (10 جنيه مصري لكل جلسة مؤكدة)."
      />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Commission System Info Banner */}
        <div className="grid gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Coins className="size-4" />
              </span>
              <h2 className="text-base font-bold text-primary">
                النظام المالي وعمولات منصة «رحمة»
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              تثبيت عمولة التطبيق للشركة بقيمة <span className="font-bold text-foreground">10 جنيه مصري</span> عن كل جلسة يتم إنهاء تنفيذها وتأكيدها برمز التحقق.
              يُمنح كل ممرض جديد <span className="font-bold text-primary">رصيداً مبدئياً 100 جنيه</span> (يكفي لتنفيذ أول 10 جلسات مجاناً) ويُخصم منه 10 جنيه تلقائياً مع كل جلسة منتهية.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 shadow-xs ring-1 ring-border/80">
            <Coins className="size-8 text-primary" />
            <div>
              <span className="block text-[11px] text-muted-foreground">عمولة التطبيق للشركة</span>
              <span className="text-xl font-bold text-primary">
                10 ج.م / جلسة
              </span>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">الجلسات الحالية والسابقة ({sessions.length})</h3>
            <span className="text-xs text-muted-foreground">
              اضغط على أي جلسة لمتابعة مسارها أو تأكيد الإتمام
            </span>
          </div>

          <div className="grid gap-4">
            {sessions.length === 0 && (
              <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                لا توجد جلسات بعد. سجّل الدخول واطلب زيارة من قائمة الممرضين.
              </p>
            )}
            {sessions.map((session) => {
              const status = SESSION_STATUS_MAP[session.status] || SESSION_STATUS_MAP.pending
              const isConfirmed = session.status === 'confirmed_completed'
              const isWaitingConfirm = session.status === 'completed_by_nurse'
              const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${
                session.coordinates
                  ? `${session.coordinates.lat},${session.coordinates.lng}`
                  : encodeURIComponent(`${session.address}, ${session.area}, ${session.governorate}`)
              }`

              return (
                <Card key={session.id} className="overflow-hidden transition-all hover:border-primary/50 shadow-2xs">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            #{session.id}
                          </span>
                          <Badge variant="outline" className={cn('text-xs font-semibold', status.color)}>
                            {status.label}
                          </Badge>
                          {session.arrivalConfirmed && (
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              ✓ تم تأكيد الوصول للموقع
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold">{session.service}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                        >
                          <Navigation className="size-3.5" />
                          توجيه لعنوان الزيارة عبر GPS
                        </a>
                        <Button asChild size="sm">
                          <Link href={`/sessions/${session.id}`}>
                            عرض وتتبع بالتفصيل <ArrowLeft className="size-3.5 mr-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                      <div className="space-y-1 bg-muted/20 p-3 rounded-xl">
                        <span className="text-muted-foreground block text-[11px]">بيانات المريض</span>
                        <div className="font-bold text-foreground text-sm">{session.patientName}</div>
                        <div className="text-muted-foreground" dir="ltr">{session.patientPhone}</div>
                      </div>

                      <div className="space-y-1 bg-muted/20 p-3 rounded-xl">
                        <span className="text-muted-foreground block text-[11px]">الممرض المعين</span>
                        <div className="font-bold text-foreground text-sm">{session.nurseName}</div>
                        <div className="text-primary font-semibold">كود التحقق: {session.completionCode}</div>
                      </div>

                      <div className="space-y-1 bg-muted/20 p-3 rounded-xl sm:col-span-2 lg:col-span-1">
                        <span className="text-muted-foreground block text-[11px]">موقع الزيارة</span>
                        <div className="font-bold text-foreground">{session.area}، {session.governorate}</div>
                        <div className="text-muted-foreground truncate">{session.address}</div>
                      </div>
                    </div>

                    {isConfirmed && (
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-4" /> تم تأكيد إتمام الجلسة وتوثيقها رسمياً
                        </span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          خُصمت الـ 10 ج.م عمولة المنصة تلقائياً في الخلفية من محفظة الممرض
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
