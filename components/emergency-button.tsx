'use client'

import { useEffect, useState } from 'react'
import { Ambulance, CheckCircle2, Clock, Crosshair, Loader2, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Coordinates } from '@/lib/types'

export function EmergencyButton() {
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [locationLabel, setLocationLabel] = useState('جاري التقاط إحداثيات موقعك عبر GPS...')

  useEffect(() => {
    if (open && !requested) {
      if (navigator.geolocation) {
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c: Coordinates = {
              lat: Number(pos.coords.latitude.toFixed(4)),
              lng: Number(pos.coords.longitude.toFixed(4)),
            }
            setCoords(c)
            setLocationLabel(`تم تحديد موقعك بدقة GPS (${c.lat}°, ${c.lng}°)`)
            setLocating(false)
          },
          () => {
            setLocating(false)
            setLocationLabel('القاهرة والجيزة — نطاق الاستجابة السريع')
          },
          { enableHighAccuracy: true, timeout: 7000 },
        )
      } else {
        setLocationLabel('القاهرة والجيزة — نطاق الاستجابة السريع')
      }
    }
  }, [open, requested])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setRequested(false)
      }}
    >
      <DialogTrigger asChild>
        <button
          className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-destructive px-5 py-3.5 font-bold text-white shadow-lg shadow-destructive/30 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          aria-label="طلب إسعاف طارئ فوري"
        >
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex size-3 rounded-full bg-white" />
          </span>
          طوارئ
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {!requested ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Ambulance className="size-7" />
              </div>
              <DialogTitle className="text-center text-xl">
                طلب إسعاف ومسعف طارئ
              </DialogTitle>
              <DialogDescription className="text-center text-xs leading-relaxed">
                سيتم إرسال أقرب مسعف معتمد إلى إحداثيات موقعك الجغرافي فوراً. في حالات الخطر الشديد اتصل بالإسعاف الرسمي مباشرة.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3.5">
                <MapPin className="size-5 shrink-0 text-primary" />
                <div className="text-xs flex-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    موقعك الجغرافي للإنقاذ:
                    {locating && <Loader2 className="size-3 animate-spin text-primary" />}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{locationLabel}</p>
                </div>
              </div>

              <Button
                className="w-full bg-destructive text-white hover:bg-destructive/90 font-bold"
                size="lg"
                onClick={() => setRequested(true)}
              >
                <Ambulance className="size-5" /> إرسال طلب المسعف إلى موقعي الآن
              </Button>

              <a
                href="tel:123"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-xs font-bold hover:bg-muted"
              >
                <Phone className="size-4" /> الاتصال بالإسعاف الرسمي 123
              </a>
            </div>
          </>
        ) : (
          <div className="py-4 text-center space-y-3">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-9" />
            </div>
            <h3 className="text-xl font-bold">تم توجيه أقرب مسعف بنجاح</h3>
            <p className="text-xs text-muted-foreground">
              تمت مشاركة إحداثيات موقعك مع المسعف الميداني
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 font-semibold text-primary text-sm">
              <Clock className="size-4" />
              الوصول المتوقع خلال 12 دقيقة
            </div>
            <p className="text-xs text-muted-foreground">
              أ. أحمد فتحي — مسعف طوارئ معتمد ★ 4.7 — متوجه إليك
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
