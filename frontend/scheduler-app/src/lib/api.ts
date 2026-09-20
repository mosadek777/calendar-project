import type { AppointmentRequest, AppointmentResponse, AuthResponse, EmailResult } from '@/lib/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5233'

export const TOKEN_KEY = 'scheduler.token'
export const EMAIL_KEY = 'scheduler.email'

/** Carries the server's own message so screens can show it instead of inventing one. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Called when the server rejects a call as unauthenticated. AuthContext registers
 * the real handler; until then, clearing storage is enough.
 */
let onUnauthorized: () => void = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Pulls the most useful message out of ProblemDetails or ValidationProblemDetails. */
function messageFrom(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback

  const problem = body as {
    detail?: string
    title?: string
    errors?: Record<string, string[]>
  }

  if (problem.errors) {
    const first = Object.values(problem.errors).flat()[0]
    if (first) return first
  }

  return problem.detail ?? problem.title ?? fallback
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  // An expired 8-hour token lands here. Clearing the session and returning the
  // person to sign-in is what FR-006 asks for — not a broken screen.
  if (response.status === 401 && token) {
    onUnauthorized()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const body = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(messageFrom(body, 'Something went wrong.'), response.status)
  }

  return body as T
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** One range call serves the month marks, the day panel, and today's agenda. */
  getRange: (from: string, to: string) =>
    request<AppointmentResponse[]>(`/api/appointments?from=${from}&to=${to}`),

  create: (body: AppointmentRequest) =>
    request<AppointmentResponse>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: AppointmentRequest) =>
    request<AppointmentResponse>(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    request<void>(`/api/appointments/${id}`, { method: 'DELETE' }),

  /** Sends the given day's schedule to the signed-in person's registered address. */
  emailDay: (date: string) =>
    request<EmailResult>(`/api/appointments/email-day?date=${date}`, { method: 'POST' }),
}
