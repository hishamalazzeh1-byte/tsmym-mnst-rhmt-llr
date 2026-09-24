'use client'

import { useState } from 'react'
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  KeyRound,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SESSION_STATUS_MAP } from '@/lib/data'
import {
  PLATFORM_COMMISSION_PER_SESSION,
  type SessionBooking,
  type SessionStatus,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface SessionTrackerProps {
  session: SessionBooking
  onSessionUpdated?: (updated: SessionBooking) => void
  userRole?: 'patient' | 'nurse' | 'admin'
}

export function SessionTracker({
  session: initialSession,
  onSessionUpdated,
  userRole = 'patient',
}: SessionTrackerProps) {
  const [session, setSession] = useState<SessionBooking>(initialSession)
  const [activeRole, setActiveRole] = useState<'patient' | 'nurse' | 'admin'>(userRole)
  const [enteredCode, setEnteredCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [nurseNotesInput, setNurseNotesInput] = useState(session.nurseNotes || '')
  const [nurseBp, setNurseBp] = useState(session.vitalSigns?.bloodPressure || '120/80')
  const [nursePulse, setNursePulse] = useState(session.vitalSigns?.pulse || '75')
  const [nurseTemp, setNurseTemp] = useState(session.vitalSigns?.temperature || '37.0')
  const [confirmationBanner, setConfirmationBanner] = useState(
    session.status === 'confirmed_completed',
  )

  const statusInfo = SESSION_STATUS_MAP[session.status] || SESSION_STATUS_MAP.pending

  function updateStatus(nextStatus: SessionStatus, extra: Partial<SessionBooking> = {}) {
    const updated: SessionBooking = {
      ...session,
      status: nextStatus,
      ...extra,
    }
    setSession(updated)
    onSessionUpdated?.(updated)
    if (nextStatus === 'confirmed_completed') {
      setConfirmationBanner(true)
    }
  }

  // 1. الممرض في الطريق
  function handleNurseStartTrip() {
    updateStatus('nurse_en_route', {
      nurseNotes: 'الممرض في الطريق إلى موقع الزيارة التمريضية عبر إحداثيات GPS.',
    })
  }

  // 2. تأكيد وصول الممرض إلى الموقع الجغرافي
  function handleNurseArrived() {
    const now = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    })
    updateStatus('nurse_arrived', {
      arrivalConfirmed: true,
      arrivedAt: `اليوم ${now}`,
      nurseNotes: 'تم تأكيد وصول الممرض إلى موقع المريض وبدء التجهيز للرعاية.',
    })
  }

  // 3. بدء الجلسة
  function handleStartCare() {
    updateStatus('in_progress', {
      nurseNotes: 'بدأ الممرض في تقديم الرعاية التمريضية المطلوبة للمريض.',
    })
  }

  // 4. إنهاء الجلسة من جانب الممرض وطلب رمز التحقق
  function handleNurseComplete() {
    const now = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    })
    updateStatus('completed_by_nurse', {
      completedAt: `اليوم ${now}`,
      nurseNotes: nurseNotesInput || 'تم إتمام الرعاية التمريضية المطلوبة بنجاح وفحص المؤشرات الحيوية.',
      vitalSigns: {
        bloodPressure: nurseBp,
        pulse: `${nursePulse} نبضة/د`,
        temperature: `${nurseTemp} °م`,
      },
    })
  }

  // 5. تأكيد الإتمام برمز التحقق OTP وخصم عمولة الـ 10 ج.م
  function handleConfirmCompletion(isCodeVerification = false) {
    if (isCodeVerification && enteredCode.trim() !== session.completionCode) {
      setCodeError('رمز التحقق غير صحيح، يرجى كتابة الرمز المكون من 4 أرقام بدقة.')
      return
    }

    setCodeError('')
    const now = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    })

    updateStatus('confirmed_completed', {
      confirmedAt: `اليوم ${now}`,
      commissionDeducted: true, // خصم عمولة المنصة (10 جنيه)
    })
  }

  const steps = [
    { key: 'confirmed', label: 'الموعد مؤكد' },
    { key: 'nurse_en_route', label: 'في الطريق' },
    { key: 'nurse_arrived', label: 'تأكيد الوصول' },
    { key: 'in_progress', label: 'الرعاية جارية' },
    { key: 'completed_by_nurse', label: 'إنهاء الجلسة' },
    { key: 'confirmed_completed', label: 'تأكيد الإتمام والخصم' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === session.status)
  const isCompletedOrConfirmed =
    session.status === 'completed_by_nurse' || session.status === 'confirmed_completed'

  return (
    <div className="space-y-6">
      {/* Role Switcher for preview & testing */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/40 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="size-4 text-primary" />
          <span>معاينة الواجهة بدور:</span>
        </div>
        <div className="flex rounded-xl bg-background p-1 ring-1 ring-border">
          <button
            type="button"
            onClick={() => setActiveRole('patient')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
              activeRole === 'patient'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            المريض / الأسرة
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('nurse')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
              activeRole === 'nurse'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            الممرض
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('admin')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
              activeRole === 'admin'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            إدارة المنصة
          </button>
        </div>
      </div>

      {/* Main Status Header Card */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4',
            session.status === 'confirmed_completed'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : session.status === 'completed_by_nurse'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-muted/40 border-border/60',
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                جلسة رقم: #{session.id}
              </span>
              <Badge variant="outline" className={cn('text-xs font-medium', statusInfo.color)}>
                {statusInfo.label}
              </Badge>
            </div>
            <h2 className="text-xl font-bold">{session.service}</h2>
          </div>

          {/* Platform commission info */}
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-background px-4 py-2 text-right shadow-xs">
            <Coins className="size-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">عمولة التطبيق للشركة</p>
              <p className="font-bold text-primary">
                {PLATFORM_COMMISSION_PER_SESSION} جنيه مصري
                {session.status === 'confirmed_completed' ? (
                  <span className="mr-1 text-[11px] font-normal text-emerald-600">
                    (تم خصمها من رصيد الممرض)
                  </span>
                ) : (
                  <span className="mr-1 text-[11px] font-normal text-muted-foreground">
                    (تُخصم تلقائياً عند التأكيد)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-6">
          {/* Progress Tracker */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">مسار التحقق وتنفيذ الجلسة:</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {steps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx
                const isCurrent = currentStepIndex === idx
                return (
                  <div
                    key={step.key}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl border p-2 text-xs transition-all',
                      isCurrent && 'border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary/30',
                      isPassed && !isCurrent && 'border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300',
                      !isPassed && 'border-border/60 bg-muted/20 text-muted-foreground opacity-60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                        isPassed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </span>
                    <span className="truncate text-[11px]">{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Success Banner upon confirmation */}
          {confirmationBanner && session.status === 'confirmed_completed' && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
                <div className="space-y-1 text-sm">
                  <p className="font-bold">
                    تم تأكيد إتمام الجلسة التمريضية بنجاح عبر رمز التحقق!
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                    تم تسجيل الجلسة رسمياً في النظام وخصم عمولة التطبيق (
                    <span className="font-bold underline">10 جنيه مصري</span>) من رصيد محفظة الممرض ({session.nurseName}). وقت التأكيد:{' '}
                    {session.confirmedAt || 'الآن'}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Session Info */}
            <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/10 p-4 text-sm">
              <h3 className="flex items-center gap-1.5 font-bold">
                <Stethoscope className="size-4 text-primary" /> تفاصيل الجلسة والموعد
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">الممرض المكلّف:</span>
                  <span className="font-semibold">{session.nurseName}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">المريض:</span>
                  <span className="font-semibold">{session.patientName}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">رقم هاتف المريض:</span>
                  <a
                    href={`tel:${session.patientPhone}`}
                    className="flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <Phone className="size-3" />
                    {session.patientPhone}
                  </a>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">موعد الزيارة:</span>
                  <span className="font-semibold">
                    {session.date} — {session.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">حالة تأكيد الوصول:</span>
                  {session.arrivalConfirmed ? (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[11px]">
                      ✓ وصل الممرض ({session.arrivedAt || 'مؤكد'})
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground font-medium">بانتظار الوصول وتأكيد الموقع</span>
                  )}
                </div>
              </div>
            </div>

            {/* Location & GPS Info */}
            <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/10 p-4 text-sm">
              <h3 className="flex items-center gap-1.5 font-bold">
                <MapPin className="size-4 text-primary" /> الموقع الجغرافي للزيارة
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground">المحافظة والمنطقة:</span>
                  <span className="font-semibold">
                    {session.governorate} — {session.area}
                  </span>
                </div>
                <div className="border-b border-border/40 pb-1.5">
                  <span className="block text-muted-foreground">العنوان التفصيلي:</span>
                  <span className="mt-0.5 block font-medium">{session.address}</span>
                </div>
                {session.coordinates && (
                  <div className="flex items-center justify-between rounded-lg bg-background p-2 ring-1 ring-border/60">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Navigation className="size-3 text-primary" /> إحداثيات GPS:
                    </span>
                    <span className="font-mono text-primary font-semibold">
                      {session.coordinates.lat}°, {session.coordinates.lng}°
                    </span>
                  </div>
                )}
                <div className="pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${
                      session.coordinates
                        ? `${session.coordinates.lat},${session.coordinates.lng}`
                        : encodeURIComponent(`${session.address}, ${session.area}, ${session.governorate}`)
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                  >
                    <Navigation className="size-3.5" />
                    فتح خط السير في خرائط جوجل (Google Maps)
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Notes & Vital Signs */}
          {(session.nurseNotes || isCompletedOrConfirmed) && (
            <div className="space-y-3 rounded-2xl border border-border/80 bg-background p-4 text-sm">
              <h3 className="flex items-center gap-1.5 font-bold">
                <FileText className="size-4 text-primary" /> تقرير الرعاية التمريضية المنفذة
              </h3>
              {session.nurseNotes ? (
                <p className="rounded-xl bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  {session.nurseNotes}
                </p>
              ) : null}

              {session.vitalSigns && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  {session.vitalSigns.bloodPressure && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
                      <span className="block text-[11px] text-muted-foreground">ضغط الدم</span>
                      <span className="font-bold">{session.vitalSigns.bloodPressure}</span>
                    </div>
                  )}
                  {session.vitalSigns.pulse && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
                      <span className="block text-[11px] text-muted-foreground">النبض</span>
                      <span className="font-bold">{session.vitalSigns.pulse}</span>
                    </div>
                  )}
                  {session.vitalSigns.temperature && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
                      <span className="block text-[11px] text-muted-foreground">الحرارة</span>
                      <span className="font-bold">{session.vitalSigns.temperature}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Interactive Role-Based Actions */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            {/* 1. NURSE ACTIONS */}
            {activeRole === 'nurse' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">إجراءات الممرض</Badge>
                    <span className="text-xs text-muted-foreground">
                      تأكيد الوصول وطلب رمز التحقق لإنهاء الجلسة رسمياً
                    </span>
                  </div>
                </div>

                {session.status === 'confirmed' && (
                  <Button
                    onClick={handleNurseStartTrip}
                    className="w-full gap-2 font-bold"
                    size="lg"
                  >
                    <Navigation className="size-4" /> أنا في الطريق إلى موقع المريض الآن
                  </Button>
                )}

                {session.status === 'nurse_en_route' && (
                  <Button
                    onClick={handleNurseArrived}
                    className="w-full gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                    size="lg"
                  >
                    <MapPin className="size-4" /> تأكيد وصولي إلى موقع المريض
                  </Button>
                )}

                {session.status === 'nurse_arrived' && (
                  <Button
                    onClick={handleStartCare}
                    className="w-full gap-2 font-bold bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
                  >
                    <Stethoscope className="size-4" /> بدء تقديم الرعاية التمريضية
                  </Button>
                )}

                {session.status === 'in_progress' && (
                  <div className="space-y-3 rounded-xl border border-border/80 bg-background p-4">
                    <h4 className="font-semibold text-sm">تسجيل إنهاء الجلسة والعلامات الحيوية:</h4>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">ضغط الدم</Label>
                        <Input
                          value={nurseBp}
                          onChange={(e) => setNurseBp(e.target.value)}
                          placeholder="120/80"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">النبض</Label>
                        <Input
                          value={nursePulse}
                          onChange={(e) => setNursePulse(e.target.value)}
                          placeholder="75"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الحرارة</Label>
                        <Input
                          value={nurseTemp}
                          onChange={(e) => setNurseTemp(e.target.value)}
                          placeholder="37.0"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">تقرير الخدمة المنفذة للمريض</Label>
                      <Textarea
                        value={nurseNotesInput}
                        onChange={(e) => setNurseNotesInput(e.target.value)}
                        placeholder="اكتب ما تم تنفيذه خلال الجلسة (غيار الجرح، تعقيم، حقن، إلخ)..."
                        rows={2}
                        className="text-xs"
                      />
                    </div>

                    <Button
                      onClick={handleNurseComplete}
                      className="w-full gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="lg"
                    >
                      <CheckCircle2 className="size-4" /> إنهاء الجلسة التمريضية
                    </Button>
                  </div>
                )}

                {session.status === 'completed_by_nurse' && (
                  <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-bold text-sm">
                      تم تسجيل إنهاء الجلسة من جانبك!
                    </p>
                    <p className="leading-relaxed">
                      يرجى الحصول على <strong>رمز التحقق الرقمي المكون من 4 أرقام</strong> من المريض لإدخاله هنا وتأكيد الجلسة رسمياً، أو اطلب من المريض تأكيدها من حسابه:
                    </p>

                    <div className="flex gap-2 pt-1">
                      <Input
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value)}
                        placeholder="أدخل رمز التحقق (4 أرقام)"
                        maxLength={4}
                        className="h-9 font-mono text-center tracking-widest bg-background text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleConfirmCompletion(true)}
                        className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        تحقق وتأكيد الجلسة
                      </Button>
                    </div>

                    {codeError && (
                      <p className="text-destructive font-semibold">{codeError}</p>
                    )}

                    <p className="text-[11px] text-muted-foreground pt-1">
                      * فور التأكيد، سيتم خصم 10 جنيه عمولة التطبيق تلقائياً من رصيدك المبدئي.
                    </p>
                  </div>
                )}

                {session.status === 'confirmed_completed' && (
                  <div className="space-y-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-900 dark:text-emerald-200">
                    <p className="flex items-center gap-1.5 font-bold">
                      <BadgeCheck className="size-4 text-emerald-600" />
                      تم تأكيد الجلسة رسمياً برمز التحقق OTP!
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      • تم استلام أتعاب الجلسة <strong>كاش مباشرة باليد من المريض</strong>.
                      <br />
                      • خُصمت عمولة التطبيق (10 جنيه مصري) تلقائياً من رصيدك المبدئي.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. PATIENT ACTIONS */}
            {activeRole === 'patient' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-primary-foreground">إجراءات المريض</Badge>
                  {session.status !== 'confirmed_completed' && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background px-3 py-1 rounded-lg border">
                      <KeyRound className="size-3.5 text-primary" />
                      رمز التحقق الخاص بك:{' '}
                      <span className="font-mono font-bold text-primary text-sm tracking-wider">
                        {session.completionCode}
                      </span>
                    </div>
                  )}
                </div>

                {session.status === 'completed_by_nurse' ? (
                  <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-background p-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        سجّل الممرض إنهاء الجلسة التمريضية بنجاح
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        زوّد الممرض برمز التحقق ({session.completionCode}) أو اضغط زر التأكيد أدناه لتوثيق تلقيك الخدمة بنجاح وضمان حقوق الطرفين.
                      </p>
                    </div>

                    <Button
                      onClick={() => handleConfirmCompletion(false)}
                      className="w-full gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="lg"
                    >
                      <CheckCircle2 className="size-5" /> أؤكد إتمام الجلسة واستلام الرعاية بنجاح
                    </Button>
                  </div>
                ) : session.status === 'confirmed_completed' ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    شكراً لك! لقد تم توثيق إتمام الجلسة برمز التحقق رسمياً.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-background/80 p-3 text-xs text-muted-foreground">
                    <Clock className="size-4 text-primary" />
                    احتفظ برمز التحقق ({session.completionCode}) لتقديمه للممرض عند إنهاء الجلسة لضمان أمان وتوثيق الرعاية.
                  </div>
                )}
              </div>
            )}

            {/* 3. ADMIN ACTIONS */}
            {activeRole === 'admin' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">لوحة رقابة إدارة منصة رحمة</Badge>
                  <span className="text-xs font-mono">
                    رمز التحقق السري: {session.completionCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  يمكن لمسؤولي المنصة حل النزاعات وتأكيد إتمام الجلسة رسمياً وخصم الـ 10 جنيه عمولة التطبيق من رصيد الممرض.
                </p>
                <div className="flex flex-wrap gap-2">
                  {session.status !== 'confirmed_completed' && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmCompletion(false)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />
                      تأكيد إداري رسمي وخصم الـ 10 ج.م
                    </Button>
                  )}
                  {!session.arrivalConfirmed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNurseArrived}
                    >
                      تأكيد وصول يدوي
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
