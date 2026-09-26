import { NurseProfile } from '@/components/nurse-profile'
import { PageShell } from '@/components/page-shell'

export function generateStaticParams() {
  return [{ id: '_' }]
}

export default async function NurseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <NurseProfile nurseId={id} />
      </div>
    </PageShell>
  )
}
