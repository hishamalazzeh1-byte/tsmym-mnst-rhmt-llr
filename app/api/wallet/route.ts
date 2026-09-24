import { NextResponse } from 'next/server'
import { DEMO_NURSE_WALLET } from '@/lib/data'
import { PLATFORM_COMMISSION_PER_SESSION } from '@/lib/types'

let walletStore = { ...DEMO_NURSE_WALLET }

export async function GET() {
  return NextResponse.json({
    success: true,
    wallet: walletStore,
    commissionRule: {
      perSession: PLATFORM_COMMISSION_PER_SESSION,
      initialCredit: walletStore.initialWelcomeCredit,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const amount = Number(body.amount) || 100

    const nextBalance = walletStore.currentBalance + amount
    walletStore = {
      ...walletStore,
      currentBalance: nextBalance,
      remainingSessionsQuota: Math.floor(nextBalance / PLATFORM_COMMISSION_PER_SESSION),
      needsRecharge: false,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          date: 'الآن',
          type: 'welcome_credit',
          amount,
          description: `إيداع رصيد إداري للممرض (+${amount} ج.م)`,
          balanceAfter: nextBalance,
        },
        ...walletStore.transactions,
      ],
    }

    return NextResponse.json({
      success: true,
      message: `تم إضافة ${amount} جنيه إلى رصيد المحفظة بنجاح.`,
      wallet: walletStore,
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء معالجة الطلب.' },
      { status: 500 },
    )
  }
}
