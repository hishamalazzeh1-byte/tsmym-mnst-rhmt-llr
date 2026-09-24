import { Search, CalendarClock, HeartPulse } from 'lucide-react'

const STEPS = [
  {
    icon: Search,
    title: 'اختر الخدمة أو افحص أعراضك',
    desc: 'حدد نوع الرعاية التمريضية التي تحتاجها أو استخدم الفحص الذكي للأعراض ليقترح عليك الخدمة المناسبة.',
  },
  {
    icon: CalendarClock,
    title: 'حدد الموقع واحجز الممرض الأقرب',
    desc: 'شارك موقعك الجغرافي (GPS)، قارن التقييمات والخبرات التمريضية، واحجز الموعد الذي يناسبك.',
  },
  {
    icon: HeartPulse,
    title: 'استقبل الرعاية وأكّد إتمام الجلسة',
    desc: 'يصل الممرض إلى منزلك، ويتم توثيق تنفيذ الخدمة وتأكيد إتمام الجلسة بنجاح عبر كود التحقق الرقمي.',
  },
]

export function HowItWorks() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">كيف تعمل منصة «رحمة»؟</h2>
          <p className="mt-2 text-muted-foreground">
            ثلاث خطوات بسيطة تفصلك عن رعاية صحية وتمريضية موثوقة في منزلك
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-background shadow-xs ring-1 ring-border">
                <step.icon className="size-7 text-primary" />
              </div>
              <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-2 font-semibold text-lg">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
