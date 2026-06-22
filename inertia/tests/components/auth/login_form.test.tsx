import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { LoginForm } from '~/components/auth/login_form'
import { render } from '~/tests/test_utils'

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }))

// Mock the inertia useForm hook with real local state so the controlled
// inputs actually update when the user types (the previous static mock left
// the inputs empty, which also blocked the required-field form submission).
vi.mock('@inertiajs/react', async () => {
  const React = await import('react')
  return {
    useForm: <T extends Record<string, unknown>>(initial: T) => {
      const [data, setData] = React.useState<T>(initial)
      return {
        data,
        setData: (key: keyof T, value: unknown) =>
          setData((prev) => ({ ...prev, [key]: value })),
        post: mockPost,
        processing: false,
        errors: {} as Record<string, string>,
      }
    },
    Link: ({
      href,
      children,
      className,
    }: {
      href: string
      children: React.ReactNode
      className?: string
    }) => (
      <a href={href} className={className}>
        {children}
      </a>
    ),
  }
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login form with all fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/Email or Username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/Forgot password\?/i)).toBeInTheDocument()
  })

  it('allows entering credentials', async () => {
    const { user } = render(<LoginForm />)

    const emailInput = screen.getByLabelText(/Email or Username/i)
    const passwordInput = screen.getByLabelText(/Password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('submits the form when the sign in button is clicked', async () => {
    const { user } = render(<LoginForm />)

    await user.type(screen.getByLabelText(/Email or Username/i), 'test@example.com')
    await user.type(screen.getByLabelText(/Password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /Sign in/i }))

    expect(mockPost).toHaveBeenCalledWith('/login')
  })

  it('shows the forgot password link', () => {
    render(<LoginForm />)

    const forgotPasswordLink = screen.getByText(/Forgot password\?/i)
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password')
  })
})
