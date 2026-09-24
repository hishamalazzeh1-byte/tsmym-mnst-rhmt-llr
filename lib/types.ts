export type Gender = 'male' | 'female'

export type ServiceId =
  | 'post-op'
  | 'wound-care'
  | 'injections'
  | 'newborn'
  | 'physio'
  | 'elderly'
  | 'emergency'

export interface ServiceCategory {
  id: ServiceId
  title: string
  description: string
  icon: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface NurseLocation {
  governorate: string
  area: string
  address?: string
  coordinates?: Coordinates
  liveTrackingEnabled?: boolean
}

export interface Nurse {
  id: string
  name: string
  gender: Gender
  title: string
  specialties: ServiceId[]
  governorate: string
  area: string
  coverageGovernorates?: string[]
  coordinates?: Coordinates
  rating: number
  reviews: number
  experienceYears: number
  verified: boolean
  available: boolean
  bio: string
  languages: string[]
  completedSessionsCount?: number
  walletBalance?: number // الرصيد الحالي للممرض
}

export type SessionStatus =
  | 'pending'
  | 'confirmed'
  | 'nurse_en_route'
  | 'nurse_arrived'
  | 'in_progress'
  | 'completed_by_nurse'
  | 'confirmed_completed'
  | 'cancelled'

export interface SessionBooking {
  id: string
  patientName: string
  patientPhone: string
  nurseId: string
  nurseName: string
  service: string
  serviceId?: ServiceId
  date: string
  time: string
  status: SessionStatus
  address: string
  governorate: string
  area: string
  coordinates?: Coordinates
  completionCode: string // رمز التحقق الرقمي (OTP) لتأكيد إنهاء الجلسة
  verificationCode?: string // كود تأكيد وصول وتنفيذ الجلسة
  arrivalConfirmed?: boolean // تأكيد وصول الممرض إلى موقع المريض
  arrivedAt?: string // وقت تأكيد الوصول
  platformCommission: number // عمولة التطبيق للشركة (10 جنيه مصري تخصم من رصيد الممرض)
  commissionDeducted?: boolean // هل تم خصم الـ 10 ج.م من رصيد الممرض
  completedAt?: string
  confirmedAt?: string
  nurseNotes?: string
  vitalSigns?: {
    pulse?: string
    bloodPressure?: string
    temperature?: string
    glucose?: string
  }
}

// للتوافق مع الأكواد السابقة
export type Booking = SessionBooking

export interface MedicalRecord {
  id: string
  title: string
  type: 'تحليل' | 'أشعة' | 'تقرير' | 'روشتة'
  date: string
  encrypted: boolean
}

// ============================================================================
// النظام المالي والعمولات
// ============================================================================

// عمولة التطبيق الثابتة للشركة عن كل جلسة يتم إنهاء تنفيذها وتأكيدها
export const PLATFORM_COMMISSION_PER_SESSION = 10 // 10 جنيه مصري

// الرصيد المبدئي الترحيبي الممنوح لكل ممرض جديد عند التسجيل (يكفي لـ 10 جلسات)
export const NURSE_INITIAL_WELCOME_CREDIT = 100 // 100 جنيه مصري

// للتوافق مع المراجع السابقة
export const NURSE_COMMISSION_PER_SESSION = PLATFORM_COMMISSION_PER_SESSION

export interface WalletTransaction {
  id: string
  date: string
  type: 'welcome_credit' | 'session_commission_deduction' | 'wallet_recharge'
  amount: number
  description: string
  sessionId?: string
  balanceAfter: number
}

export interface NurseWallet {
  nurseId: string
  nurseName: string
  initialWelcomeCredit: number // 100 EGP
  currentBalance: number // الرصيد الحالي المتبقي
  completedSessionsCount: number // عدد الجلسات المنفذة والمؤكدة
  totalCommissionDeducted: number // إجمالي العمولات المخصومة (completedSessionsCount * 10)
  remainingSessionsQuota: number // عدد الجلسات المتبقية في الرصيد (currentBalance / 10)
  needsRecharge: boolean // هل يحتاج شحن (الرصيد أقل من 10 ج.م)
  transactions: WalletTransaction[]
}
