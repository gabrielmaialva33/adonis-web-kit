import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import BadRequestException from '#exceptions/bad_request_exception'
import NotFoundException from '#exceptions/not_found_exception'
import EmailVerificationTokenService from '#modules/auth/services/email_verification_token_service'
import type User from '#modules/users/models/user'
import UsersRepository from '#modules/users/repositories/users_repository'

@inject()
export default class VerifyEmailService {
  constructor(
    private usersRepository: UsersRepository,
    private tokenService: EmailVerificationTokenService
  ) {}

  async handle(token: string): Promise<User> {
    const { i18n } = HttpContext.getOrFail()
    const tokenHash = this.tokenService.hash(token)
    const user = await this.usersRepository.findByEmailVerificationTokenHash(tokenHash)

    if (!user) {
      throw new NotFoundException(i18n.t('errors.invalid_verification_token'))
    }

    if (user.metadata.email_verified) {
      throw new BadRequestException(i18n.t('errors.email_already_verified'))
    }

    if (user.metadata.email_verification_sent_at) {
      const sentAt = DateTime.fromISO(user.metadata.email_verification_sent_at)
      const expirationTime = sentAt.plus({ hours: 24 })
      if (!sentAt.isValid || DateTime.now() > expirationTime) {
        throw new BadRequestException(i18n.t('errors.verification_token_expired'))
      }
    }

    user.metadata.email_verified = true
    user.metadata.email_verified_at = DateTime.now().toISO()
    user.metadata.email_verification_token_hash = null
    user.metadata.email_verification_sent_at = null
    await user.save()

    return user
  }
}
