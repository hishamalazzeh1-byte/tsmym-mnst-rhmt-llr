export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function tokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('rahma_user_session')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token || null
  } catch {
    return null
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = tokenFromStorage()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers })
  let data: any = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    throw new ApiError(data?.error || data?.message || 'تعذر تنفيذ الطلب', res.status)
  }
  return data as T
}
