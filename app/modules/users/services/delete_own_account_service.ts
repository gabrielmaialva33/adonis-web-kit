import { randomBytes, randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import BadRequestException from '#exceptions/bad_request_exception'
import PasswordResetTokenRepository from '#modules/auth/repositories/password_reset_token_repository'
import RefreshTokenRepository from '#modules/auth/repositories/refresh_token_repository'
import User from '#modules/users/models/user'
import UsersRepository from '#modules/users/repositories/users_repository'

export type DeleteOwnAccountPayload = {
  currentPassword: string
  confirmation: string
}

@inject()
export default class DeleteOwnAccountService {
  constructor(
    private usersRepository: UsersRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private passwordResetTokenRepository: PasswordResetTokenRepository
  ) {}

  async run(userId: number, payload: DeleteOwnAccountPayload): Promise<void> {
    if (payload.confirmation.trim().toUpperCase() !== 'DELETE') {
      throw new BadRequestException('Type DELETE to confirm account deletion')
    }

    try {
      const account = await User.findOrFail(userId)
      const verifiedUser = await this.usersRepository.verifyCredentials(
        account.email,
        payload.currentPassword
      )

      if (verifiedUser.id !== userId) {
        throw new Error('Credential mismatch')
      }
    } catch {
      throw new BadRequestException('The current password is incorrect')
    }

    await db.transaction(async (client) => {
      const user = await User.query({ client }).where('id', userId).forUpdate().firstOrFail()
      const now = DateTime.now()
      const tombstone = `${user.id}-${randomUUID()}`

      user.useTransaction(client)
      user.full_name = 'Deleted User'
      user.email = `deleted+${tombstone}@example.invalid`
      user.username = `deleted_${tombstone.replaceAll('-', '_')}`
      user.password = randomBytes(48).toString('base64url')
      user.metadata = {
        email_verified: false,
        email_verification_token_hash: null,
        email_verification_sent_at: null,
        email_verified_at: null,
      }
      user.is_deleted = true
      await user.save()

      await this.refreshTokenRepository.revokeAllForUser(userId, client, now)
      await this.passwordResetTokenRepository.consumeActiveForUser(userId, client, now)
      await client.from('auth_access_tokens').where('tokenable_id', userId).delete()
      await client.from('user_roles').where('user_id', userId).delete()
      await client.from('user_permissions').where('user_id', userId).delete()
    })
  }
}
