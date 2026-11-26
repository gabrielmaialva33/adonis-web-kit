import { router } from '@inertiajs/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClient, ApiError } from '~/utils/api'

describe('ApiClient', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
    vi.unstubAllGlobals()
  })

  it('sends the decoded CSRF token for cookie-authenticated mutations including uploads', async () => {
    document.cookie = 'XSRF-TOKEN=csrf%3Dvalue; path=/'
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const client = new ApiClient()
    await client.post('/tenants', { name: 'Workspace' })
    await client.upload('/files/upload', new File(['test'], 'test.txt'))
    for (const [, init] of fetchMock.mock.calls) {
      expect((init?.headers as Headers).get('X-XSRF-TOKEN')).toBe('csrf=value')
    }
  })

  it('handles 204 responses without attempting to parse JSON', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const client = new ApiClient()

    await expect(client.delete('/users/1')).resolves.toBeUndefined()
  })

  it('does not set a JSON content type for multipart uploads', async () => {
    fetchMock.mockImplementation(async (_input, init) => {
      const headers = init?.headers as Headers
      expect(headers.has('Content-Type')).toBe(false)
      expect(init?.body).toBeInstanceOf(FormData)

      return new Response(JSON.stringify({ url: '/uploads/file.txt' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const client = new ApiClient()
    const file = new File(['content'], 'file.txt', { type: 'text/plain' })

    await expect(client.upload('/files/upload', file)).resolves.toEqual({
      url: '/uploads/file.txt',
    })
  })

  it('normalizes non-JSON failures into ApiError', async () => {
    fetchMock.mockResolvedValue(
      new Response('upstream unavailable', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'Content-Type': 'text/plain' },
      })
    )

    const client = new ApiClient()

    try {
      await client.get('/health')
      expect.fail('The request should fail')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 502, message: 'Bad Gateway' })
    }
  })

  it('clears stale local tokens and redirects after a 401', async () => {
    localStorage.setItem('auth_token', 'stale-token')
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: 'Unauthorized' }] }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const client = new ApiClient()

    await expect(client.get('/me')).rejects.toMatchObject({ status: 401 })
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(router.visit).toHaveBeenCalledWith('/login')
  })
})
