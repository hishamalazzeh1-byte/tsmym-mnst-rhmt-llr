import { NextResponse } from 'next/server'
import { NURSES } from '@/lib/data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const governorate = searchParams.get('gov')
  const specialty = searchParams.get('specialty')
  const availableOnly = searchParams.get('available') === 'true'

  let list = NURSES

  if (governorate) {
    list = list.filter((n) => n.governorate === governorate || n.coverageGovernorates?.includes(governorate))
  }

  if (specialty) {
    list = list.filter((n) => n.specialties.includes(specialty as any))
  }

  if (availableOnly) {
    list = list.filter((n) => n.available)
  }

  return NextResponse.json({
    success: true,
    count: list.length,
    nurses: list,
  })
}
