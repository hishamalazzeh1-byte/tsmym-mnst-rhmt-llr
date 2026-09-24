import Link from 'next/link'
import { BadgeCheck, Briefcase, MapPin, Star } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { serviceTitle } from '@/lib/data'
import type { Nurse } from '@/lib/types'

export function NurseCard({ nurse }: { nurse: Nurse }) {
  const initials = nurse.name.replace(/^أ\.\s*/, '').slice(0, 2)

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="size-14 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-semibold">{nurse.name}</h3>
              {nurse.verified && (
                <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="موثّق" />
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">{nurse.title}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {nurse.rating}
              </span>
              <span>({nurse.reviews} تقييم)</span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {nurse.area}، {nurse.governorate}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {nurse.specialties.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="font-normal text-xs">
              {serviceTitle(s)}
            </Badge>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="size-3.5 text-primary" />
            <span>خبرة {nurse.experienceYears} سنوات</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${nurse.available ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {nurse.available ? 'متاح للزيارة' : 'حجز مسبق'}
            </span>
            <Button asChild size="sm">
              <Link href={`/nurses/${nurse.id}`}>احجز الآن</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
