import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Globe,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { BookingPanel } from '@/components/booking-panel'
import { PageShell } from '@/components/page-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { NURSES, serviceTitle } from '@/lib/data'

export function generateStaticParams() {
  return NURSES.map((n) => ({ id: n.id }))
}

export default async function NurseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const nurse = NURSES.find((n) => n.id === id)
  if (!nurse) notFound()

  const initials = nurse.name.replace(/^أ\.\s*/, '').slice(0, 2)

  const REVIEWS = [
    { name: 'مريم ع.', text: 'ممرضة محترفة ودقيقة جداً في المواعيد، تعاملها راقٍ جداً مع والدتي وأجادت متابعة العلامات الحيوية.', rating: 5 },
    { name: 'خالد ص.', text: 'خبرة واضحة في غيار الجروح والتعقيم، شرح لي كل خطوة بصبر وعناية فائقة. أنصح به بشدة.', rating: 5 },
    { name: 'نهى م.', text: 'وصل في الموعد وكان التعامل ممتازاً والخدمة على أعلى مستوى من الاحترافية والاهتمام.', rating: 5 },
  ]

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/nurses"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="size-4" /> رجوع إلى قائمة الممرضين
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-xs sm:flex-row sm:items-start">
              <Avatar className="size-20 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{nurse.name}</h1>
                  {nurse.verified && (
                    <BadgeCheck className="size-5 text-primary" aria-label="موثّق بالنقابة" />
                  )}
                </div>
                <p className="text-muted-foreground text-sm">{nurse.title}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {nurse.rating}
                    <span className="font-normal text-muted-foreground">
                      ({nurse.reviews} تقييم)
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3.5 text-primary" /> {nurse.area}، {nurse.governorate}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Briefcase className="size-3.5 text-primary" /> {nurse.experienceYears} سنوات خبرة
                  </span>
                </div>

                {nurse.coverageGovernorates && nurse.coverageGovernorates.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">نطاق المحافظات المغطاة:</span>
                    {nurse.coverageGovernorates.map((gov) => (
                      <Badge key={gov} variant="outline" className="text-[11px] font-normal">
                        {gov}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="mb-2 font-semibold">نبذة مهنية</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {nurse.bio}
                  </p>
                </div>
                <div>
                  <h2 className="mb-2 font-semibold">الخدمات والتخصصات</h2>
                  <div className="flex flex-wrap gap-2">
                    {nurse.specialties.map((s) => (
                      <Badge key={s} variant="secondary" className="font-normal">
                        {serviceTitle(s)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="mb-2 flex items-center gap-1 font-semibold">
                    <Globe className="size-4" /> اللغات
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {nurse.languages.join('، ')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-3 font-semibold">آراء المرضى وتجارب الزيارات</h2>
              <div className="space-y-3">
                {REVIEWS.map((r) => (
                  <Card key={r.name}>
                    <CardContent className="p-5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-semibold text-sm">{r.name}</span>
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <BookingPanel nurse={nurse} />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
