'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/utils'
import { serviceTitle } from '@/lib/data'

interface TriageResult {
  urgency: 'emergency' | 'urgent' | 'routine' | 'self-care'
  summary: string
  possibleConditions: string[]
  recommendedActions: string[]
  recommendedServiceId: string | null
  redFlags: string[]
}

const URGENCY = {
  emergency: {
    label: 'حالة طارئة',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
    note: 'ننصحك بالاتصال بالإسعاف (123) أو التوجه لأقرب طوارئ فوراً.',
  },
  urgent: {
    label: 'تحتاج رعاية عاجلة',
    className: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
    note: 'يُفضّل رعاية طبية خلال ساعات. يمكنك حجز ممرض عاجل الآن.',
  },
  routine: {
    label: 'رعاية منزلية مناسبة',
    className: 'bg-primary/10 text-primary border-primary/30',
    note: 'حالتك مناسبة لزيارة تمريضية منزلية مجدولة.',
  },
  'self-care': {
    label: 'رعاية ذاتية',
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
    note: 'يمكن متابعة الحالة منزلياً مع المراقبة. احجز إن ساءت الأعراض.',
  },
} as const

export function TriageChecker() {
  const [symptoms, setSymptoms] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [duration, setDuration] = useState('')
  const [history, setHistory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<TriageResult | null>(null)

  async function submit() {
    if (!symptoms.trim()) {
      setError('اكتب الأعراض أولاً')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      // الطلب يذهب إلى الخادم الحقيقي الذي يملك قواعد الفرز (لا API محلي وهمي)
      // نرسل كل التفاصيل السريرية التي يجمعها النموذج ليُبنى عليها التقييم
      const data = await apiRequest<TriageResult>('/api/v1/triage', {
        method: 'POST',
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          age: age.trim() || null,
          gender: gender || null,
          duration: duration.trim() || null,
          history: history.trim() || null,
        }),
      })
      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? `تعذر الوصول لخادم الفرز الطبي: ${err.message}`
          : 'تعذر الوصول لخادم الفرز الطبي. تحقق من تشغيل الخادم.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold leading-tight">صف أعراضك</h2>
              <p className="text-xs text-muted-foreground">
                كلما زادت التفاصيل، كان التقييم أدق
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="symptoms">الأعراض *</Label>
            <Textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="مثال: ارتفاع في الحرارة منذ يومين مع سعال وألم في الحلق..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="age">العمر</Label>
              <Input
                id="age"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="35"
              />
            </div>
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <Select value={gender} onValueChange={(v: string | null) => setGender(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duration">مدة الأعراض</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="مثال: 3 أيام"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="history">أمراض مزمنة / تاريخ مرضي</Label>
            <Input
              id="history"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="مثال: سكري، ضغط"
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={loading || symptoms.trim().length < 3}
            onClick={submit}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> جارٍ التحليل...
              </>
            ) : (
              <>
                <Stethoscope className="size-4" /> ابدأ الفرز الطبي
              </>
            )}
          </Button>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            هذا التقييم استرشادي بالذكاء الاصطناعي ولا يُغني عن استشارة الطبيب. في
            الحالات الطارئة اتصل بالإسعاف فوراً.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!result && !error && !loading && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <Stethoscope className="mb-3 size-10 opacity-40" />
            <p>ستظهر نتيجة الفرز الطبي هنا بعد إدخال الأعراض.</p>
          </div>
        )}

        {loading && (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border p-8 text-center text-muted-foreground">
            <Loader2 className="mb-3 size-10 animate-spin text-primary" />
            <p>يقوم المساعد الطبي بتحليل حالتك...</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
            {error}
          </div>
        )}

        {result && (
          <>
            <Card className={cn('border', URGENCY[result.urgency].className)}>
              <CardContent className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="size-5" />
                  <span className="text-lg font-bold">
                    {URGENCY[result.urgency].label}
                  </span>
                </div>
                <p className="text-sm">{URGENCY[result.urgency].note}</p>
              </CardContent>
            </Card>

            {result.urgency === 'emergency' && (
              <Button asChild variant="destructive" size="lg" className="w-full">
                <a href="tel:123">
                  <Phone className="size-4" /> اتصل بالإسعاف الآن (123)
                </a>
              </Button>
            )}

            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h3 className="mb-1 font-semibold">ملخص الحالة</h3>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>

                {result.possibleConditions?.length > 0 && (
                  <div>
                    <h3 className="mb-1 font-semibold">حالات محتملة</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {result.possibleConditions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendedActions?.length > 0 && (
                  <div>
                    <h3 className="mb-1 font-semibold">خطوات ينصح بها</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {result.recommendedActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.redFlags?.length > 0 && (
                  <div className="rounded-xl bg-destructive/5 p-3">
                    <h3 className="mb-1 flex items-center gap-1 font-semibold text-destructive">
                      <AlertTriangle className="size-4" /> علامات تستوجب الطوارئ
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-destructive/90">
                      {result.redFlags.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {result.recommendedServiceId && (
              <Button asChild size="lg" className="w-full">
                <Link href={`/nurses?service=${result.recommendedServiceId}`}>
                  احجز ممرضاً لـ{serviceTitle(result.recommendedServiceId)}
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
