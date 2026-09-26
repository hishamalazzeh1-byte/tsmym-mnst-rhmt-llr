'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { SessionTracker } from '@/components/session-tracker'
import { fetchSession } from '@/lib/app-state'
import { getUserSession } from '@/lib/auth-session'
import type { SessionBooking } from '@/lib/types'

export function SessionDetailClient({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionBooking | null>(null)
  const [error, setError] = useState('')
  const user = getUserSession()

  useEffect(() => {
    if (!sessionId || sessionId === '_') {
      setError('معرّف الجلسة غير صالح')
      return
    }
    fetchSession(sessionId).then((s) => {
      if (!s) setError('الجلسة غير موجودة أو غير مصرح بعرضها')
      else setSession(s)
    })
  }, [sessionId])

  if (error) {
    return <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">{error}</div>
  }
  if (!session) {
    return <div className="py-16 text-center text-muted-foreground">جاري تحميل الجلسة...</div>
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="size-4" /> العودة إلى قائمة الجلسات
        </Link>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          توثيق رقمي من قاعدة البيانات
        </span>
      </div>
      <SessionTracker
        session={session}
        userRole={user?.role === 'admin' || user?.role === 'nurse' ? user.role : 'patient'}
        onSessionUpdated={setSession}
      />
    </>
  )
}
