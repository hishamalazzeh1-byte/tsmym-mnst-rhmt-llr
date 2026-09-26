/**
 * مسار الـ API نسبي عمداً.
 *
 * كان سابقاً رابطاً مطلقاً مع fallback إلى localhost، وهو سبب خطأ
 * "Failed to fetch" في الإنتاج: المتصفح يحاول الوصول إلى localhost
 * الجهاز الزائر (أو نطاق وهمي محروق في الحزمة).
 *
 * الآن المتصفح يستدعي /api/v1/... على نفس النطاق، وNext.js يمرّره
 * من جهة الخادم إلى الخادم الحقيقي (انظر rewrites في next.config.mjs).
 * النتيجة: لا CORS، ولا نطاق مثبّت، ولا إعادة بناء عند تغيّر العنوان.
 */
export const API_BASE = '/api/v1'

// للتشخيص فقط
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '(عبر وسيط Next.js)'

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

  // كل المستدعين يمرّرون المسار كاملاً ('/api/v1/...').
  // ندعم أيضاً مساراً نسبياً ('/nurses') بإضافة البادئة عند الحاجة.
  const url = path.startsWith('/') ? path : `${API_BASE}/${path}`

  let res: Response
  try {
    res = await fetch(url, { ...init, headers })
  } catch {
    // "Failed to fetch" الخام لا يوضّح شيئاً للمستخدم.
    throw new ApiError(
      'تعذر الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي، ومن ضبط BACKEND_ORIGIN في Vercel.',
      0,
    )
  }

  let data: any = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    throw new ApiError(data?.error || data?.message || `تعذر تنفيذ الطلب (${res.status})`, res.status)
  }
  return data as T
}
