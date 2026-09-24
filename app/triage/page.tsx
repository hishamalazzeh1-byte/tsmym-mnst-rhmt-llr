import { PageShell, PageHeader } from '@/components/page-shell'
import { TriageChecker } from '@/components/triage-checker'

export const metadata = {
  title: 'الفرز الطبي الذكي | رحمة',
  description:
    'صف أعراضك واحصل على تقييم أولي بالذكاء الاصطناعي يوجهك لمستوى الرعاية المناسب.',
}

export default function TriagePage() {
  return (
    <PageShell>
      <PageHeader
        title="الفرز الطبي الذكي"
        description="أداة استرشادية بالذكاء الاصطناعي تساعدك على فهم أعراضك ومعرفة مستوى الرعاية المناسب — طوارئ، زيارة منزلية، أو متابعة ذاتية."
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <TriageChecker />
      </div>
    </PageShell>
  )
}
