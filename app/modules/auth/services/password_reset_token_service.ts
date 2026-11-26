import { createHmac, randomBytes } from 'node:crypto'

import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import BadRequestException from '#exceptions/bad_request_exception'
import PasswordResetTokenRepository from '#modules/auth/repositories/password_reset_token_repository'
import RefreshTokenRepository from '#modules/auth/repositories/refresh_token_repository'
import User from '#modules/users/models/user'
import UsersRepository from '#modules/users/repositories/users_repository'
import env from '#start/env'

const PASSWORD_RESET_TOKEN_BYTES = 48

export type IssuedPasswordResetToken = {
  token: string
  expiresAt: DateTime
}

@inject()
export default class PasswordResetTokenService {
  constructor(
    private passwordResetTokenRepository: PasswordResetTokenRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private usersRepository: UsersRepository
  ) {}

  async issue(userId: number): Promise<IssuedPasswordResetToken> {
    return db.transaction(async (client) => {
      const user = await this.usersRepository.findForUpdate(userId, client)
      if (!user) throw new BadRequestException('Invalid or expired password reset token')
      const now = DateTime.now()
      const expiresAt = now.plus({ minutes: env.get('PASSWORD_RESET_TTL_MINUTES', 60) })
      const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url')

      await this.passwordResetTokenRepository.consumeActiveForUser(userId, client, now)
      await this.passwordResetTokenRepository.create(
        {
          user_id: userId,
          auth_version: user.auth_version,
          token_hash: this.hashToken(token),
          expires_at: expiresAt,
          consumed_at: null,
        },
        { client }
      )

      return { token, expiresAt }
    })
  }

  async consume(token: string, password: string): Promise<User> {
    const tokenHash = this.hashToken(token)

    const candidate = await this.passwordResetTokenRepository.findBy('token_hash', tokenHash)
    if (!candidate) throw new BadRequestException('Invalid or expired password reset token')
    return db.transaction(async (client) => {
      const user = await this.usersRepository.findForUpdate(candidate.user_id, client)
      const current = await this.passwordResetTokenRepository.findByHashForUpdate(tokenHash, client)
      const now = DateTime.now()

      if (
        !user ||
        !current ||
        current.auth_version !== user.auth_version ||
        current.consumed_at ||
        current.expires_at.toMillis() <= now.toMillis()
      ) {
        throw new BadRequestException('Invalid or expired password reset token')
      }

      user.useTransaction(client)
      user.password = password
      await user.save()

      current.useTransaction(client)
      current.consumed_at = now
      await current.save()

      await this.passwordResetTokenRepository.consumeActiveForUser(user.id, client, now)
      await this.refreshTokenRepository.revokeAllForUser(user.id, client, now)

      return user
    })
  }

  private hashToken(token: string): string {
    return createHmac('sha256', env.get('PASSWORD_RESET_SECRET', env.get('APP_KEY')))
      .update(token)
      .digest('hex')
  }
}
