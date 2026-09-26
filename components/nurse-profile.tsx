'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Globe,
  MapPin,
  Star,
} from 'lucide-react'
import { BookingPanel } from '@/components/booking-panel'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { fetchNurse } from '@/lib/app-state'
import { serviceTitle } from '@/lib/data'
import type { Nurse } from '@/lib/types'

export function NurseProfile({ nurseId }: { nurseId: string }) {
  const [nurse, setNurse] = useState<Nurse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!nurseId || nurseId === '_') {
      setError('معرّف الممرض غير صالح')
      return
    }
    fetchNurse(nurseId).then((n) => {
      if (!n) setError('لم يتم العثور على هذا الممرض في قاعدة البيانات')
      else setNurse(n)
    })
  }, [nurseId])

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        {error}
      </div>
    )
  }

  if (!nurse) {
    return <div className="py-16 text-center text-muted-foreground">جاري تحميل ملف الممرض...</div>
  }

  const initials = nurse.name.replace(/^أ\.\s*/, '').slice(0, 2)

  return (
    <div>
      <Link
        href="/nurses"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="size-4" /> رجوع إلى قائمة الممرضين
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-xs sm:flex-row sm:items-start">
            <Avatar className="size-20 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{nurse.name}</h1>
                {nurse.verified && (
                  <BadgeCheck className="size-5 text-primary" aria-label="موثّق بالنقابة" />
                )}
              </div>
              <p className="text-muted-foreground text-sm">{nurse.title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  {nurse.rating}
                  <span className="font-normal text-muted-foreground">({nurse.reviews} تقييم)</span>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3.5 text-primary" /> {nurse.area}، {nurse.governorate}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Briefcase className="size-3.5 text-primary" /> {nurse.experienceYears} سنوات خبرة
                </span>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              {nurse.bio ? (
                <div>
                  <h2 className="mb-2 font-semibold">نبذة مهنية</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{nurse.bio}</p>
                </div>
              ) : null}
              <div>
                <h2 className="mb-2 font-semibold">الخدمات والتخصصات</h2>
                <div className="flex flex-wrap gap-2">
                  {(nurse.specialties || []).map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {serviceTitle(s)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-2 flex items-center gap-1 font-semibold">
                  <Globe className="size-4" /> اللغات
                </h2>
                <p className="text-sm text-muted-foreground">{(nurse.languages || []).join('، ')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <BookingPanel nurse={nurse} />
        </div>
      </div>
    </div>
  )
}
