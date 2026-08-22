import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ForgotPasswordForm from '~/components/auth/forgot_password_form'
import ResetPasswordForm from '~/components/auth/reset_password_form'
import { render } from '~/tests/test_utils'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  pageProps: {} as Record<string, unknown>,
}))

vi.mock('@inertiajs/react', async () => {
  const React = await import('react')

  return {
    usePage: () => ({ props: mocks.pageProps }),
    useForm: <T extends Record<string, unknown>>(initial: T) => {
      const [data, setData] = React.useState<T>(initial)
      return {
        data,
        setData: (key: keyof T, value: unknown) =>
          setData((previous) => ({ ...previous, [key]: value })),
        post: mocks.post,
        processing: false,
        errors: {} as Record<string, string>,
      }
    },
  }
})

describe('Password reset forms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pageProps = {}
  })

  it('submits a privacy-preserving password reset request', async () => {
    mocks.pageProps = {
      flash: {
        success: 'If an account exists for that email, a password reset link has been sent.',
      },
    }
    const { user } = render(<ForgotPasswordForm />)

    expect(screen.getByText(/If an account exists/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset link' }))

    expect(mocks.post).toHaveBeenCalledWith('/forgot-password', { preserveScroll: true })
  })

  it('rejects a reset page without a token before submission', () => {
    render(<ResetPasswordForm token="" />)

    expect(screen.getByText(/missing its token/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset password' })).not.toBeInTheDocument()
  })

  it('submits a new password with the reset token', async () => {
    const { user } = render(<ResetPasswordForm token="opaque-reset-token-value-123456789" />)

    await user.type(screen.getByLabelText('New password'), 'new-password123')
    await user.type(screen.getByLabelText('Confirm new password'), 'new-password123')
    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(mocks.post).toHaveBeenCalledWith('/reset-password')
  })
})
