'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  KeyRound,
  MapPin,
  Navigation,
  ShieldCheck,
  Stethoscope,
  Zap,
} from 'lucide-react'
import { LocationPicker } from '@/components/location-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { serviceTitle } from '@/lib/data'
import type { Coordinates, Nurse } from '@/lib/types'

const TIMES = ['زيارة فورية الآن (عاجلة)', '09:00 ص', '11:00 ص', '01:00 م', '03:00 م', '05:00 م', '07:00 م']

export function BookingPanel({ nurse }: { nurse: Nurse }) {
  const [service, setService] = useState(nurse.specialties[0])
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(TIMES[0])
  const [location, setLocation] = useState<{
    governorate: string
    area: string
    address: string
    coordinates?: Coordinates
  }>({
    governorate: nurse.governorate,
    area: nurse.area,
    address: '',
  })
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)
  const [completionCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString())

  const ready = patientName.trim().length > 2 && patientPhone.trim().length >= 10 && location.address.trim().length > 2

  if (done) {
    return (
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="size-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">تم إرسال الطلب للممرض بنجاح</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            تم توجيه طلبك وإحداثيات موقعك إلى <strong>{nurse.name}</strong>. الممرض في طريقه إليك الآن.
          </p>
        </div>

        {/* 4-Digit OTP Verification Card */}
        <div className="rounded-2xl border-2 border-primary/40 bg-background p-4 text-center shadow-xs space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
            <KeyRound className="size-4" /> رمز التحقق الرقمي لبدء الجلسة (OTP)
          </div>
          <div className="font-mono text-3xl font-extrabold tracking-widest text-primary bg-primary/10 py-2.5 rounded-xl border border-primary/20">
            {completionCode}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            أعطِ هذا الرمز للممرض عند وصوله إلى منزلك ليدخله في جهازه ويبدأ تنفيذ الجلسة وتوثيقها رسمياً.
          </p>
        </div>

        {/* Cash payment notice */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-right text-xs text-amber-900 dark:text-amber-200">
          <Banknote className="size-5 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            <strong>طريقة الدفع:</strong> يتم دفع أتعاب الجلسة <strong>كاش مباشرة للممرض</strong> عند تقديم الرعاية في منزلك.
          </p>
        </div>

        {/* Booking Details Summary */}
        <div className="rounded-2xl border border-border/80 bg-background p-4 text-right text-xs space-y-2">
          <div className="flex justify-between border-b pb-1.5">
            <span className="text-muted-foreground">الخدمة:</span>
            <span className="font-bold">{serviceTitle(service)}</span>
          </div>
          <div className="flex justify-between border-b pb-1.5">
            <span className="text-muted-foreground">الموعد:</span>
            <span className="font-semibold">{date} ({time})</span>
          </div>
          <div className="flex justify-between border-b pb-1.5">
            <span className="text-muted-foreground">المريض:</span>
            <span className="font-semibold">{patientName} ({patientPhone})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">عنوان الزيارة:</span>
            <span className="font-semibold">{location.address} ({location.area}، {location.governorate})</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button asChild className="w-full font-bold" size="lg">
            <Link href="/sessions">
              <Navigation className="size-4 mr-1.5" /> تتبع وصول الممرض الآن
            </Link>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setDone(false)}>
            طلب خدمة أخرى
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-base">
            <CalendarClock className="size-5 text-primary" /> طلب زيارة تمريضية مباشرة
          </h3>
          <p className="text-xs text-muted-foreground">الممرض المعين: {nurse.name}</p>
        </div>
        <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
          {nurse.available ? 'متاح للتوجه فوراً' : 'حجز مسبق'}
        </Badge>
      </div>

      {/* Service Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs">الخدمة التمريضية المطلوبة</Label>
        <Select value={service} onValueChange={(v) => setService(v as typeof service)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {nurse.specialties.map((s) => (
              <SelectItem key={s} value={s}>
                {serviceTitle(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Patient info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pname" className="text-xs">اسم المريض *</Label>
          <Input
            id="pname"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="الاسم ثلاثي"
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pphone" className="text-xs">رقم الموبايل *</Label>
          <Input
            id="pphone"
            type="tel"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            dir="ltr"
            className="h-9 text-xs text-right"
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs">تاريخ الزيارة</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">التوقيت</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="h-9 text-xs font-semibold">
              <SelectValue placeholder="اختر الموعد" />
            </SelectTrigger>
            <SelectContent>
              {TIMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Geolocation Picker */}
      <LocationPicker
        compact
        label="عنوان وموقع الزيارة التمريضية (GPS)"
        initialGovernorate={nurse.governorate}
        initialArea={nurse.area}
        onChange={setLocation}
      />

      {/* Cash Notice Box */}
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
        <Banknote className="size-4 text-primary shrink-0" />
        <span>
          <strong>الدفع كاش للممرض:</strong> تسدد قيمة الخدمة كاش مباشرة للممرض بعد تقديم الرعاية في منزلك.
        </span>
      </div>

      {/* Medical Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-xs">ملاحظات الحالة المرضية (اختياري)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="تفاصيل الجرح أو العملية، أي حساسية من أدوية معينة..."
          rows={2}
          className="text-xs"
        />
      </div>

      <div className="pt-1">
        <Button
          className="w-full font-bold text-sm"
          size="lg"
          disabled={!ready}
          onClick={() => setDone(true)}
        >
          طلب الممرض والتحرك لموقعي الآن
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground text-center justify-center">
        <ShieldCheck className="size-3.5 text-primary" />
        تأكيد وصول وبدء الجلسة محمي برمز تحقق رقمي (4-Digit OTP)
      </div>
    </div>
  )
}
