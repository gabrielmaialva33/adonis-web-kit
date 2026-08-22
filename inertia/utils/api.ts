import { router } from '@inertiajs/react'

import type { ApiErrorResponse } from '~/types'

export class ApiClient {
  private baseURL = import.meta.env.VITE_API_URL || '/api/v1'

  private getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    const headers = new Headers(options.headers)

    headers.set('Accept', 'application/json')
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      credentials: 'same-origin',
      ...options,
      headers,
    })

    if (!response.ok) {
      await this.handleUnauthorized(response)
      throw new ApiError(await this.parseError(response), response.status)
    }

    return this.parseSuccess<T>(response)
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  async post<T, Data = unknown>(path: string, data?: Data): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    })
  }

  async put<T, Data = unknown>(path: string, data?: Data): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
    })
  }

  async delete<T = void>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  async upload<T>(path: string, file: File): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>(path, {
      method: 'POST',
      body: formData,
    })
  }

  private async parseSuccess<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    return (await response.text()) as T
  }

  private async parseError(response: Response): Promise<ApiErrorResponse> {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as Partial<ApiErrorResponse> & {
        message?: string
      }
      if (Array.isArray(payload.errors)) {
        return { errors: payload.errors }
      }
      if (payload.message) {
        return { errors: [{ message: payload.message }] }
      }
    }

    return {
      errors: [
        {
          message: response.statusText || `Request failed with status ${response.status}`,
        },
      ],
    }
  }

  private async handleUnauthorized(response: Response): Promise<void> {
    if (response.status !== 401) {
      return
    }

    localStorage.removeItem('auth_token')
    await router.visit('/login')
  }
}

export class ApiError extends Error {
  constructor(
    public response: ApiErrorResponse,
    public status: number
  ) {
    super(response.errors[0]?.message || 'An error occurred')
    this.name = 'ApiError'
  }

  getFieldErrors(): Record<string, string> {
    const fieldErrors: Record<string, string> = {}

    for (const error of this.response.errors) {
      if (error.field) {
        fieldErrors[error.field] = error.message
      }
    }

    return fieldErrors
  }
}
