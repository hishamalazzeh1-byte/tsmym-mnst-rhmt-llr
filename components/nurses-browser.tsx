'use client'

import { useMemo, useState } from 'react'
import { MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { NurseCard } from '@/components/nurse-card'
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
import { GOVERNORATES, NURSES, SERVICES } from '@/lib/data'
import type { ServiceId } from '@/lib/types'

export function NursesBrowser({
  initialService,
}: {
  initialService?: string
}) {
  const [query, setQuery] = useState('')
  const [service, setService] = useState<string>(initialService ?? 'all')
  const [gov, setGov] = useState<string>('all')
  const [sort, setSort] = useState<string>('rating')
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const results = useMemo(() => {
    let list = NURSES.filter((n) => {
      if (query && !n.name.includes(query) && !n.title.includes(query)) return false
      if (service !== 'all' && !n.specialties.includes(service as ServiceId)) return false
      if (gov !== 'all' && n.governorate !== gov && !n.coverageGovernorates?.includes(gov)) return false
      if (onlyAvailable && !n.available) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'experience') return b.experienceYears - a.experienceYears
      if (sort === 'sessions') return (b.completedSessionsCount || 0) - (a.completedSessionsCount || 0)
      return b.rating - a.rating
    })
    return list
  }, [query, service, gov, sort, onlyAvailable])

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-border/60 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="size-4 text-primary" /> تصفية النتائج
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="search">بحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="اسم الممرض أو التخصص"
                  className="pr-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>الخدمة</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الخدمات</SelectItem>
                  {SERVICES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <MapPin className="size-3.5 text-primary" /> المحافظة
              </Label>
              <Select value={gov} onValueChange={setGov}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">كل محافظات مصر (27 محافظة)</SelectItem>
                  {GOVERNORATES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>الترتيب حسب</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">الأعلى تقييماً</SelectItem>
                  <SelectItem value="experience">الأكثر خبرة</SelectItem>
                  <SelectItem value="sessions">الأكثر تنفيذاً للجلسات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
              <Label htmlFor="available" className="cursor-pointer">
                المتاحون الآن فقط
              </Label>
              <Switch
                id="available"
                checked={onlyAvailable}
                onCheckedChange={setOnlyAvailable}
              />
            </div>
          </div>
        </div>
      </aside>

      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          {results.length} ممرض معتمد متاح
        </p>
        {results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((nurse) => (
              <NurseCard key={nurse.id} nurse={nurse} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            لا يوجد ممرضون مطابقون لبحثك. جرّب اختيار محافظة أخرى أو تعديل عوامل التصفية.
          </div>
        )}
      </div>
    </div>
  )
}
