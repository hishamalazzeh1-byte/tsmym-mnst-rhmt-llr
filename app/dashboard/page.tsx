'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Gift,
  KeyRound,
  MapPin,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { LocationPicker } from '@/components/location-picker'
import { PageShell } from '@/components/page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { APP_CONFIG } from '@/lib/config'
import {
  DEMO_BOOKINGS,
  DEMO_NURSE_WALLET,
  DEMO_RECORDS,
  GOVERNORATES,
  NURSES,
  SESSION_STATUS_MAP,
} from '@/lib/data'
import {
  NURSE_INITIAL_WELCOME_CREDIT,
  PLATFORM_COMMISSION_PER_SESSION,
  type Nurse,
  type SessionBooking,
} from '@/lib/types'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const [role, setRole] = useState<'nurse' | 'patient' | 'admin'>('nurse')
  const [sessions, setSessions] = useState<SessionBooking[]>(DEMO_BOOKINGS)
  const [wallet, setWallet] = useState(DEMO_NURSE_WALLET)
  const [allNurses, setAllNurses] = useState<Nurse[]>(NURSES)
  const [nurseLocationActive, setNurseLocationActive] = useState(true)
  const [selectedGov, setSelectedGov] = useState('القاهرة')
  const [sessionOtpInputs, setSessionOtpInputs] = useState<Record<string, string>>({})
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({})

  // تحديث مدخل رمز التحقق لجلسة محددة
  function handleOtpInputChange(sessionId: string, val: string) {
    setSessionOtpInputs((prev) => ({ ...prev, [sessionId]: val }))
    if (otpErrors[sessionId]) {
      setOtpErrors((prev) => {
        const next = { ...prev }
        delete next[sessionId]
        return next
      })
    }
  }

  // تأكيد إتمام الجلسة برمز التحقق (OTP) وخصم 10 جنيه تلقائياً في الخلفية من رصيد الممرض
  function confirmSessionWithOtp(sessionId: string, requiredCode?: string) {
    const inputCode = sessionOtpInputs[sessionId]?.trim()
    const targetSession = sessions.find((s) => s.id === sessionId)
    const expectedCode = requiredCode || targetSession?.completionCode

    if (expectedCode && inputCode && inputCode !== expectedCode) {
      setOtpErrors((prev) => ({
        ...prev,
        [sessionId]: 'رمز التحقق غير صحيح، يرجى كتابة الرمز المكون من 4 أرقام بدقة.',
      }))
      return
    }

    confirmSession(sessionId)
  }

  // اعتماد الجلسة وخصم عمولة الـ 10 ج.م تلقائياً
  function confirmSession(sessionId: string) {
    let sessionService = ''
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        sessionService = s.service
        return {
          ...s,
          status: 'confirmed_completed' as const,
          arrivalConfirmed: true,
          commissionDeducted: true,
          confirmedAt:
            'اليوم ' +
            new Date().toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            }),
        }
      }
      return s
    })

    setSessions(updated)

    // خصم 10 جنيه عمولة التطبيق من رصيد الممرض تلقائياً وتحديث المحفظة في الخلفية
    setWallet((prev) => {
      const nextBalance = Math.max(0, prev.currentBalance - PLATFORM_COMMISSION_PER_SESSION)
      const nextCompleted = prev.completedSessionsCount + 1
      return {
        ...prev,
        currentBalance: nextBalance,
        completedSessionsCount: nextCompleted,
        totalCommissionDeducted: prev.totalCommissionDeducted + PLATFORM_COMMISSION_PER_SESSION,
        remainingSessionsQuota: Math.floor(nextBalance / PLATFORM_COMMISSION_PER_SESSION),
        needsRecharge: nextBalance < PLATFORM_COMMISSION_PER_SESSION,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            date: 'الآن',
            type: 'session_commission_deduction',
            amount: -PLATFORM_COMMISSION_PER_SESSION,
            description: `خصم عمولة تطبيق رحمة عن الجلسة المكتملة والمؤكدة #${sessionId} (${sessionService})`,
            sessionId,
            balanceAfter: nextBalance,
          },
          ...prev.transactions,
        ],
      }
    })
  }

  // شحن رصيد ممرض إدارياً من لوحة التحكم (داخلياً بدون بوابات دفع خارجية)
  function handleAdminCreditNurse(nurseId: string, amount: number = 100) {
    setAllNurses((prev) =>
      prev.map((n) => {
        if (n.id === nurseId) {
          const current = n.walletBalance ?? 100
          return { ...n, walletBalance: current + amount }
        }
        return n
      }),
    )
  }

  // إحصائيات الإدارة
  const totalCompletedSessionsCount = sessions.filter(
    (s) => s.status === 'confirmed_completed',
  ).length
  const totalCompanyCommissionsCollected =
    totalCompletedSessionsCount * PLATFORM_COMMISSION_PER_SESSION

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Top Header & Role Switcher */}
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-border/80 bg-muted/20 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                رحمة
              </span>
              <div>
                <h1 className="text-2xl font-bold">لوحة التحكم وإدارة الجلسات</h1>
                <p className="text-xs text-muted-foreground">
                  متابعة طلبات التمريض المنزلي، رصيد المحفظة، وتأكيد الإتمام برمز التحقق (OTP)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-background p-1.5 ring-1 ring-border shadow-xs">
            <span className="text-xs font-medium text-muted-foreground px-2">عرض كـ:</span>
            <button
              type="button"
              onClick={() => setRole('nurse')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                role === 'nurse'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Stethoscope className="size-3.5" /> حساب الممرض (رصيد ترحيبي 100 ج.م)
            </button>
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                role === 'patient'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <User className="size-3.5" /> حساب المريض / الأسرة
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                role === 'admin'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Building className="size-3.5" /> إدارة ومتابعة الجلسات
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* NURSE VIEW */}
        {/* ======================================================== */}
        {role === 'nurse' && (
          <div className="space-y-8">
            {/* Welcome Credit Banner */}
            <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Gift className="size-4" />
                    </span>
                    <h2 className="text-lg font-bold text-primary">
                      رصيد ترحيبي مبدئي مجاني: {NURSE_INITIAL_WELCOME_CREDIT} جنيه مصري
                    </h2>
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/80 max-w-3xl">
                    تهانينا! تم إيداع <strong className="text-primary font-bold">100 جنيه رصيداً مبدئياً</strong> في محفظتك تلقائياً، وهو ما يكفي لتنفيذ{' '}
                    <strong className="text-primary font-bold">أول 10 جلسات تمريضية</strong> كاملة دون الحاجة لأي دفع مسبق.
                    يتم استلام قيمة الجلسة <strong className="text-foreground">كاش مباشرة باليد من المريض</strong>، وتُخصم عمولة التطبيق (10 جنيه) تلقائياً في الخلفية من رصيدك عند إدخال رمز التحقق (OTP).
                  </p>
                </div>

                <Badge variant="outline" className="border-primary/40 bg-background text-primary font-bold px-3 py-1.5 shrink-0 self-start sm:self-auto">
                  حساب نشط ومفعل
                </Badge>
              </div>
            </div>

            {/* Nurse Wallet Statistics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Wallet className="size-5 text-primary" /> حالة الرصيد والمحفظة
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    تتبع رصيدك المتبقي وحساب العمولات التلقائية المخصومة
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                  عمولة المنصة: {PLATFORM_COMMISSION_PER_SESSION} ج.م / جلسة مؤكدة
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Current balance */}
                <Card className="border-primary/20 bg-primary/5 shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        رصيد المحفظة الحالي
                      </span>
                      <Coins className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      {wallet.currentBalance} <span className="text-xs font-normal">جنيه مصري</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      من أصل {wallet.initialWelcomeCredit} ج.م رصيد مبدئي
                    </p>
                  </CardContent>
                </Card>

                {/* 2. Remaining sessions quota */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        الجلسات المتبقية في الرصيد
                      </span>
                      <Zap className="size-4 text-emerald-600" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {wallet.remainingSessionsQuota}{' '}
                      <span className="text-xs font-normal text-muted-foreground">جلسات متاحة</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      الرصيد كافٍ ونشط لاستقبال الحالات
                    </p>
                  </CardContent>
                </Card>

                {/* 3. Completed confirmed sessions */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        الجلسات المنفذة والمؤكدة
                      </span>
                      <CheckCircle2 className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {wallet.completedSessionsCount}{' '}
                      <span className="text-xs font-normal text-muted-foreground">جلسة</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      موثقة رسمياً برمز التحقق (OTP)
                    </p>
                  </CardContent>
                </Card>

                {/* 4. Total deducted commissions */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        إجمالي عمولات المنصة المخصومة
                      </span>
                      <Clock className="size-4 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {wallet.totalCommissionDeducted}{' '}
                      <span className="text-xs font-normal text-muted-foreground">ج.م</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      بمعدل 10 ج.م عن كل جلسة مكتملة
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Nurse Location & Coverage */}
            <div className="rounded-3xl border border-border/80 bg-muted/20 p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold flex items-center gap-2">
                    <MapPin className="size-4 text-primary" /> خيارات الموقع الميداني ونطاق التغطية
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    تفعيل موقعك عبر GPS يتيح للنظام إسناد وتوجيه طلبات المرضى في نطاقك الجغرافي مباشرة
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-2 ring-1 ring-border">
                  <Label htmlFor="nurse-loc" className="text-xs font-semibold cursor-pointer">
                    تفعيل التتبع الميداني الحي (GPS)
                  </Label>
                  <Switch
                    id="nurse-loc"
                    checked={nurseLocationActive}
                    onCheckedChange={setNurseLocationActive}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">محافظة التواجد الرئيسية</Label>
                  <Select value={selectedGov} onValueChange={setSelectedGov}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOVERNORATES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">نطاق التغطية والأحياء المخدومة</Label>
                  <Input
                    placeholder="مثال: مدينة نصر، مصر الجديدة، التجمع الخامس"
                    defaultValue="مدينة نصر، مصر الجديدة، التجمع"
                    className="bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Nurse Assigned Sessions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">
                    الجلسات المكلف بها ({sessions.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    توجه لموقع المريض عبر خرائط جوجل، واطلب رمز التحقق (4 أرقام) عند الانتهاء لتأكيد الجلسة
                  </p>
                </div>
                <Link
                  href="/sessions"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  عرض شاشة تتبع الجلسات بالكامل ←
                </Link>
              </div>

              <div className="space-y-4">
                {sessions.map((s) => {
                  const status = SESSION_STATUS_MAP[s.status] || SESSION_STATUS_MAP.pending
                  const isDone = s.status === 'confirmed_completed'
                  const isNurseFinished = s.status === 'completed_by_nurse'
                  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${
                    s.coordinates
                      ? `${s.coordinates.lat},${s.coordinates.lng}`
                      : encodeURIComponent(`${s.address}, ${s.area}, ${s.governorate}`)
                  }`

                  return (
                    <Card key={s.id} className="overflow-hidden shadow-2xs">
                      <CardContent className="p-5 flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-muted-foreground">#{s.id}</span>
                              <Badge variant="outline" className={cn('text-xs font-medium', status.color)}>
                                {status.label}
                              </Badge>
                              {s.arrivalConfirmed && (
                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  ✓ تم تأكيد الوصول للموقع
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-base">{s.service}</h4>
                          </div>

                          {/* Quick Google Maps navigation button */}
                          <div className="flex items-center gap-2">
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                            >
                              <Navigation className="size-3.5" />
                              فتح في خرائط جوجل
                            </a>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/sessions/${s.id}`}>
                                تفاصيل وتتبع
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {/* Patient and Location Info */}
                        <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                          <div className="space-y-1">
                            <div>
                              المريض: <strong className="text-foreground">{s.patientName}</strong>
                            </div>
                            <div className="flex items-center gap-1">
                              الهاتف:
                              <a
                                href={`tel:${s.patientPhone}`}
                                className="font-semibold text-primary hover:underline"
                              >
                                {s.patientPhone}
                              </a>
                            </div>
                            <div>
                              الموعد: <strong className="text-foreground">{s.date} — {s.time}</strong>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div>
                              الموقع: <strong className="text-foreground">{s.area}، {s.governorate}</strong>
                            </div>
                            <div>
                              العنوان التفصيلي: <span className="text-foreground">{s.address}</span>
                            </div>
                            <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                              طريقة الدفع: كاش مباشرة باليد من المريض
                            </div>
                          </div>
                        </div>

                        {/* Inline OTP verification when completed by nurse */}
                        {isNurseFinished && (
                          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5">
                                <KeyRound className="size-4 text-amber-700" />
                                إدخال رمز التحقق الرقمي (4-Digit OTP) من المريض:
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                كود الاختبار: {s.completionCode}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              أدخل الرمز المكون من 4 أرقام الذي يظهر في شاشة المريض لتأكيد إتمام الزيارة وخصم الـ 10 ج.م عمولة المنصة تلقائياً في الخلفية:
                            </p>
                            <div className="flex gap-2">
                              <Input
                                value={sessionOtpInputs[s.id] || ''}
                                onChange={(e) => handleOtpInputChange(s.id, e.target.value)}
                                placeholder="رمز التحقق (مثال: 5182)"
                                maxLength={4}
                                className="h-9 w-44 font-mono text-center tracking-widest bg-background text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => confirmSessionWithOtp(s.id, s.completionCode)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                              >
                                <CheckCircle2 className="size-3.5" /> تأكيد الجلسة وخصم 10 ج.م
                              </Button>
                            </div>
                            {otpErrors[s.id] && (
                              <p className="text-destructive font-semibold text-[11px]">
                                {otpErrors[s.id]}
                              </p>
                            )}
                          </div>
                        )}

                        {isDone && (
                          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <BadgeCheck className="size-4" /> تم تأكيد إتمام الجلسة رسمياً برمز التحقق
                            </span>
                            <span className="font-normal text-[11px] text-muted-foreground">
                              خُصمت الـ 10 ج.م عمولة المنصة تلقائياً في الخلفية من الرصيد المبدئي
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Wallet Transactions Log */}
            <div className="space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="size-4 text-primary" /> سجل المعاملات المالية والخصومات
              </h3>
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-background text-xs">
                {wallet.transactions.map((tx, idx) => (
                  <div
                    key={tx.id || idx}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 p-3.5 last:border-0 hover:bg-muted/20"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{tx.description}</p>
                      <span className="text-[11px] text-muted-foreground">{tx.date}</span>
                    </div>

                    <div className="text-left">
                      <span
                        className={cn(
                          'font-bold text-sm',
                          tx.amount > 0 ? 'text-emerald-600' : 'text-primary',
                        )}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ج.م
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        الرصيد بعدها: {tx.balanceAfter} ج.م
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PATIENT VIEW */}
        {/* ======================================================== */}
        {role === 'patient' && (
          <div className="space-y-8">
            {/* Quick Actions & Geo location */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Stethoscope className="size-5 text-primary" /> احجز رعاية تمريضية منزلية
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    اختر ممرضاً معتمداً قرب موقعك الجغرافي في أي محافظة داخل جمهورية مصر العربية، مع توثيق كامل للزيارة برمز التحقق، والدفع كاش باليد عند تقديم الخدمة.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm">
                      <Link href="/nurses">
                        <Search className="size-4" /> تصفح الممرضين
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/triage">الفحص الطبي الذكي</Link>
                    </Button>
                  </div>
                </div>

                {/* Patient Records */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="size-4 text-primary" /> السجلات والتقارير الطبية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {DEMO_RECORDS.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{r.title}</p>
                          <span className="text-[11px] text-muted-foreground">{r.date}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {r.type} مشفّر
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Patient Geolocation Picker */}
              <div className="space-y-3">
                <LocationPicker
                  label="عنوان منزلك وموقع الزيارة التمريضية الافتراضي (GPS)"
                  initialGovernorate="القاهرة"
                  initialArea="مدينة نصر"
                  initialAddress="شارع عباس العقاد"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  يتم حفظ إحداثيات موقعك لتسهيل وصول الممرض في الزيارات المنزلية وحالات الطوارئ بدقة متناهية.
                </p>
              </div>
            </div>

            {/* Patient Bookings & Session Confirmations */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">حجوزاتك وجلساتك الحالية</h3>
              <div className="space-y-3">
                {sessions.map((s) => {
                  const status = SESSION_STATUS_MAP[s.status] || SESSION_STATUS_MAP.pending
                  const isNurseFinished = s.status === 'completed_by_nurse'
                  const isDone = s.status === 'confirmed_completed'

                  return (
                    <Card key={s.id} className="overflow-hidden shadow-2xs">
                      <CardContent className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">#{s.id}</span>
                            <Badge variant="outline" className={cn('text-xs font-medium', status.color)}>
                              {status.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded font-mono font-bold text-primary">
                              رمز التحقق الخاص بك: {s.completionCode}
                            </span>
                          </div>
                          <h4 className="font-bold">{s.service}</h4>
                          <p className="text-xs text-muted-foreground">
                            الممرض: <strong>{s.nurseName}</strong> — الموعد: {s.date} ({s.time})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            العنوان: {s.address} ({s.area}، {s.governorate})
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/sessions/${s.id}`}>
                              تتبع الجلسة
                            </Link>
                          </Button>

                          {isNurseFinished && (
                            <Button
                              size="sm"
                              onClick={() => confirmSession(s.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                              <CheckCircle2 className="size-4 mr-1" />
                              أؤكد إتمام الجلسة برمز التحقق
                            </Button>
                          )}

                          {isDone && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="size-4" /> تم التأكيد رسمياً
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ADMIN VIEW */}
        {/* ======================================================== */}
        {role === 'admin' && (
          <div className="space-y-8">
            {/* Admin Overview Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Building className="size-5 text-primary" /> لوحة الإدارة ومراقبة الجلسات
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    متابعة حركة الجلسات التمريضية بجمهورية مصر العربية، والعمولات المحصلة، وأرصدة الممرضين
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary font-bold">
                  عمولة المنصة الثابتة: 10 ج.م / جلسة
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Company Commissions */}
                <Card className="border-primary/20 bg-primary/5 shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        إجمالي عمولات الشركة المحصلة
                      </span>
                      <Coins className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      {totalCompanyCommissionsCollected}{' '}
                      <span className="text-xs font-normal">جنيه مصري</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      عن {totalCompletedSessionsCount} جلسات منتهية ومؤكدة
                    </p>
                  </CardContent>
                </Card>

                {/* 2. Registered Nurses */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        الممرضون المسجلون بالمحافظات
                      </span>
                      <Users className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {allNurses.length}{' '}
                      <span className="text-xs font-normal text-muted-foreground">ممرض معتمد</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      برصيد ترحيبي 100 ج.م لكل ممرض
                    </p>
                  </CardContent>
                </Card>

                {/* 3. Total Sessions */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        إجمالي الجلسات المسجلة
                      </span>
                      <Clock className="size-4 text-emerald-600" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {sessions.length}{' '}
                      <span className="text-xs font-normal text-muted-foreground">جلسات</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      متابعة حية عبر نظام التتبع الميداني
                    </p>
                  </CardContent>
                </Card>

                {/* 4. Active Governorates */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        نطاق التغطية الجغرافية
                      </span>
                      <MapPin className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      27 <span className="text-xs font-normal text-muted-foreground">محافظة</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      تغطية شاملة لكافة محافظات مصر
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Nurses Balances & Management Table */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Users className="size-4 text-primary" /> جدول متابعة أرصدة الممرضين والعمولات
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    كل ممرض جديد يستلم 100 ج.م رصيداً ترحيبياً، ويتم استقطاع 10 ج.م تلقائياً في الخلفية عن كل جلسة مؤكدة
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-border/80 bg-background">
                <table className="w-full text-right text-xs">
                  <thead className="bg-muted/40 border-b text-muted-foreground">
                    <tr>
                      <th className="p-3 font-semibold">الممرض</th>
                      <th className="p-3 font-semibold">المحافظة / النطاق</th>
                      <th className="p-3 font-semibold text-center">الرصيد المبدئي</th>
                      <th className="p-3 font-semibold text-center">الجلسات المؤكدة</th>
                      <th className="p-3 font-semibold text-center">عمولة الشركة المخصومة</th>
                      <th className="p-3 font-semibold text-center">الرصيد الحالي</th>
                      <th className="p-3 font-semibold text-center">حالة الحساب</th>
                      <th className="p-3 font-semibold text-center">إجراء إداري داخلي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {allNurses.map((nurse) => {
                      const balance = nurse.walletBalance ?? 100
                      const completed = nurse.completedSessionsCount ?? 0
                      const totalCommission = completed * PLATFORM_COMMISSION_PER_SESSION
                      const isLowBalance = balance < PLATFORM_COMMISSION_PER_SESSION

                      return (
                        <tr key={nurse.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-foreground">{nurse.name}</div>
                            <div className="text-[11px] text-muted-foreground">{nurse.title}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-medium">{nurse.governorate}</span>
                            <span className="block text-[11px] text-muted-foreground">{nurse.area}</span>
                          </td>
                          <td className="p-3 text-center font-mono">
                            {NURSE_INITIAL_WELCOME_CREDIT} ج.م
                          </td>
                          <td className="p-3 text-center font-bold">
                            {completed}
                          </td>
                          <td className="p-3 text-center font-mono text-primary font-bold">
                            {totalCommission} ج.م
                          </td>
                          <td className="p-3 text-center">
                            <span className={cn('font-mono font-bold text-sm', balance < 30 ? 'text-amber-600' : 'text-emerald-600')}>
                              {balance} ج.م
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {isLowBalance ? (
                              <Badge variant="destructive" className="text-[10px]">
                                رصيد منتهٍ
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[10px]">
                                نشط ومتاح
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdminCreditNurse(nurse.id, 100)}
                              className="h-7 text-[11px] font-semibold gap-1"
                            >
                              <Plus className="size-3" /> شحن إداري (+100 ج.م)
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Sessions Master Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Clock className="size-4 text-primary" /> رقابة حركة الجلسات التمريضية بجمهورية مصر العربية
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    متابعة حية للزيارات وحالات الوصول ورموز التحقق الرقمية
                  </p>
                </div>
                <Link
                  href="/sessions"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  فتح شاشة التتبع العامة ←
                </Link>
              </div>

              <div className="space-y-3">
                {sessions.map((s) => {
                  const status = SESSION_STATUS_MAP[s.status] || SESSION_STATUS_MAP.pending
                  const isDone = s.status === 'confirmed_completed'

                  return (
                    <Card key={s.id} className="overflow-hidden shadow-2xs">
                      <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-muted-foreground">#{s.id}</span>
                            <Badge variant="outline" className={cn('text-xs font-medium', status.color)}>
                              {status.label}
                            </Badge>
                            <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-foreground font-semibold">
                              OTP: {s.completionCode}
                            </span>
                            {s.arrivalConfirmed && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                                تم الوصول
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm">{s.service}</h4>
                          <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                            <span>الممرض: <strong>{s.nurseName}</strong></span>
                            <span>المريض: <strong>{s.patientName} ({s.patientPhone})</strong></span>
                            <span>الموقع: {s.area}، {s.governorate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/sessions/${s.id}`}>
                              متابعة وتفاصيل
                            </Link>
                          </Button>
                          {!isDone && (
                            <Button
                              size="sm"
                              onClick={() => confirmSession(s.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                            >
                              <CheckCircle2 className="size-3.5 mr-1" />
                              تأكيد إداري وخصم 10 ج.م
                            </Button>
                          )}
                          {isDone && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <BadgeCheck className="size-4" /> تم خصم الـ 10 ج.م
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
