import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import RequestPasswordResetService from '#modules/auth/services/request_password_reset_service'
import ResetPasswordService from '#modules/auth/services/reset_password_service'
import {
  requestPasswordResetValidator,
  resetPasswordValidator,
} from '#modules/auth/validators/session_validator'

@inject()
export default class PasswordResetController {
  constructor(
    private requestPasswordResetService: RequestPasswordResetService,
    private resetPasswordService: ResetPasswordService
  ) {}

  async forgot({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(requestPasswordResetValidator)
    await this.requestPasswordResetService.run(email)

    return response.accepted({
      message: 'If an account exists for that email, a password reset link has been sent.',
    })
  }

  async reset({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)
    await this.resetPasswordService.run(token, password)

    return response.ok({ message: 'Password reset successfully.' })
  }
}
