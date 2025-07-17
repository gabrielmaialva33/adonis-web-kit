import { usePage, router } from '@inertiajs/react'
import { useApi } from './use_api'
import type { User, LoginFormData, LoginResponse } from '~/types'

export function useAuth() {
  const { auth } = usePage().props as { auth?: { user?: User } }
  const { client, request, loading, error, clearError } = useApi()

  const login = async (data: LoginFormData) => {
    const response = await request(() => client.post<LoginResponse>('/sessions/sign-in', data))

    if (response) {
      localStorage.setItem('auth_token', response.token)
      router.visit('/dashboard')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    router.visit('/login')
  }

  return {
    user: auth?.user ?? null,
    isAuthenticated: !!auth?.user,
    login,
    logout,
    loading,
    error,
    clearError,
  }
}
