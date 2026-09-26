import { apiRequest } from './api'
import type { Coordinates, MedicalRecord, Nurse, NurseWallet, SessionBooking } from './types'

export async function fetchNurses(filters?: { gov?: string; specialty?: string; available?: boolean }): Promise<Nurse[]> {
  const params = new URLSearchParams()
  if (filters?.gov && filters.gov !== 'all') params.set('gov', filters.gov)
  if (filters?.specialty && filters.specialty !== 'all') params.set('specialty', filters.specialty)
  if (filters?.available) params.set('available', 'true')
  const qs = params.toString()
  const data = await apiRequest<{ nurses: Nurse[] }>(`/api/v1/nurses${qs ? `?${qs}` : ''}`)
  return data.nurses || []
}

export async function fetchNurse(id: string): Promise<Nurse | null> {
  try {
    const data = await apiRequest<{ nurse: Nurse }>(`/api/v1/nurses/${id}`)
    return data.nurse
  } catch {
    return null
  }
}

export async function fetchSessions(): Promise<SessionBooking[]> {
  const data = await apiRequest<{ sessions: SessionBooking[] }>('/api/v1/sessions')
  return data.sessions || []
}

export async function fetchSession(id: string): Promise<SessionBooking | null> {
  try {
    const data = await apiRequest<{ session: SessionBooking }>(`/api/v1/sessions/${id}`)
    return data.session
  } catch {
    return null
  }
}

export async function createNewSession(payload: Partial<SessionBooking> & { notes?: string }): Promise<SessionBooking> {
  const data = await apiRequest<{ session: SessionBooking }>('/api/v1/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.session
}

export async function patchSession(
  id: string,
  action: string,
  extra: Record<string, unknown> = {},
): Promise<SessionBooking> {
  const data = await apiRequest<{ session: SessionBooking }>(`/api/v1/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action, ...extra }),
  })
  return data.session
}

export async function fetchWallet(nurseId: string): Promise<NurseWallet | null> {
  try {
    const data = await apiRequest<{ wallet: NurseWallet }>(`/api/v1/nurse/wallet/${nurseId}`)
    return data.wallet
  } catch {
    return null
  }
}

/**
 * لا تبتلع الأخطاء: الفشل يجب أن يظهر كخطأ صريح في الواجهة، لا كـ"قائمة
 * فارغة" تُقرأ قديماً على أنها "لا توجد سجلات طبية".
 */
export async function fetchRecords(): Promise<MedicalRecord[]> {
  const data = await apiRequest<{ records: MedicalRecord[] }>('/api/v1/records')
  return data.records || []
}

export async function creditNurseWallet(nurseId: string, amount: number): Promise<NurseWallet> {
  const data = await apiRequest<{ wallet: NurseWallet }>(`/api/v1/admin/wallets/${nurseId}/credit`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
  return data.wallet
}

export async function approveNurse(nurseId: string): Promise<Nurse> {
  const data = await apiRequest<{ nurse: Nurse }>(`/api/v1/admin/nurses/${nurseId}/approve`, {
    method: 'POST',
  })
  return data.nurse
}

export async function updateNurseAvailability(nurseId: string, available: boolean): Promise<Nurse> {
  const data = await apiRequest<{ nurse: Nurse }>(`/api/v1/nurses/${nurseId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ available }),
  })
  return data.nurse
}

export interface NurseLocationPayload {
  governorate?: string
  area?: string
  coverageGovernorates?: string[]
  coordinates?: Coordinates
}

export async function updateNurseLocation(
  nurseId: string,
  payload: NurseLocationPayload,
): Promise<Nurse> {
  const data = await apiRequest<{ nurse: Nurse }>(`/api/v1/nurses/${nurseId}/location`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.nurse
}

export async function fetchAdminNurses(): Promise<Nurse[]> {
  const data = await apiRequest<{ nurses: Nurse[] }>('/api/v1/admin/nurses')
  return data.nurses || []
}
