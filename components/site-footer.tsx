import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Phone, ShieldCheck } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground leading-relaxed">
            منصة مصرية موثوقة تربط المرضى بممرضين ومسعفين معتمدين لتقديم الرعاية
            الصحية في المنزل بأمان وكرامة، وتغطي جميع محافظات الجمهورية.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">الخدمات التمريضية</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/services" className="hover:text-foreground">رعاية ما بعد العمليات</Link></li>
            <li><Link href="/services" className="hover:text-foreground">غيار الجروح والتقرحات</Link></li>
            <li><Link href="/services" className="hover:text-foreground">الحقن والمحاليل الطبية</Link></li>
            <li><Link href="/services" className="hover:text-foreground">رعاية كبار السن</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">المنصة والخدمات</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/nurses" className="hover:text-foreground">ابحث عن ممرض معتمد</Link></li>
            <li><Link href="/triage" className="hover:text-foreground">الفحص الذكي للأعراض</Link></li>
            <li><Link href="/sessions" className="hover:text-foreground">تتبع الجلسات والعمولة</Link></li>
            <li><Link href="/dashboard" className="hover:text-foreground">لوحة التحكم</Link></li>
            <li><Link href="/auth/register" className="hover:text-foreground">انضم كممرض معتمد</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">تواصل معنا</h3>
          <a
            href="tel:16123"
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Phone className="size-4" /> الخط الساخن 16123
          </a>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            بياناتك وموقعك الجغرافي مشفّر ومحمي
          </p>
          <p className="text-xs text-muted-foreground">
            عمولة التطبيق للشركة 10 جنيه فقط لكل جلسة مؤكدة
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} رحمة. جميع الحقوق محفوظة. تعمل المنصة في جميع محافظات مصر.
      </div>
    </footer>
  )
}
