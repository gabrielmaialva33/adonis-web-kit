import { inject } from '@adonisjs/core'

import PasswordResetTokenService from '#modules/auth/services/password_reset_token_service'

@inject()
export default class ResetPasswordService {
  constructor(private passwordResetTokenService: PasswordResetTokenService) {}

  async run(token: string, password: string): Promise<void> {
    await this.passwordResetTokenService.consume(token, password)
  }
}
