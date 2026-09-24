import Link from 'next/link'
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { PageHeader, PageShell } from '@/components/page-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICES } from '@/lib/data'
import { SERVICE_ICONS } from '@/lib/service-icons'

export const metadata = {
  title: 'الخدمات | رحمة',
  description: 'تعرّف على خدمات الرعاية التمريضية والإسعافية المنزلية التي نقدمها في كافة محافظات مصر.',
}

export default function ServicesPage() {
  return (
    <PageShell>
      <PageHeader
        title="خدمات الرعاية المنزلية"
        description="نقدم مجموعة متكاملة من خدمات التمريض والإسعاف المنزلي على يد محترفين معتمدين وموثقين، بتغطية شاملة لكافة محافظات الجمهورية وبجودة تليق بصحتك."
      />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {SERVICES.map((service) => {
          const Icon = SERVICE_ICONS[service.icon]
          return (
            <Card key={service.id} className="overflow-hidden shadow-xs hover:border-primary/40 transition-colors">
              <CardContent className="grid items-center gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {Icon ? <Icon className="size-8" /> : null}
                </span>
                <div>
                  <h2 className="text-xl font-bold">{service.title}</h2>
                  <p className="mt-1 text-muted-foreground leading-relaxed">{service.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Check className="size-4 text-primary" /> ممرض معتمد وموثّق بنقابة التمريض
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="size-4 text-primary" /> أدوات معقمة وبروتوكول طبي
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="size-4 text-primary" /> توثيق تقرير الجلسة وتأكيدها
                    </span>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="mb-2 flex items-center justify-center gap-1 text-xs text-primary md:justify-end">
                    <ShieldCheck className="size-3.5" />
                    <span>رعاية طبية معتمدة</span>
                  </div>
                  <Button asChild size="lg">
                    <Link href={`/nurses?service=${service.id}`}>
                      احجز ممرضاً الآن <ArrowLeft className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </PageShell>
  )
}
