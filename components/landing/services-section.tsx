import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICES } from '@/lib/data'
import { SERVICE_ICONS } from '@/lib/service-icons'

export function ServicesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" id="services">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold">خدمات الرعاية المنزلية</h2>
        <p className="mt-2 text-muted-foreground">
          نغطي احتياجاتك الصحية من الحقن البسيطة إلى الرعاية المتكاملة لكبار السن في جميع محافظات مصر
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => {
          const Icon = SERVICE_ICONS[service.icon]
          return (
            <Link key={service.id} href={`/nurses?service=${service.id}`}>
              <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardContent className="p-6">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {Icon ? <Icon className="size-6" /> : null}
                  </span>
                  <h3 className="mt-4 font-semibold text-lg">{service.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <ShieldCheck className="size-3.5" /> احجز زيارة معتمدة
                    </span>
                    <ArrowLeft className="size-4 text-primary transition-transform group-hover:-translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
