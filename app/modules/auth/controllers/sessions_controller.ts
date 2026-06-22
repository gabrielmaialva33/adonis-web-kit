import { type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { createUserValidator, signInValidator } from '#modules/users/validators/users_validator'
import SignInService from '#modules/auth/services/sign_in_service'
import SignUpService from '#modules/auth/services/sign_up_service'

export default class SessionsController {
  async signIn(ctx: HttpContext) {
    const { request, response } = ctx
    const { uid, password } = await request.validateUsing(signInValidator)

    try {
      const service = await app.container.make(SignInService)
      const payload = await service.run({ uid, password, ctx })
      return response.json(payload)
    } catch (error) {
      return response.badRequest({
        errors: [
          {
            message: error instanceof Error ? error.message : 'Invalid credentials',
          },
        ],
      })
    }
  }

  async signUp({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)

    const service = await app.container.make(SignUpService)
    const userWithAuth = await service.run(payload)

    return response.created(userWithAuth)
  }
}
