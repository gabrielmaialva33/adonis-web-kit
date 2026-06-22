import { type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { signInValidator, createUserValidator } from '#modules/users/validators/users_validator'
import UsersRepository from '#modules/users/repositories/users_repository'
import SignUpService from '#modules/auth/services/sign_up_service'

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
      // Verify credentials using the repository directly
      const usersRepository = await app.container.make(UsersRepository)
      const user = await usersRepository.verifyCredentials(uid, password)

      // Use the JWT guard to generate and set the token as cookie
      await auth.use('jwt').generate(user)

      // Redirect to dashboard after successful login
      return response.redirect('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid credentials'
      session.flash('errors', { general: message })
      return response.redirect().back()
    }
  }

  async register(ctx: HttpContext) {
    const { request, response, session } = ctx

    try {
      const data = await request.validateUsing(createUserValidator)

      // Use the SignUpService to create the user
      const signUpService = await app.container.make(SignUpService)
      await signUpService.run(data)

      // SignUpService already handles JWT generation and login

      // Redirect to dashboard after successful registration
      return response.redirect('/dashboard')
    } catch (error) {
      // Handle validation errors
      if (error && typeof error === 'object' && 'messages' in error) {
        session.flash('errors', error.messages as Record<string, unknown>)
      } else {
        const message = error instanceof Error ? error.message : 'Registration failed'
        session.flash('errors', { general: message })
      }
      return response.redirect().back()
    }
  }
}
