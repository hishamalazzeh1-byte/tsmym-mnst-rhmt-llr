'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  LogOut,
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
import { GOVERNORATES, SESSION_STATUS_MAP } from '@/lib/data'
import {
  PLATFORM_COMMISSION_PER_SESSION,
  type MedicalRecord,
  type Nurse,
  type NurseWallet,
  type SessionBooking,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  getUserSession,
  logoutUserSession,
  apiFetchProfile,
  type UserSession,
} from '@/lib/auth-session'
import {
  fetchNurse,
  fetchSessions,
  patchSession,
  fetchWallet,
  fetchRecords,
  fetchAdminNurses,
  creditNurseWallet,
  approveNurse,
  updateNurseAvailability,
  updateNurseLocation,
} from '@/lib/app-state'

type Role = 'nurse' | 'patient' | 'admin'

export default function DashboardPage() {
  const router = useRouter()
  const [sessionUser, setSessionUser] = useState<UserSession | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [sessions, setSessions] = useState<SessionBooking[]>([])
  const [wallet, setWallet] = useState<NurseWallet | null>(null)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [allNurses, setAllNurses] = useState<Nurse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [nurseAvailable, setNurseAvailable] = useState(false)
  const [nurseGov, setNurseGov] = useState('')
  const [nurseArea, setNurseArea] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [sessionOtpInputs, setSessionOtpInputs] = useState<Record<string, string>>({})
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({})

  // كل البيانات تُقرأ من الخادم (قاعدة البيانات) — لا توجد أي قيم محلية ثابتة
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const cached = getUserSession()
      if (!cached || !cached.isAuthenticated) {
        router.replace('/auth/login')
        return
      }

      setLoading(true)
      setLoadError('')
      const profile = await apiFetchProfile()
      if (cancelled) return

      if (!profile) {
        logoutUserSession()
        router.replace('/auth/login')
        return
      }

      const activeRole = profile.user.role as Role
      setSessionUser(getUserSession())
      setRole(activeRole)

      if (activeRole === 'nurse') {
        // لا نخفي الأخطاء: نجمع النتائج ونحوّل أي فشل إلى رسالة واضحة بدل قائمة فارغة مُضللة
        const [sessionRes, walletRes, meRes] = await Promise.allSettled([
          fetchSessions(),
          fetchWallet(profile.user.id),
          fetchNurse(profile.user.id),
        ])
        if (cancelled) return
        setSessions(sessionRes.status === 'fulfilled' ? sessionRes.value : [])
        setWallet(walletRes.status === 'fulfilled' ? walletRes.value : null)
        if (meRes.status === 'fulfilled' && meRes.value) {
          setNurseAvailable(Boolean(meRes.value.available))
          setNurseGov(meRes.value.governorate || '')
          setNurseArea(meRes.value.area || '')
        }
        const failures: string[] = []
        if (sessionRes.status === 'rejected') failures.push('جلساتك')
        if (walletRes.status === 'rejected') failures.push('محفظتك')
        if (meRes.status === 'rejected') failures.push('ملفك كممرض')
        if (failures.length) {
          setLoadError(
            `تعذر تحميل ${failures.join(' و')}. تحقّق من الاتصال بالخادم ثم أعد المحاولة.`,
          )
        }
      } else if (activeRole === 'patient') {
        const [sessionRes, recordRes] = await Promise.allSettled([
          fetchSessions(),
          fetchRecords(),
        ])
        if (cancelled) return
        setSessions(sessionRes.status === 'fulfilled' ? sessionRes.value : [])
        setRecords(recordRes.status === 'fulfilled' ? recordRes.value : [])
        const failures: string[] = []
        if (sessionRes.status === 'rejected') failures.push('جلساتك')
        if (recordRes.status === 'rejected') failures.push('سجلاتك الطبية')
        if (failures.length) {
          setLoadError(
            `تعذر تحميل ${failures.join(' و')}. تحقّق من الاتصال بالخادم ثم أعد المحاولة.`,
          )
        }
      } else {
        const [sessionRes, nurseRes] = await Promise.allSettled([
          fetchSessions(),
          fetchAdminNurses(),
        ])
        if (cancelled) return
        setSessions(sessionRes.status === 'fulfilled' ? sessionRes.value : [])
        setAllNurses(nurseRes.status === 'fulfilled' ? nurseRes.value : [])
        const failures: string[] = []
        if (sessionRes.status === 'rejected') failures.push('الكل الجلسة العامة')
        if (nurseRes.status === 'rejected') failures.push('قائمة الممرضين')
        if (failures.length) {
          setLoadError(
            `تعذر تحميل ${failures.join(' و')}. تحقّق من الاتصال بالخادم ثم أعد المحاولة.`,
          )
        }
      }

      setLoading(false)
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [router])

  function handleLogout() {
    logoutUserSession()
    router.push('/auth/login')
  }

  async function handleAvailabilityChange(available: boolean) {
    if (!sessionUser) return
    setActionError('')
    try {
      const updated = await updateNurseAvailability(sessionUser.id, available)
      setNurseAvailable(Boolean(updated.available))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر تحديث حالة التوفر')
    }
  }

  async function handleSaveNurseProfile() {
    if (!sessionUser) return
    setActionError('')
    setProfileSaved(false)
    setSavingProfile(true)
    try {
      const updated = await updateNurseLocation(sessionUser.id, {
        governorate: nurseGov,
        area: nurseArea,
        coverageGovernorates: nurseGov ? [nurseGov] : [],
      })
      setNurseGov(updated.governorate || '')
      setNurseArea(updated.area || '')
      setProfileSaved(true)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر حفظ بيانات الموقع')
    } finally {
      setSavingProfile(false)
    }
  }

  function handleOtpInputChange(sessionId: string, val: string) {
    setSessionOtpInputs((prev) => ({ ...prev, [sessionId]: val.replace(/\D/g, '').slice(0, 4) }))
    if (otpErrors[sessionId]) {
      setOtpErrors((prev) => {
        const next = { ...prev }
        delete next[sessionId]
        return next
      })
    }
  }

  // تأكيد الإتمام بالرمز — الخادم يتحقق منه ويخصم العمولة فعلياً من المحفظة
  async function confirmSessionWithOtp(sessionId: string) {
    if (!sessionUser) return
    const code = (sessionOtpInputs[sessionId] || '').trim()
    if (code.length !== 4) {
      setOtpErrors((prev) => ({
        ...prev,
        [sessionId]: 'أدخل رمز التحقق المكون من 4 أرقام كما ورد من المريض',
      }))
      return
    }
    setActionError('')
    try {
      const updated = await patchSession(sessionId, 'verify_otp', { code })
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setOtpErrors((prev) => {
        const next = { ...prev }
        delete next[sessionId]
        return next
      })
      if (role === 'nurse') {
        const refreshed = await fetchWallet(sessionUser.id).catch(() => null)
        if (refreshed) setWallet(refreshed)
      }
    } catch (err) {
      setOtpErrors((prev) => ({
        ...prev,
        [sessionId]: err instanceof Error ? err.message : 'تعذر تأكيد الجلسة',
      }))
    }
  }

  async function handleAdminCreditNurse(nurseId: string, amount = 100) {
    setActionError('')
    try {
      await creditNurseWallet(nurseId, amount)
      setAllNurses(await fetchAdminNurses())
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر شحن الرصيد')
    }
  }

  async function handleAdminApproveNurse(nurseId: string) {
    setActionError('')
    try {
      await approveNurse(nurseId)
      setAllNurses(await fetchAdminNurses())
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر اعتماد الممرض')
    }
  }

  const totalCompletedSessions = sessions.filter((s) => s.status === 'confirmed_completed').length
  const totalCompanyCommissionsCollected =
    totalCompletedSessions * PLATFORM_COMMISSION_PER_SESSION

  // لا نخترع محفظة بأصفار وهمية: إن لم تصل من الخادم نعرض حالة "غير متاحة" صريحة
  const walletAvailable = wallet !== null

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="space-y-3 text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري تحميل بياناتك من قاعدة البيانات...</p>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Top Header */}
        <div className="mb-8 rounded-3xl border border-border/80 bg-muted/20 p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              رحمة
            </span>
            <div>
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              <p className="text-xs text-muted-foreground">
                {role === 'nurse' && 'إدارة جلساتك ومحفظة رصيدك'}
                {role === 'patient' && 'متابعة حجوزاتك وجلساتك التمريضية'}
                {role === 'admin' && 'رقابة المنصة: الممرضون والعمولات والجلسات'}
              </p>
            </div>
          </div>

          {sessionUser && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5" />
                {sessionUser.name} ({sessionUser.phone})
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 font-bold text-primary">
                {role === 'nurse' && <Stethoscope className="size-3.5" />}
                {role === 'patient' && <User className="size-3.5" />}
                {role === 'admin' && <Building className="size-3.5" />}
                {role === 'nurse' ? 'حساب ممرض' : role === 'patient' ? 'حساب مريض' : 'حساب إدارة'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1 font-bold text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-3" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>

        {loadError && (
          <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm font-semibold text-destructive">
            {loadError}
          </p>
        )}
        {actionError && (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
            {actionError}
          </p>
        )}

        {/* ======================================================== */}
        {/* NURSE VIEW — من /api/v1/sessions + /api/v1/nurse/wallet/:id */}
        {/* ======================================================== */}
        {role === 'nurse' && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Gift className="size-4" />
                    </span>
                    <h2 className="text-lg font-bold text-primary">
                      رصيد ترحيبي مبدئي: {APP_CONFIG.financial.nurseInitialWelcomeCredit} جنيه مصري
                    </h2>
                  </div>
                  <p className="max-w-3xl text-xs leading-relaxed text-foreground/80">
                    يتم استلام قيمة الجلسة{' '}
                    <strong className="text-foreground">كاش مباشرة باليد من المريض</strong>، وتُخصم عمولة
                    التطبيق ({PLATFORM_COMMISSION_PER_SESSION} جنيه) تلقائياً في الخلفية من رصيدك عند إدخال
                    رمز التحقق (OTP).
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="shrink-0 self-start border-primary/40 bg-background px-3 py-1.5 font-bold text-primary sm:self-auto"
                >
                  {nurseAvailable ? 'متاح للطلبات الآن' : 'غير متاح حالياً'}
                </Badge>
              </div>
            </div>

            {/* Nurse Wallet Statistics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <Wallet className="size-5 text-primary" /> حالة الرصيد والمحفظة
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    أرقام مقروءة مباشرة من محفظتك في قاعدة البيانات
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                  عمولة المنصة: {PLATFORM_COMMISSION_PER_SESSION} ج.م / جلسة مؤكدة
                </Badge>
              </div>

              {!walletAvailable || !wallet ? (
                // لا نعرض أرقاماً مخترعة: رسالة صريحة بأن بيانات المحفظة غير متاحة
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                  <Wallet className="size-10 text-muted-foreground opacity-50" />
                  <div>
                    <p className="font-bold">بيانات المحفظة غير متاحة حالياً</p>
                    <p className="mt-1 max-w-md text-xs text-muted-foreground">
                      {loadError ||
                        'تعذّر قراءة محفظتك من الخادم. لن نعرض قيماً تقديرية — أعد تحميل الصفحة، وإذا استمر الأمر تواصل مع إدارة المنصة.'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
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
                      {wallet.needsRecharge
                        ? 'الرصيد أقل من عمولة الجلسة — يحتاج شحن'
                        : 'الرصيد كافٍ لاستقبال الحالات'}
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
                      بمعدل {PLATFORM_COMMISSION_PER_SESSION} ج.م عن كل جلسة مكتملة
                    </p>
                  </CardContent>
                </Card>
              </div>
              )}
            </div>

            {/* Nurse Location & Coverage — يُحفظ فعلياً في قاعدة البيانات */}
            <div className="space-y-4 rounded-3xl border border-border/80 bg-muted/20 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-bold">
                    <MapPin className="size-4 text-primary" /> موقعك ونطاق التغطية
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    يُستخدم هذا النطاق في إسناد طلبات المرضى القريبة منك
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-2 ring-1 ring-border">
                  <Label htmlFor="nurse-loc" className="cursor-pointer text-xs font-semibold">
                    متاح لاستقبال الطلبات
                  </Label>
                  <Switch
                    id="nurse-loc"
                    checked={nurseAvailable}
                    onCheckedChange={(v) => void handleAvailabilityChange(v)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">محافظة التواجد الرئيسية</Label>
                  <Select
                    value={nurseGov || 'none'}
                    onValueChange={(v: string | null) => setNurseGov(v === 'none' || !v ? '' : v)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="none">غير محددة</SelectItem>
                      {GOVERNORATES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nurse-area" className="text-xs text-muted-foreground">
                    المنطقة / الحي
                  </Label>
                  <Input
                    id="nurse-area"
                    value={nurseArea}
                    onChange={(e) => setNurseArea(e.target.value)}
                    placeholder="مثال: مدينة نصر"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => void handleSaveNurseProfile()} disabled={savingProfile} size="sm">
                  {savingProfile ? 'جاري الحفظ...' : 'حفظ الموقع'}
                </Button>
                {profileSaved && (
                  <span className="text-xs font-semibold text-emerald-600">
                    تم حفظ الموقع في قاعدة البيانات
                  </span>
                )}
              </div>
            </div>

            {/* Nurse Assigned Sessions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">الجلسات المسندة إليك ({sessions.length})</h3>
                  <p className="text-xs text-muted-foreground">
                    وجّه للمريض عبر خرائط جوجل، واطلب رمز التحقق (4 أرقام) عند الانتهاء لتأكيد الجلسة
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
                {sessions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    لا توجد جلسات مسندة إليك حتى الآن. فعّل حالة «متاح لاستقبال الطلبات» ليتمكن المرضى من
                    الحجز معك.
                  </p>
                ) : (
                  sessions.map((s) => {
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

                        {/* التحقق بالرمز — الخادم يتحقق منه ويخصم العمولة فعلياً */}
                        {isNurseFinished && (
                          <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950 dark:text-amber-200">
                            <span className="flex items-center gap-1.5 font-bold">
                              <KeyRound className="size-4 text-amber-700" />
                              أدخل رمز التحقق (4 أرقام) الذي سلّمه لك المريض لتأكيد الإتمام وخصم العمولة
                            </span>
                            <div className="flex gap-2">
                              <Input
                                value={sessionOtpInputs[s.id] || ''}
                                onChange={(e) => handleOtpInputChange(s.id, e.target.value)}
                                placeholder="0000"
                                inputMode="numeric"
                                maxLength={4}
                                dir="ltr"
                                className="h-9 w-40 bg-background text-center font-mono text-sm tracking-widest"
                              />
                              <Button
                                size="sm"
                                onClick={() => void confirmSessionWithOtp(s.id)}
                                className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                              >
                                <CheckCircle2 className="size-3.5" />
                                تأكيد الجلسة وخصم {PLATFORM_COMMISSION_PER_SESSION} ج.م
                              </Button>
                            </div>
                            {otpErrors[s.id] && (
                              <p className="text-[11px] font-semibold text-destructive">{otpErrors[s.id]}</p>
                            )}
                          </div>
                        )}

                        {isDone && (
                          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <BadgeCheck className="size-4" /> تم توثيق الجلسة برمز التحقق
                            </span>
                            {s.confirmedAt && (
                              <span className="text-[11px] font-normal text-muted-foreground">
                                {s.confirmedAt}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
                )}
              </div>
            </div>

            {/* Wallet Transactions Log — لا يُعرض إلا مع وجود محفظة حقيقية */}
            {walletAvailable && wallet ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-base font-bold">
                <FileText className="size-4 text-primary" /> سجل المعاملات المالية والخصومات
              </h3>
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-background text-xs">
                {wallet.transactions.length === 0 ? (
                  <p className="p-6 text-center text-muted-foreground">لا توجد حركات بعد.</p>
                ) : (
                wallet.transactions.map((tx, idx) => (
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
                ))
                )}
              </div>
            </div>
            ) : null}
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
                    {records.length === 0 ? (
                      <p className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                        لا توجد سجلات بعد. سيتم إنشاء تقرير تلقائي بعد تأكيد أول جلسة تمريضية.
                      </p>
                    ) : (
                      records.map((r) => (
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
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3 rounded-3xl border border-border/80 bg-muted/20 p-6">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="size-4 text-primary" /> كيف تتم الزيارة؟
                </h3>
                <ol className="space-y-2 text-xs text-muted-foreground">
                  <li>1. تختار الممرض المناسب وتكتب عنوان الزيارة مع إحداثيات GPS.</li>
                  <li>2. يصلك رمز تحقق من 4 أرقام — سلّمه للممرض عند وصوله.</li>
                  <li>3. الممرض يبدأ الجلسة وينهيها ثم يدخل الرمز لتوثيق الإنجاز.</li>
                  <li>4. تُخصم عمولة المنصة تلقائياً من رصيد الممرض، والدفع لك كاش.</li>
                </ol>
              </div>
            </div>

            {/* Patient Bookings & Session Confirmations */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">حجوزاتك وجلساتك ({sessions.length})</h3>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    لا توجد حجوزات بعد. تصفح قائمة الممرضين لطلب أول زيارة.
                  </p>
                ) : (
                  sessions.map((s) => {
                  const status = SESSION_STATUS_MAP[s.status] || SESSION_STATUS_MAP.pending
                  const isNurseFinished = s.status === 'completed_by_nurse'
                  const isDone = s.status === 'confirmed_completed'

                  return (
                    <Card key={s.id} className="overflow-hidden shadow-2xs">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">#{s.id}</span>
                            <Badge variant="outline" className={cn('text-xs font-medium', status.color)}>
                              {status.label}
                            </Badge>
                            {!isDone && (
                              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                                <KeyRound className="ml-1 inline size-3" />
                                رمز التحقق الخاص بك: {s.completionCode}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold">{s.service}</h4>
                          <p className="text-xs text-muted-foreground">
                            الممرض: <strong>{s.nurseName}</strong> — الموعد: {s.date}
                            {s.time ? ` (${s.time})` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            العنوان: {s.address} ({s.area}، {s.governorate})
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/sessions/${s.id}`}>تتبع الجلسة</Link>
                          </Button>

                          {isNurseFinished && (
                            <span className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                              بانتظار تأكيدك — سلّم الرمز للممرض
                            </span>
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
                })
                )}
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
                      عن {totalCompletedSessions} جلسات منتهية ومؤكدة
                    </p>
                  </CardContent>
                </Card>

                {/* 2. Registered Nurses */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        الممرضون المسجلون
                      </span>
                      <Users className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {allNurses.length}{' '}
                      <span className="text-xs font-normal text-muted-foreground">ممرض</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {allNurses.filter((n) => n.verified).length} معتمد ·{' '}
                      {allNurses.filter((n) => !n.verified).length} قيد المراجعة
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

                {/* 4. Active Governorates — محسوبة من بيانات الممرضين الفعلية */}
                <Card className="shadow-xs">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        نطاق التغطية الفعلي
                      </span>
                      <MapPin className="size-4 text-primary" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {new Set(allNurses.map((n) => n.governorate).filter(Boolean)).size}{' '}
                      <span className="text-xs font-normal text-muted-foreground">محافظة</span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      من أصل {GOVERNORATES.length} محافظة — مبنية على تسجيلات الممرضين
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Nurses Balances & Management Table */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold">
                    <Users className="size-4 text-primary" /> جدول متابعة أرصدة الممرضين والعمولات
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    كل الأرقام مأخوذة من قاعدة البيانات — أرصدة حقيقية بعد خصم العمولة عن كل جلسة مؤكدة
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
                    {allNurses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          لا يوجد ممرضون مسجلون في قاعدة البيانات بعد.
                        </td>
                      </tr>
                    ) : (
                      allNurses.map((nurse) => {
                        const balance = nurse.walletBalance ?? 0
                        const completed = nurse.completedSessionsCount ?? 0
                        const totalCommission = completed * PLATFORM_COMMISSION_PER_SESSION
                        const isLowBalance = balance < PLATFORM_COMMISSION_PER_SESSION

                        return (
                          <tr key={nurse.id} className="transition-colors hover:bg-muted/20">
                            <td className="p-3">
                              <div className="font-bold text-foreground">{nurse.name}</div>
                              <div className="text-[11px] text-muted-foreground">{nurse.title}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{nurse.governorate || '—'}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {nurse.area || '—'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold">{completed}</td>
                            <td className="p-3 text-center font-mono font-bold text-primary">
                              {totalCommission} ج.م
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={cn(
                                  'font-mono text-sm font-bold',
                                  isLowBalance ? 'text-amber-600' : 'text-emerald-600',
                                )}
                              >
                                {balance} ج.م
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {!nurse.verified ? (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/30 text-[10px] text-amber-700 dark:text-amber-300"
                                >
                                  قيد المراجعة
                                </Badge>
                              ) : isLowBalance ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  رصيد منخفض
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                                >
                                  {nurse.available ? 'نشط ومتاح' : 'نشط'}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap justify-center gap-1.5">
                                {!nurse.verified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleAdminApproveNurse(nurse.id)}
                                    className="h-7 gap-1 text-[11px] font-semibold"
                                  >
                                    <BadgeCheck className="size-3" /> اعتماد
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void handleAdminCreditNurse(nurse.id, 100)}
                                  className="h-7 gap-1 text-[11px] font-semibold"
                                >
                                  <Plus className="size-3" /> شحن 100 ج.م
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
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
                {sessions.length === 0 ? (
                  <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    لا توجد جلسات مسجلة بعد.
                  </p>
                ) : (
                  sessions.map((s) => {
                    const status = SESSION_STATUS_MAP[s.status] || SESSION_STATUS_MAP.pending
                    const isDone = s.status === 'confirmed_completed'

                    return (
                      <Card key={s.id} className="overflow-hidden shadow-2xs">
                        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-muted-foreground">
                                #{s.id}
                              </span>
                              <Badge variant="outline" className={cn('text-xs font-medium', status.color)}>
                                {status.label}
                              </Badge>
                              {s.arrivalConfirmed && (
                                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                  تم الوصول
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold">{s.service}</h4>
                            <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                              <span>
                                الممرض: <strong>{s.nurseName}</strong>
                              </span>
                              <span>
                                المريض: <strong>{s.patientName}</strong>
                              </span>
                              <span>
                                الموقع: {s.area}، {s.governorate}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/sessions/${s.id}`}>متابعة وتفاصيل</Link>
                            </Button>
                            {isDone && (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                <BadgeCheck className="size-4" /> العمولة مخصومة
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
