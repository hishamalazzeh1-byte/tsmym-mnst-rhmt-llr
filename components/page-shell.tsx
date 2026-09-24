import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { EmergencyButton } from '@/components/emergency-button'

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <EmergencyButton />
    </div>
  )
}

export function PageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="border-b border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
