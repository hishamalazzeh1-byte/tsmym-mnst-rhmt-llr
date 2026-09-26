'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { apiRegister, apiSendOtp } from '@/lib/auth-session'

type Role = 'patient' | 'nurse'

const STEPS_BY_ROLE: Record<Role, string[]> = {
  patient: ['نوع الحساب', 'البيانات', 'توثيق الهوية'],
  nurse: ['نوع الحساب', 'البيانات', 'التوثيق المهني'],
}

export function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [nationalId, setNationalId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [nurseNationalId, setNurseNationalId] = useState('')
  const [syndicate, setSyndicate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const steps = role ? STEPS_BY_ROLE[role] : STEPS_BY_ROLE.patient
  const isLast = step === steps.length - 1
  const nationalIdValid = /^\d{14}$/.test(nationalId)

  async function handleCompleteRegistration() {
    setError('')
    setSubmitting(true)
    const res = await apiRegister({
      firstName,
      lastName,
      phone,
      password,
      role,
      nationalId: role === 'nurse' ? nurseNationalId : nationalId,
      syndicateNumber: syndicate,
    })
    setSubmitting(false)
    if (!res.success) {
      setError(res.message || 'تعذر إنشاء الحساب')
      return
    }
    const otp = await apiSendOtp(phone.replace(/\D/g, ''))
    if (!otp.success) {
      router.push('/auth/login')
      return
    }
    router.push(role === 'nurse' ? '/auth/pending' : '/auth/login')
  }

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
              <Input
                id="fname"
                placeholder="أحمد"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lname">الاسم الأخير</Label>
              <Input
                id="lname"
                placeholder="محمد"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone2">رقم الهاتف</Label>
            <Input
              id="phone2"
              type="tel"
              inputMode="tel"
              placeholder="01xxxxxxxxx"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pass2">كلمة المرور</Label>
            <Input id="pass2" type="password" placeholder="••••••••" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} />
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
            <Input id="nid2" inputMode="numeric" maxLength={14} placeholder="2xxxxxxxxxxxxx" dir="ltr" value={nurseNationalId} onChange={(e) => setNurseNationalId(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="syndicate">رقم كارنيه النقابة</Label>
            <Input id="syndicate" placeholder="رقم القيد بنقابة التمريض" dir="ltr" value={syndicate} onChange={(e) => setSyndicate(e.target.value)} />
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        {isLast ? (
          <Button
            className="flex-1"
            size="lg"
            disabled={submitting || (role === 'patient' && !nationalIdValid) || (role === 'nurse' && (!/^\d{14}$/.test(nurseNationalId) || !syndicate))}
            onClick={handleCompleteRegistration}
          >
            {submitting ? 'جاري الحفظ...' : role === 'nurse' ? 'إنشاء حساب الممرض' : 'إنشاء الحساب'}
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            disabled={step === 0 && !role || (step === 1 && (!firstName || !lastName || phone.replace(/\D/g, '').length < 11 || password.length < 6))}
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
