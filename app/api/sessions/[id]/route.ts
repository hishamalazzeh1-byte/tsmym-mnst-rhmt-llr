import { NextResponse } from 'next/server'
import { DEMO_BOOKINGS } from '@/lib/data'
import { PLATFORM_COMMISSION_PER_SESSION, type SessionBooking } from '@/lib/types'

let sessionsStore: SessionBooking[] = [...DEMO_BOOKINGS]

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = sessionsStore.find((s) => s.id === id)

  if (!session) {
    return NextResponse.json(
      { success: false, message: 'الجلسة غير موجودة.' },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, session })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json()

  const sessionIndex = sessionsStore.findIndex((s) => s.id === id)
  if (sessionIndex === -1) {
    return NextResponse.json(
      { success: false, message: 'الجلسة غير موجودة.' },
      { status: 404 },
    )
  }

  const session = sessionsStore[sessionIndex]
  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })

  // 1. تأكيد الوصول إلى الموقع
  if (body.action === 'confirm_arrival') {
    sessionsStore[sessionIndex] = {
      ...session,
      status: 'nurse_arrived',
      arrivalConfirmed: true,
      arrivedAt: `اليوم ${now}`,
    }
    return NextResponse.json({
      success: true,
      message: 'تم تأكيد وصول الممرض إلى الموقع بنجاح.',
      session: sessionsStore[sessionIndex],
    })
  }

  // 2. إنهاء الجلسة من جانب الممرض
  if (body.action === 'nurse_complete') {
    sessionsStore[sessionIndex] = {
      ...session,
      status: 'completed_by_nurse',
      completedAt: `اليوم ${now}`,
      nurseNotes: body.nurseNotes || session.nurseNotes,
      vitalSigns: body.vitalSigns || session.vitalSigns,
    }
    return NextResponse.json({
      success: true,
      message: 'تم تسجيل إنهاء الجلسة، بانتظار إدخال رمز التحقق OTP.',
      session: sessionsStore[sessionIndex],
    })
  }

  // 3. تأكيد إتمام الجلسة برمز التحقق (OTP) وخصم 10 جنيه
  if (body.action === 'verify_otp') {
    if (body.code && body.code.trim() !== session.completionCode) {
      return NextResponse.json(
        { success: false, message: 'رمز التحقق الرقمي غير صحيح، يرجى كتابة الرمز المكون من 4 أرقام بدقة.' },
        { status: 400 },
      )
    }

    sessionsStore[sessionIndex] = {
      ...session,
      status: 'confirmed_completed',
      arrivalConfirmed: true,
      commissionDeducted: true,
      confirmedAt: `اليوم ${now}`,
    }

    return NextResponse.json({
      success: true,
      message: `تم توثيق الجلسة رسمياً وخصم ${PLATFORM_COMMISSION_PER_SESSION} جنيه عمولة المنصة تلقائياً.`,
      session: sessionsStore[sessionIndex],
    })
  }

  return NextResponse.json(
    { success: false, message: 'إجراء غير معروف.' },
    { status: 400 },
  )
}
