import { PageShell } from '@/components/page-shell'
import { Hero } from '@/components/landing/hero'
import { ServicesSection } from '@/components/landing/services-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { TriageCTA } from '@/components/landing/triage-cta'
import { TrustSection } from '@/components/landing/trust-section'

export default function HomePage() {
  return (
    <PageShell>
      <Hero />
      <ServicesSection />
      <HowItWorks />
      <TriageCTA />
      <TrustSection />
    </PageShell>
  )
}
