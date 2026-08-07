import type { ApiErrorBody, ApiSuccess, AuthResult, LoginInput, RegisterInput, SafeUser } from '../types'

const API_BASE = '/api'

const ACCESS_TOKEN_KEY = 'eventos.accessToken'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

let refreshPromise: Promise<ApiSuccess<AuthResult>> | null = null

async function refreshAccessToken(): Promise<ApiSuccess<AuthResult>> {
  if (!refreshPromise) {
    refreshPromise = rawRequest<AuthResult>('/auth/refresh', { method: 'POST' }).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const { method = 'GET', body, auth = false } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiErrorBody | null

  if (!response.ok) {
    const message = payload && 'message' in payload ? payload.message : 'Something went wrong'
    throw new ApiError(message, response.status)
  }

  return payload as ApiSuccess<T>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  try {
    return await rawRequest<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && options.auth && !path.startsWith('/auth/refresh')) {
      try {
        const { data } = await refreshAccessToken()
        if (!data) throw error
        setAccessToken(data.accessToken)
        return await rawRequest<T>(path, options)
      } catch {
        setAccessToken(null)
        throw error
      }
    }
    throw error
  }
}

export const api = {
  register: (input: RegisterInput) =>
    request<SafeUser>('/auth/register', { method: 'POST', body: input }),

  login: (input: LoginInput) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: input }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  logoutAll: () => request<void>('/auth/logout-all', { method: 'POST', auth: true }),

  refresh: () => refreshAccessToken(),

  me: () => request<SafeUser>('/auth/me', { auth: true }),

  updateMe: (body: { firstName?: string; lastName?: string }) =>
    request<SafeUser>('/auth/me', { method: 'PATCH', body, auth: true }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<void>('/auth/change-password', { method: 'POST', body, auth: true }),

  verifyEmail: (token: string) =>
    request<SafeUser>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  forgotPassword: (email: string) =>
    request<void>('/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (token: string, password: string) =>
    request<void>('/auth/reset-password', { method: 'POST', body: { token, password } }),

  google: (credential: string) =>
    request<AuthResult & { isNewUser: boolean }>('/auth/google', { method: 'POST', body: { credential } }),
}
