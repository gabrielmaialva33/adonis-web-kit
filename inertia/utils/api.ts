import { router } from '@inertiajs/react'
import type { ApiErrorResponse } from '~/types'

export class ApiClient {
  private baseURL = '/api/v1'
  private readonly token?: string

  constructor(token?: string) {
    this.token = token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${path}`

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      // @ts-ignore
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorResponse
      throw new ApiError(error, response.status)
    }

    return response.json()
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  async post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  async upload<T>(path: string, file: File): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorResponse
      throw new ApiError(error, response.status)
    }

    return response.json()
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
    this.response.errors.forEach((error) => {
      if (error.field) {
        fieldErrors[error.field] = error.message
      }
    })
    return fieldErrors
  }
}

// Helper to handle Inertia navigation with proper types
export function navigate(url: string, options?: any) {
  router.visit(url, options)
}

// Helper to format dates
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Helper to format date and time
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
