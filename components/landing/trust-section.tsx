import Link from 'next/link'
import { BadgeCheck, Clock, Coins, Gift, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'كوادر تمريضية موثّقة',
    desc: 'نتحقق من القيد الرسمي بنقابة المهن التمريضية وبطاقة الرقم القومي والمؤهل الدراسي لكل ممرض.',
  },
  {
    icon: ShieldCheck,
    title: 'تأكيد رقمي وتشفير كامل',
    desc: 'نظام رمز تحقق (OTP) لتأكيد وصول وتنفيذ كل جلسة تمريضية، وسجلات وتقارير طبية مشفرة بالكامل.',
  },
  {
    icon: Gift,
    title: 'رصيد مبدئي 100 جنيه للممرض',
    desc: 'يحصل كل ممرض جديد على 100 جنيه رصيداً ترحيبياً يكفي لتنفيذ أول 10 جلسات مجاناً دون أي دفع مسبق.',
  },
  {
    icon: Coins,
    title: 'عمولة ثابتة 10 جنيه فقط',
    desc: 'عمولة تطبيق ثابتة 10 جنيه تخصم تلقائياً من رصيد محفظة الممرض مع كل جلسة يتم إتمامها وتأكيدها.',
  },
]

const STATS = [
  { value: '27', label: 'محافظة مغطاة في جمهورية مصر' },
  { value: '+15,000', label: 'جلسة تمريضية منفذة ومؤكدة' },
  { value: '4.9', label: 'متوسط تقييم المرضى' },
  { value: '100%', label: 'كوادر مقيدة بنقابة التمريض' },
]

export function TrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12 grid grid-cols-2 gap-4 rounded-3xl border border-border/60 bg-muted/30 p-8 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold">لماذا تثق بمنصة «رحمة»؟</h2>
        <p className="mt-2 text-muted-foreground">
          نضع سلامة المريض والأمان المهني في المقام الأول في كل جلسة وزيارة منزلية
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border/60 p-6 transition-shadow hover:shadow-sm"
          >
            <f.icon className="size-8 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center md:flex-row md:text-right">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Gift className="size-6" />
          </span>
          <div>
            <h3 className="text-lg font-bold">هل أنت ممرض أو مسعف معتمد؟</h3>
            <p className="text-sm text-muted-foreground">
              انضم لشبكتنا واحصل فوراً على 100 جنيه رصيد مبدئي ترحيبي (يكفي لـ 10 جلسات مجاناً). عمولة التطبيق 10 جنيه فقط تخصم عند إتمام الجلسة.
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/auth/register?role=nurse">انضم الآن واستلم الـ 100 ج.م</Link>
        </Button>
      </div>
    </section>
  )
}
