import { PageShell } from '@/components/page-shell'
import { SessionDetailClient } from '@/components/session-detail-client'

export function generateStaticParams() {
  return [{ id: '_' }]
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <SessionDetailClient sessionId={id} />
      </div>
    </PageShell>
  )
}
