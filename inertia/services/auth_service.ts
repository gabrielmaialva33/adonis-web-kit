/**
 * Authentication service for handling user authentication operations
 */

interface SignInCredentials {
  uid: string
  password: string
}

interface SignUpData {
  full_name: string
  email: string
  password: string
  password_confirmation: string
}

interface User {
  id: number
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthResponse {
  user: User
  token?: string
  message?: string
}

export class AuthService {
  /**
   * Sign in a user with email/username and password
   */
  static async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    const response = await fetch('/api/v1/sessions/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to sign in')
    }

    return response.json()
  }

  /**
   * Register a new user
   */
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch('/api/v1/sessions/sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to sign up')
    }

    return response.json()
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ message: string }> {
    const response = await fetch('/api/v1/sessions/sign-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to sign out')
    }

    return response.json()
  }
}
