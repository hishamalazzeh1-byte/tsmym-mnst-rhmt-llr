import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Calendar, ShieldCheck } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { SessionTracker } from '@/components/session-tracker'
import { DEMO_BOOKINGS } from '@/lib/data'

export function generateStaticParams() {
  return DEMO_BOOKINGS.map((s) => ({ id: s.id }))
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = DEMO_BOOKINGS.find((s) => s.id === id) || DEMO_BOOKINGS[0]

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="size-4" /> العودة إلى قائمة الجلسات
          </Link>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            توثيق رقمي برمز التحقق وتأكيد عمولة التطبيق (10 ج.م)
          </span>
        </div>

        <SessionTracker session={session} />
      </div>
    </PageShell>
  )
}
