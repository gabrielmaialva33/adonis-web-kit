import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { signInValidator } from '#validations/users_validator'
import SignInService from '#services/users/sign_in_service'

export default class InertiaAuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  async login(ctx: HttpContext) {
    const { request, response, session } = ctx
    const { uid, password } = await request.validateUsing(signInValidator)

    try {
      const service = await app.container.make(SignInService)
      const payload = await service.run({ uid, password, ctx })

      // Store the token in session for the web interface
      session.put('authToken', payload.auth.access_token)

      // Redirect to dashboard after successful login
      return response.redirect('/dashboard')
    } catch (error) {
      session.flash('errors', { general: error.message })
      return response.redirect().back()
    }
  }
}
