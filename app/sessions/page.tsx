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
import { DEMO_BOOKINGS, SESSION_STATUS_MAP } from '@/lib/data'
import { NURSE_COMMISSION_PER_SESSION } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'تتبع الجلسات التمريضية | رحمة',
  description:
    'متابعة وتأكيد إتمام الجلسات التمريضية المنزلية وتوثيق استحقاق عمولة الممرضين.',
}

export default function SessionsPage() {
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
            <h3 className="font-bold text-lg">الجلسات الحالية والسابقة ({DEMO_BOOKINGS.length})</h3>
            <span className="text-xs text-muted-foreground">
              اضغط على أي جلسة لمتابعة مسارها أو تأكيد الإتمام
            </span>
          </div>

          <div className="grid gap-4">
            {DEMO_BOOKINGS.map((session) => {
              const status = SESSION_STATUS_MAP[session.status] || SESSION_STATUS_MAP.pending
              const isConfirmed = session.status === 'confirmed_completed'
              const isWaitingConfirm = session.status === 'completed_by_nurse'

              return (
                <Card
                  key={session.id}
                  className="transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <CardContent className="grid items-center gap-5 p-6 md:grid-cols-[1fr_auto]">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          #{session.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs font-medium', status.color)}
                        >
                          {status.label}
                        </Badge>
                        {isConfirmed && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="size-3" /> تم خصم عمولة التطبيق (10 ج.م)
                          </span>
                        )}
                        {isWaitingConfirm && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                            <Clock className="size-3" /> بانتظار تأكيد المريض
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-bold">{session.service}</h4>
                        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Stethoscope className="size-3.5 text-primary" />
                            الممرض: <strong className="text-foreground">{session.nurseName}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="size-3.5 text-primary" />
                            المريض: <strong className="text-foreground">{session.patientName}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {session.date} — {session.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-primary" />
                          {session.area}، {session.governorate}
                        </span>
                        {session.coordinates && (
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                            GPS: {session.coordinates.lat}°, {session.coordinates.lng}°
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-left md:items-end">
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground block">
                          عمولة التطبيق المخصومة
                        </span>
                        <span className="font-bold text-primary text-base">
                          {session.platformCommission || 10} جنيه مصري
                        </span>
                      </div>
                      <Button asChild size="sm" className="gap-1.5 font-semibold">
                        <Link href={`/sessions/${session.id}`}>
                          فتح شاشة التتبع والتأكيد <ArrowLeft className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
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
