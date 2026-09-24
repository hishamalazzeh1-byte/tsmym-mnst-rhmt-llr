import { NextResponse } from 'next/server'
import { DEMO_BOOKINGS } from '@/lib/data'
import type { SessionBooking } from '@/lib/types'

// In-memory sessions store initialized with demo data
let sessionsStore: SessionBooking[] = [...DEMO_BOOKINGS]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nurseId = searchParams.get('nurseId')
  const status = searchParams.get('status')

  let filtered = sessionsStore

  if (nurseId) {
    filtered = filtered.filter((s) => s.nurseId === nurseId)
  }
  if (status) {
    filtered = filtered.filter((s) => s.status === status)
  }

  return NextResponse.json({
    success: true,
    total: filtered.length,
    sessions: filtered,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.patientName || !body.patientPhone || !body.nurseId || !body.service) {
      return NextResponse.json(
        { success: false, message: 'بيانات الحجز غير مكتملة، يرجى ملء كافة الحقول الإلزامية.' },
        { status: 400 },
      )
    }

    // توليد رمز التحقق الرقمي المكون من 4 أرقام
    const completionCode = Math.floor(1000 + Math.random() * 9000).toString()

    const newSession: SessionBooking = {
      id: `s-${Date.now().toString().slice(-4)}`,
      patientName: body.patientName,
      patientPhone: body.patientPhone,
      nurseId: body.nurseId,
      nurseName: body.nurseName || 'ممرض معتمد',
      service: body.service,
      serviceId: body.serviceId,
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || 'زيارة فورية',
      status: 'confirmed',
      governorate: body.governorate || 'القاهرة',
      area: body.area || '',
      address: body.address || '',
      coordinates: body.coordinates,
      completionCode,
      verificationCode: completionCode,
      arrivalConfirmed: false,
      platformCommission: 10,
      commissionDeducted: false,
    }

    sessionsStore = [newSession, ...sessionsStore]

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء طلب الزيارة التمريضية وتوليد رمز التحقق بنجاح.',
      session: newSession,
      completionCode,
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 },
    )
  }
}
