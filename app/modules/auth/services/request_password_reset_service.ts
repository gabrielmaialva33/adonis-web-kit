import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'

import PasswordResetNotification from '#modules/auth/services/password_reset_notification'
import PasswordResetTokenService from '#modules/auth/services/password_reset_token_service'
import UsersRepository from '#modules/users/repositories/users_repository'

@inject()
export default class RequestPasswordResetService {
  constructor(
    private usersRepository: UsersRepository,
    private passwordResetTokenService: PasswordResetTokenService
  ) {}

  async run(email: string): Promise<void> {
    const user = await this.usersRepository.findBy('email', email.trim().toLowerCase())
    if (!user) {
      return
    }

    const { token, expiresAt } = await this.passwordResetTokenService.issue(user.id)

    try {
      await mail.send(new PasswordResetNotification(user, token, expiresAt))
    } catch (error) {
      HttpContext.get()?.logger.error(
        { error, userId: user.id },
        'Failed to deliver password reset email'
      )
    }
  }
}
