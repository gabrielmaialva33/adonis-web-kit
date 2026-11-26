import { createHmac, randomBytes, randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

import UnauthorizedException from '#exceptions/unauthorized_exception'
import RefreshTokenRepository from '#modules/auth/repositories/refresh_token_repository'
import UsersRepository from '#modules/users/repositories/users_repository'
import {
  API_ACCESS_TOKEN_EXPIRES_IN,
  JWT_AUDIENCE,
  JWT_ISSUER,
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_TTL_DAYS,
} from '#shared/jwt/constants'
import JwtService from '#shared/jwt/jwt_service'
import type { JwtContent } from '#shared/jwt/types'
import env from '#start/env'

export type GenerateAuthTokensResponse = {
  access_token: string
  refresh_token: string
}

type RefreshTokenIssueOptions = {
  client?: TransactionClientContract
  rotatedFromId?: number
}

@inject()
export default class JwtAuthTokensService {
  constructor(
    private jwtService: JwtService,
    private refreshTokenRepository: RefreshTokenRepository,
    private usersRepository: UsersRepository
  ) {}

  async run(payload: JwtContent): Promise<GenerateAuthTokensResponse> {
    return db.transaction(async (client) => {
      const user = await this.usersRepository.findForUpdate(Number(payload.userId), client)
      if (!user || payload.authVersion !== user.auth_version) {
        throw new UnauthorizedException('Credentials have changed')
      }
      const claims = { ...payload, authVersion: user.auth_version }
      return {
        access_token: await this.generateAccessToken(claims),
        refresh_token: await this.issueRefreshToken(claims, { client }),
      }
    })
  }

  /**
   * Atomically consumes a refresh token and returns a rotated token pair. Only
   * the HMAC of the opaque refresh token is persisted, so a database leak does
   * not expose reusable credentials.
   */
  async refresh(refreshToken: string): Promise<GenerateAuthTokensResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken)

    const candidate = await this.refreshTokenRepository.findBy('token_hash', tokenHash)
    if (!candidate) throw new UnauthorizedException('Invalid or expired refresh token')
    const result = await db.transaction(async (client) => {
      // All token issuance locks the user first, then the credential record.
      const user = await this.usersRepository.findForUpdate(candidate.user_id, client)
      const current = await this.refreshTokenRepository.findByHashForUpdate(tokenHash, client)
      const now = DateTime.now()

      if (!user || !current || current.auth_version !== user.auth_version) {
        return null
      }
      if (current.revoked_at) {
        // A replay indicates a stolen credential: invalidate every session in
        // this credential generation. Commit before returning the rejection.
        user.auth_version = randomUUID()
        await user.save()
        await this.refreshTokenRepository.revokeAllForUser(user.id, client, now)
        return null
      }

      if (current.expires_at.toMillis() <= now.toMillis()) return null

      current.useTransaction(client)
      current.revoked_at = now
      await current.save()

      const payload: JwtContent = {
        userId: user.id,
        authVersion: user.auth_version,
        tenantId: current.tenant_id ?? undefined,
      }

      const accessToken = await this.generateAccessToken(payload)
      const rotatedRefreshToken = await this.issueRefreshToken(payload, {
        client,
        rotatedFromId: current.id,
      })

      return {
        access_token: accessToken,
        refresh_token: rotatedRefreshToken,
      }
    })
    if (!result) throw new UnauthorizedException('Invalid or expired refresh token')
    return result
  }

  async revoke(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken)

    await db.transaction(async (client) => {
      const current = await this.refreshTokenRepository.findByHashForUpdate(tokenHash, client)
      if (!current || current.revoked_at) {
        return
      }

      current.useTransaction(client)
      current.revoked_at = DateTime.now()
      await current.save()
    })
  }

  private generateAccessToken(payload: JwtContent): Promise<string> {
    return this.jwtService.sign(
      {
        ...payload,
        sub: String(payload.userId),
        token_use: 'access',
      },
      env.get('ACCESS_TOKEN_SECRET', env.get('APP_KEY')),
      {
        expiresIn: API_ACCESS_TOKEN_EXPIRES_IN,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        jwtid: randomUUID(),
      }
    )
  }

  private async issueRefreshToken(
    payload: JwtContent,
    options: RefreshTokenIssueOptions = {}
  ): Promise<string> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url')

    await this.refreshTokenRepository.create(
      {
        user_id: Number(payload.userId),
        auth_version: payload.authVersion,
        tenant_id: payload.tenantId ?? null,
        token_hash: this.hashRefreshToken(token),
        expires_at: DateTime.now().plus({ days: REFRESH_TOKEN_TTL_DAYS }),
        revoked_at: null,
        rotated_from_id: options.rotatedFromId ?? null,
      },
      options.client ? { client: options.client } : undefined
    )

    return token
  }

  private hashRefreshToken(token: string): string {
    return createHmac('sha256', env.get('REFRESH_TOKEN_SECRET', env.get('APP_KEY')))
      .update(token)
      .digest('hex')
  }
}
