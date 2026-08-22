import { type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import AuthEventService from '#modules/auth/services/auth_event_service'
import RequestPasswordResetService from '#modules/auth/services/request_password_reset_service'
import ResetPasswordService from '#modules/auth/services/reset_password_service'
import SignInService from '#modules/auth/services/sign_in_service'
import SignUpService from '#modules/auth/services/sign_up_service'
import {
  requestPasswordResetValidator,
  resetPasswordValidator,
} from '#modules/auth/validators/session_validator'
import IRole from '#modules/roles/interfaces/role_interface'
import { createUserValidator, signInValidator } from '#modules/users/validators/users_validator'

export default class InertiaAuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register', {})
  }

  async showForgotPassword({ inertia }: HttpContext) {
    return inertia.render('auth/forgot_password', {})
  }

  async forgotPassword({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(requestPasswordResetValidator)
    const service = await app.container.make(RequestPasswordResetService)
    await service.run(email)

    session.flash(
      'success',
      'If an account exists for that email, a password reset link has been sent.'
    )
    return response.redirect().back()
  }

  async showResetPassword({ request, inertia }: HttpContext) {
    return inertia.render('auth/reset_password', {
      token: String(request.input('token', '')),
    })
  }

  async resetPassword({ request, response, session }: HttpContext) {
    try {
      const { token, password } = await request.validateUsing(resetPasswordValidator)
      const service = await app.container.make(ResetPasswordService)
      await service.run(token, password)

      session.flash('success', 'Password reset successfully. You can now sign in.')
      return response.redirect().toPath('/login')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password'
      session.flash('errors', { general: message })
      return response.redirect().back()
    }
  }

  async login(ctx: HttpContext) {
    const { request, response, session, auth } = ctx
    const { uid, password } = await request.validateUsing(signInValidator)

    try {
      const signInService = await app.container.make(SignInService)
      const result = await signInService.run({ uid, password, ctx }, { issueApiTokens: false })

      await auth
        .use('jwt')
        .generate(result.user, result.activeTenantId ? { tenantId: result.activeTenantId } : {})

      return response.redirect('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid credentials'
      session.flash('errors', { general: message })
      return response.redirect().back()
    }
  }

  async register(ctx: HttpContext) {
    const { request, response, session, auth } = ctx

    try {
      const data = await request.validateUsing(createUserValidator)
      const signUpService = await app.container.make(SignUpService)
      const { user, activeTenantId, emailVerificationSent } = await signUpService.run(data, {
        issueApiTokens: false,
      })

      await auth.use('jwt').generate(user, activeTenantId ? { tenantId: activeTenantId } : {})
      if (!emailVerificationSent) {
        session.flash(
          'error',
          'Your account was created, but the verification email could not be delivered. Try resending it later.'
        )
      }

      const isAdmin = user.roles.some((role) =>
        [IRole.Slugs.ADMIN, IRole.Slugs.ROOT].includes(role.slug)
      )
      AuthEventService.emitLoginSucceeded(user, 'password', isAdmin, ctx)

      return response.redirect('/dashboard')
    } catch (error) {
      if (error && typeof error === 'object' && 'messages' in error) {
        session.flash('errors', error.messages as Record<string, unknown>)
      } else {
        const message = error instanceof Error ? error.message : 'Registration failed'
        session.flash('errors', { general: message })
      }
      return response.redirect().back()
    }
  }

  async logout(ctx: HttpContext) {
    const user = ctx.auth.user ?? null
    ctx.auth.use('jwt').clearCookie()
    AuthEventService.emitLogout(user, ctx)

    return ctx.response.redirect('/')
  }
}
