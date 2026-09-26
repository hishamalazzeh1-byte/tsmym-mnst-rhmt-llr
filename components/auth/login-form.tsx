'use client'
// components/auth/login-form.tsx
// واجهة تسجيل الدخول المرتبطة بالـ Real Backend Server
// دعم إرسال الـ OTP الفعلي من السيرفر وتخزين الجلسات بـ JWT + LocalStorage
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ArrowLeft, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiSendOtp, apiVerifyOtp, getUserSession } from '@/lib/auth-session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Screen = 'choose' | 'phone-input' | 'otp-input' | 'loading' | 'success' | 'error'

export function LoginForm() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('choose')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-check persistent session on mount
  useEffect(() => {
    const existing = getUserSession()
    if (existing && existing.isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [router])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => setCountdown(c => c - 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [countdown])

  // ─── Real Google Sign-In Call ─────────────────────────────────────────────
  async function handleGoogleLogin() {
    setError('تسجيل الجيميل غير مفعّل بدون توكن Google OAuth حقيقي. استخدم رقم الهاتف.')
    setScreen('error')
  }

  // ─── Real Phone: Send OTP via Backend Server ──────────────────────────────
  async function sendOtp() {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) {
      setError('أدخل رقم هاتف مصري صحيح (مثال: 01012345678)')
      return
    }

    setError('')
    setScreen('loading')

    const res = await apiSendOtp(cleaned)
    if (res.success) {
      setCountdown(60)
      setScreen('otp-input')
    } else {
      setError(res.message || 'حدث خطأ أثناء إرسال رمز التحقق')
      setScreen('phone-input')
    }
  }

  // ─── Real Phone: Verify OTP via Backend Server ───────────────────────────
  async function verifyOtp() {
    const code = otp.join('')
    if (code.length !== 4) {
      setError('أدخل كود التحقق المكوّن من 4 أرقام')
      return
    }

    setScreen('loading')

    const res = await apiVerifyOtp(phone, code)
    if (res.success) {
      setScreen('success')
      setTimeout(() => router.push('/dashboard'), 1000)
    } else {
      setError(res.message || 'رمز التحقق غير صحيح')
      setScreen('otp-input')
    }
  }

  // ─── OTP digit input handler ─────────────────────────────────────────────
  function handleOtpChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 3) otpRefs.current[idx + 1]?.focus()
    if (!digit && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري الاعتماد وتأكيد الحساب مع السيرفر...</p>
      </div>
    )
  }

  if (screen === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 className="size-14 text-green-500 animate-bounce" />
        <p className="text-lg font-semibold text-green-700">تم تسجيل الدخول بنجاح 🎉</p>
        <p className="text-sm text-muted-foreground">جاري التوجيه إلى اللوحة الرئيسية...</p>
      </div>
    )
  }

  if (screen === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => { setError(''); setScreen('choose') }}>
          العودة والمحاولة مجدداً
        </Button>
      </div>
    )
  }

  if (screen === 'otp-input') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center text-sm text-muted-foreground space-y-1">
          <ShieldCheck className="mx-auto size-6 text-primary" />
          <div>تم إرسال كود التحقق إلى <strong dir="ltr" className="text-foreground">{phone}</strong></div>
          <p className="text-xs">أدخل الرمز الذي وصلك. أثناء الاختبار المحلي يُحفظ الرمز في ملف قاعدة البيانات على الخادم.</p>
        </div>

        <div>
          <Label className="mb-3 block text-center">أدخل رمز التحقق (OTP)</Label>
          <div className="flex justify-center gap-3" dir="ltr">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !otp[i] && i > 0) {
                    otpRefs.current[i - 1]?.focus()
                  }
                }}
                className={cn(
                  'size-14 rounded-xl border-2 text-center text-2xl font-bold transition-colors outline-none',
                  digit
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background focus:border-primary',
                )}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <Button className="w-full" size="lg" onClick={verifyOtp} disabled={otp.join('').length !== 4}>
          تأكيد الدخول
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {countdown > 0 ? (
            <span>إعادة الإرسال خلال <strong>{countdown}</strong> ثانية</span>
          ) : (
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => { setScreen('phone-input'); setOtp(['', '', '', '']) }}
            >
              إعادة إرسال كود جديد
            </button>
          )}
        </p>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setScreen('choose')}
        >
          <ArrowLeft className="size-4" /> تغيير رقم الهاتف
        </button>
      </div>
    )
  }

  if (screen === 'phone-input') {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="phone">رقم الهاتف المحمول</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="01xxxxxxxxx"
            dir="ltr"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendOtp()}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">أدخل أي رقم محمول مصري مكون من 11 رقم</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" size="lg" onClick={sendOtp}>
          إرسال رمز التحقق (OTP)
        </Button>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => { setPhone(''); setError(''); setScreen('choose') }}
        >
          <ArrowLeft className="size-4" /> العودة
        </button>
      </div>
    )
  }

  // ─── Default: Choose login method ─────────────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground mb-2">اختر طريقة الدخول المناسبة لك</p>

      {/* Phone OTP option */}
      <button
        type="button"
        onClick={() => setScreen('phone-input')}
        className="flex w-full items-center gap-4 rounded-xl border-2 border-border bg-background p-4 text-right transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Phone className="size-6" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">التسجيل / الدخول برقم الهاتف</span>
          <span className="block text-sm text-muted-foreground">إرسال رمز تحقق OTP كود فورياً</span>
        </span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">أو</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Google Sign-In option */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex w-full items-center gap-4 rounded-xl border-2 border-border bg-background p-4 text-right transition-all hover:border-[#4285F4] hover:bg-blue-50/50 active:scale-[0.98]"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-xs">
          <svg viewBox="0 0 48 48" className="size-6" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block font-semibold">التسجيل السريع بحساب الچيميل</span>
          <span className="block text-sm text-muted-foreground">Google Sign-In بنقرة واحدة</span>
        </span>
      </button>
    </div>
  )
}
