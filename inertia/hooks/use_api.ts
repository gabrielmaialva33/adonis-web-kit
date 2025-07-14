import { useCallback, useState } from 'react'
import { ApiClient, ApiError } from '~/utils/api'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const client = new ApiClient()

  const request = useCallback(async <T>(requestFn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await requestFn()
      return result
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err)
      } else {
        setError(new ApiError({ errors: [{ message: 'An unexpected error occurred' }] }, 500))
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    client,
    loading,
    error,
    request,
    clearError: () => setError(null),
  }
}
