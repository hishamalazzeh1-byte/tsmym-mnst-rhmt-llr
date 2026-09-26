import { apiRequest } from './api'
import type { NurseWallet } from './types'

export interface UserSession {
  id: string
  name: string
  phone: string
  email?: string
  role: 'patient' | 'nurse' | 'admin'
  nationalId?: string
  credit: number
  isAuthenticated: boolean
  token?: string
  createdAt: string
}

const STORAGE_KEY = 'rahma_user_session'

export async function apiSendOtp(phone: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await apiRequest<{ success: boolean; message?: string }>('/api/v1/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
    return { success: true, message: data.message }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'فشل إرسال رمز التحقق' }
  }
}

export async function apiVerifyOtp(
  phone: string,
  otpCode: string,
): Promise<{ success: boolean; session?: UserSession; message?: string }> {
  try {
    const data = await apiRequest<{
      success: boolean
      token: string
      user: UserSession
      wallet?: { currentBalance?: number }
    }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otpCode }),
    })
    const session = saveUserSession({
      ...data.user,
      token: data.token,
      credit: data.wallet?.currentBalance ?? 0,
      isAuthenticated: true,
    })
    return { success: true, session }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'رمز التحقق غير صحيح' }
  }
}

export async function apiRegister(payload: Record<string, unknown>): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await apiRequest<{ success: boolean; message?: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return { success: true, message: data.message }
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'تعذر إنشاء الحساب' }
  }
}

export interface AuthProfile {
  user: {
    id: string
    name: string
    phone: string
    role: 'patient' | 'nurse' | 'admin'
    governorate?: string | null
    area?: string | null
  }
  wallet?: NurseWallet | null
}

/** يسحب الملف الحقيقي من الخادم ويزامن الجلسة المحلية (مصدر الحقيقة هو قاعدة البيانات) */
export async function apiFetchProfile(): Promise<AuthProfile | null> {
  try {
    const data = await apiRequest<AuthProfile>('/api/v1/auth/me')
    const wallet = data.wallet || null
    const synced = saveUserSession({
      id: data.user.id,
      name: data.user.name,
      phone: data.user.phone,
      role: data.user.role,
      credit: wallet?.currentBalance ?? 0,
      token: getUserSession()?.token,
      isAuthenticated: true,
    })
    return { user: { ...data.user, id: synced.id }, wallet }
  } catch {
    return null
  }
}

export function saveUserSession(session: Partial<UserSession>): UserSession {
  const existing = getUserSession()
  const updated: UserSession = {
    id: session.id || existing?.id || '',
    name: session.name || existing?.name || '',
    phone: session.phone || existing?.phone || '',
    email: session.email ?? existing?.email,
    role: session.role || existing?.role || 'patient',
    nationalId: session.nationalId ?? existing?.nationalId,
    credit: session.credit ?? existing?.credit ?? 0,
    isAuthenticated: true,
    token: session.token || existing?.token,
    createdAt: session.createdAt || existing?.createdAt || new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    document.cookie = `rahma_auth=true; path=/; max-age=31536000`
  }
  return updated
}

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.isAuthenticated && parsed?.id) return parsed as UserSession
  } catch {
    /* ignore */
  }
  return null
}

export function logoutUserSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  document.cookie = `rahma_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
