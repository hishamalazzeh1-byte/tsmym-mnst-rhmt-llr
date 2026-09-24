import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, MapPin, Search, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/8 via-background to-background" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            رعاية صحية وتمريضية منزلية موثوقة في جميع محافظات مصر
          </span>

          <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl">
            رعاية تمريضية وإسعافية{' '}
            <span className="text-primary">في منزلك</span> على يد محترفين معتمدين
          </h1>

          <p className="text-pretty text-lg text-muted-foreground">
            احجز ممرضاً أو مسعفاً موثوقاً ومقيداً بالنقابة في دقائق، أو استخدم الفحص الذكي
            للأعراض لتحديد نوع الرعاية التمريضية المناسبة، مع تتبع جغرافي دقيق للزيارة المنزلية.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/nurses">
                <Search className="size-5" /> ابحث عن ممرض الآن
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/triage">
                <Sparkles className="size-5" /> جرّب الفحص الذكي
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <BadgeCheck className="size-4 text-primary" /> كوادر تمريضية معتمدة وموثّقة
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="size-4 fill-amber-400 text-amber-400" /> تقييم 4.9 من آلاف المرضى
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4 text-primary" /> تغطية شاملة لـ 27 محافظة
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-border/60 shadow-xl">
            <Image
              src="/hero-home-care.png"
              alt="ممرضة تقدم الرعاية الصحية لمريض في المنزل"
              width={720}
              height={720}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 right-5 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/95 p-3.5 shadow-lg backdrop-blur">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </span>
            <div className="text-sm">
              <p className="font-semibold">تغطية لكافة محافظات مصر</p>
              <p className="text-muted-foreground text-xs">شبكة تمريضية متنامية تغطي 27 محافظة</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
