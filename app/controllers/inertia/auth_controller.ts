import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { signInValidator } from '#validations/users_validator'
import UsersRepository from '#repositories/users_repository'

export default class InertiaAuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  async login(ctx: HttpContext) {
    const { request, response, session, auth } = ctx
    const { uid, password } = await request.validateUsing(signInValidator)

    try {
      // Verify credentials using the repository directly
      const usersRepository = await app.container.make(UsersRepository)
      const user = await usersRepository.verifyCredentials(uid, password)

      // Use the JWT guard to generate and set the token as cookie
      await auth.use('jwt').generate(user)

      // Redirect to dashboard after successful login
      return response.redirect('/dashboard')
    } catch (error) {
      session.flash('errors', { general: error.message })
      return response.redirect().back()
    }
  }
}
