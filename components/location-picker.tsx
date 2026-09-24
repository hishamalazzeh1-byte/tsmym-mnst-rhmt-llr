'use client'

import { useState } from 'react'
import { Check, Crosshair, Loader2, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GOVERNORATES } from '@/lib/data'
import type { Coordinates } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LocationPickerProps {
  initialGovernorate?: string
  initialArea?: string
  initialAddress?: string
  initialCoordinates?: Coordinates
  onChange?: (loc: {
    governorate: string
    area: string
    address: string
    coordinates?: Coordinates
  }) => void
  compact?: boolean
  label?: string
}

export function LocationPicker({
  initialGovernorate = 'القاهرة',
  initialArea = '',
  initialAddress = '',
  initialCoordinates,
  onChange,
  compact = false,
  label = 'تحديد الموقع الجغرافي للزيارة',
}: LocationPickerProps) {
  const [gov, setGov] = useState(initialGovernorate)
  const [area, setArea] = useState(initialArea)
  const [address, setAddress] = useState(initialAddress)
  const [coords, setCoords] = useState<Coordinates | undefined>(initialCoordinates)
  const [locating, setLocating] = useState(false)
  const [gpsSuccess, setGpsSuccess] = useState(Boolean(initialCoordinates))
  const [gpsError, setGpsError] = useState('')

  function handleUpdate(
    nextGov = gov,
    nextArea = area,
    nextAddr = address,
    nextCoords = coords,
  ) {
    onChange?.({
      governorate: nextGov,
      area: nextArea,
      address: nextAddr,
      coordinates: nextCoords,
    })
  }

  function detectGPSLocation() {
    if (!navigator.geolocation) {
      setGpsError('متصفحك لا يدعم تحديد الموقع الجغرافي GPS')
      return
    }

    setLocating(true)
    setGpsError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected: Coordinates = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        }
        setCoords(detected)
        setGpsSuccess(true)
        setLocating(false)

        // تحديد تقريبي افتراضي إذا لم يتم إدخال العنوان بعد
        const defaultArea = area || 'موقعي الحالي عبر GPS'
        if (!area) setArea(defaultArea)

        handleUpdate(gov, defaultArea, address, detected)
      },
      (err) => {
        setLocating(false)
        setGpsSuccess(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('تم رفض إذن الوصول للموقع. يرجى إدخال العنوان يدوياً أو تفعيل إذن الموقع.')
        } else {
          setGpsError('تعذّر التقاط إحداثيات GPS بدقة، يمكنك كتابة العنوان يدوياً.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 font-semibold text-foreground">
          <MapPin className="size-4 text-primary" />
          {label}
        </Label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectGPSLocation}
          disabled={locating}
          className="h-8 gap-1.5 text-xs font-medium text-primary hover:text-primary"
        >
          {locating ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              جاري التحديد...
            </>
          ) : (
            <>
              <Crosshair className="size-3.5 text-primary" />
              تحديد تلقائي عبر GPS
            </>
          )}
        </Button>
      </div>

      {gpsSuccess && coords && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="size-3.5 text-emerald-600" />
            تم ربط إحداثيات GPS بنجاح ({coords.lat}°, {coords.lng}°)
          </span>
          <span className="text-[11px] opacity-75">دقة عالية</span>
        </div>
      )}

      {gpsError && (
        <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          {gpsError}
        </p>
      )}

      <div className={cn('grid gap-2.5', compact ? 'grid-cols-1' : 'grid-cols-2')}>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">المحافظة</span>
          <Select
            value={gov}
            onValueChange={(val) => {
              setGov(val)
              handleUpdate(val, area, address, coords)
            }}
          >
            <SelectTrigger className="h-9 bg-background text-sm">
              <SelectValue placeholder="اختر المحافظة" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {GOVERNORATES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">الحي / المنطقة</span>
          <Input
            value={area}
            onChange={(e) => {
              setArea(e.target.value)
              handleUpdate(gov, e.target.value, address, coords)
            }}
            placeholder="مثال: المعادي، الدقي، المنصورة"
            className="h-9 bg-background text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">تفاصيل العنوان والشارع</span>
        <div className="relative">
          <Navigation className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              handleUpdate(gov, area, e.target.value, coords)
            }}
            placeholder="اسم الشارع، رقم العمارة، الدور، علامة مميزة"
            className="h-9 bg-background pr-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
