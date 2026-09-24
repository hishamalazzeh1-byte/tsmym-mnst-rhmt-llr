import Link from 'next/link'
import { Bot, Sparkles, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TriageCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground md:px-12">
        <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -right-10 size-72 rounded-full bg-white/5" />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              <Sparkles className="size-4" /> مدعوم بالذكاء الاصطناعي
            </span>
            <h2 className="text-3xl font-bold leading-tight">
              لست متأكداً من نوع الرعاية التي تحتاجها؟
            </h2>
            <p className="text-primary-foreground/90">
              صف أعراضك بلغتك، وسيساعدك الفحص الذكي على فهم حالتك واقتراح الخدمة
              التمريضية المناسبة، مع تنبيهك فوراً إذا كانت حالتك تستدعي طوارئ.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/triage">
                <Bot className="size-5" /> ابدأ الفحص الذكي
              </Link>
            </Button>
            <p className="flex items-center gap-2 text-sm text-primary-foreground/80">
              <ShieldCheck className="size-4" />
              الفحص إرشادي فقط ولا يُغني عن تشخيص الطبيب
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="space-y-3 text-sm">
              <div className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white/20 px-4 py-2">
                عندي ألم في الجرح بعد عملية الزائدة وفيه احمرار خفيف
              </div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-tr-sm bg-white px-4 py-2 text-foreground">
                يبدو أنك تحتاج إلى <b>غيار ومتابعة الجرح</b>. أنصح بحجز ممرض
                متخصص في رعاية ما بعد العمليات لتقييم الاحمرار ومنع الالتهاب.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
