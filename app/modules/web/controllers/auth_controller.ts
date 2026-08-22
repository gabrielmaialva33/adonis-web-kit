import { type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import AuthEventService from '#modules/auth/services/auth_event_service'
import SignInService from '#modules/auth/services/sign_in_service'
import SignUpService from '#modules/auth/services/sign_up_service'
import IRole from '#modules/roles/interfaces/role_interface'
import { createUserValidator, signInValidator } from '#modules/users/validators/users_validator'

export default class InertiaAuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register', {})
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
      const { user } = await signUpService.run(data, { issueApiTokens: false })

      await auth.use('jwt').generate(user)

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
