import { PageShell, PageHeader } from '@/components/page-shell'
import { NursesBrowser } from '@/components/nurses-browser'

export const metadata = {
  title: 'ابحث عن ممرض معتمد | رحمة',
  description: 'تصفّح الممرضين والمسعفين المعتمدين قرب موقعك الجغرافي في كافة محافظات مصر.',
}

export default async function NursesPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>
}) {
  const { service } = await searchParams

  return (
    <PageShell>
      <PageHeader
        title="ابحث عن ممرض معتمد"
        description="اختر من بين نخبة من الممرضين والمسعفين الموثّقين قرب موقعك الجغرافي في كافة محافظات مصر، وقارن التقييمات والخبرات الميدانية واحجز في دقائق."
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <NursesBrowser initialService={service} />
      </div>
    </PageShell>
  )
}
