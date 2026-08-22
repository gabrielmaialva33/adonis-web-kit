import { http, HttpResponse } from 'msw'

interface SignInBody {
  uid?: string
  password?: string
}

interface SignUpBody {
  email?: string
  password?: string
  full_name?: string
}

export const authHandlers = [
  // Mock login endpoint
  http.post('/api/v1/sessions/sign-in', async ({ request }) => {
    const body = (await request.json()) as SignInBody

    // Validate credentials
    if (body.uid === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        id: 1,
        email: 'test@example.com',
        username: 'test-user',
        full_name: 'Test User',
        email_verified: true,
        email_verified_at: '2023-01-01T00:00:00.000Z',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        auth: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
      })
    }

    // Return error for invalid credentials
    return new HttpResponse(
      JSON.stringify({
        message: 'Invalid credentials',
        errors: [
          {
            message: 'Invalid credentials',
          },
        ],
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }),

  // Mock register endpoint
  http.post('/api/v1/sessions/sign-up', async ({ request }) => {
    const body = (await request.json()) as SignUpBody

    // Validate required fields
    if (!body.email || !body.password || !body.full_name) {
      return new HttpResponse(
        JSON.stringify({
          message: 'Validation failed',
          errors: [
            {
              message: 'All fields are required',
            },
          ],
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Return success response
    const now = new Date().toISOString()
    return HttpResponse.json(
      {
        id: 2,
        email: body.email,
        username: null,
        full_name: body.full_name,
        email_verified: false,
        email_verified_at: null,
        created_at: now,
        updated_at: now,
        auth: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
      },
      { status: 201 }
    )
  }),

  // Mock logout endpoint
  http.post('/api/v1/sessions/logout', () => new HttpResponse(null, { status: 204 })),
]
