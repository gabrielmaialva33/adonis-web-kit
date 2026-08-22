import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

import EmailVerificationTokenService from '#modules/auth/services/email_verification_token_service'
import VerifyEmailNotification from '#modules/auth/services/verify_email_notification'
import type User from '#modules/users/models/user'

@inject()
export default class SendVerificationEmailService {
  constructor(private tokenService: EmailVerificationTokenService) {}

  async handle(user: User): Promise<boolean> {
    const { token, tokenHash } = this.tokenService.generate()

    if (!user.metadata) {
      user.metadata = {
        email_verified: false,
        email_verification_token_hash: null,
        email_verification_sent_at: null,
        email_verified_at: null,
      }
    }

    user.metadata.email_verification_token_hash = tokenHash
    user.metadata.email_verification_sent_at = DateTime.now().toISO()
    await user.save()

    try {
      await mail.send(new VerifyEmailNotification(user, token))
      return true
    } catch (error) {
      HttpContext.get()?.logger.error(
        { error, userId: user.id },
        'Failed to deliver email verification message'
      )
      return false
    }
  }
}
