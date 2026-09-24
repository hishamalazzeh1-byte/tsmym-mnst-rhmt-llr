'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  HeartPulse,
  IdCard,
  Stethoscope,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Role = 'patient' | 'nurse'

const STEPS_BY_ROLE: Record<Role, string[]> = {
  patient: ['نوع الحساب', 'البيانات', 'توثيق الهوية'],
  nurse: ['نوع الحساب', 'البيانات', 'التوثيق المهني'],
}

export function RegisterForm() {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [nationalId, setNationalId] = useState('')

  const steps = role ? STEPS_BY_ROLE[role] : STEPS_BY_ROLE.patient
  const isLast = step === steps.length - 1
  const nationalIdValid = /^\d{14}$/.test(nationalId)

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                i < step && 'border-primary bg-primary text-primary-foreground',
                i === step && 'border-primary text-primary',
                i > step && 'border-border text-muted-foreground',
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-xs sm:block',
                i === step ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid gap-3">
          <RoleCard
            active={role === 'patient'}
            onClick={() => setRole('patient')}
            icon={<HeartPulse className="size-6" />}
            title="مريض / أسرة"
            desc="احجز رعاية تمريضية منزلية لك أو لأحد أفراد عائلتك"
          />
          <RoleCard
            active={role === 'nurse'}
            onClick={() => setRole('nurse')}
            icon={<Stethoscope className="size-6" />}
            title="ممرض / مقدم رعاية (رصيد 100 ج.م مجاناً)"
            desc="سجل الآن واحصل على 100 جنيه رصيد مبدئي يكفي لتنفيذ أول 10 جلسات"
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fname">الاسم الأول</Label>
              <Input id="fname" placeholder="أحمد" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lname">الاسم الأخير</Label>
              <Input id="lname" placeholder="محمد" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone2">رقم الهاتف</Label>
            <Input id="phone2" type="tel" inputMode="tel" placeholder="01xxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pass2">كلمة المرور</Label>
            <Input id="pass2" type="password" placeholder="••••••••" dir="ltr" />
          </div>
        </div>
      )}

      {step === 2 && role === 'patient' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <IdCard className="mb-2 size-5 text-primary" />
            نتحقق من هويتك عبر الرقم القومي لضمان أمان الخدمة. بياناتك محفوظة
            ومشفّرة ولن تُشارك مع الممرضين.
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nid">الرقم القومي (14 رقم)</Label>
            <Input
              id="nid"
              inputMode="numeric"
              maxLength={14}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
              placeholder="2xxxxxxxxxxxxx"
              dir="ltr"
            />
            {nationalId.length > 0 && !nationalIdValid && (
              <p className="text-xs text-destructive">يجب أن يتكوّن من 14 رقماً</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && role === 'nurse' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs text-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-primary text-sm">
              <BadgeCheck className="size-4" />
              هدية ترحيبية: 100 جنيه رصيد مبدئي في محفظتك فور اعتماد الحساب
            </div>
            <p className="text-muted-foreground leading-relaxed">
              يكفي الرصيد لتنفيذ <strong>أول 10 جلسات مجاناً</strong> بدون أي دفع مسبق. عمولة المنصة الثابتة 10 جنيه فقط تخصم تلقائياً من الرصيد مع كل جلسة منتهية ومؤكدة.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nid2">الرقم القومي</Label>
            <Input id="nid2" inputMode="numeric" maxLength={14} placeholder="2xxxxxxxxxxxxx" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="syndicate">رقم كارنيه النقابة</Label>
            <Input id="syndicate" placeholder="رقم القيد بنقابة التمريض" dir="ltr" />
          </div>
          <UploadField label="صورة بطاقة الرقم القومي" />
          <UploadField label="كارنيه نقابة التمريض" />
          <UploadField label="مؤهل التمريض / الشهادة" />
        </div>
      )}

      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            <ArrowRight className="size-4" /> السابق
          </Button>
        )}
        {isLast ? (
          <Button asChild className="flex-1" size="lg" disabled={role === 'patient' && !nationalIdValid}>
            <Link href={role === 'nurse' ? '/auth/pending' : '/dashboard'}>
              {role === 'nurse' ? 'إرسال للمراجعة' : 'إنشاء الحساب'}
            </Link>
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            disabled={step === 0 && !role}
            onClick={() => setStep((s) => s + 1)}
          >
            التالي <ArrowLeft className="size-4" />
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  )
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-4 rounded-xl border p-4 text-right transition-colors',
        active ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50',
      )}
    >
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-lg',
          active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{desc}</span>
      </span>
    </button>
  )
}

function UploadField({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50">
        <Upload className="size-4" />
        اضغط لرفع الملف
        <input type="file" className="sr-only" accept="image/*,.pdf" />
      </label>
    </div>
  )
}
