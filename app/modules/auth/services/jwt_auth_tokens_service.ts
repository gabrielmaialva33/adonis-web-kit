import { createHmac, randomBytes, randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

import UnauthorizedException from '#exceptions/unauthorized_exception'
import RefreshTokenRepository from '#modules/auth/repositories/refresh_token_repository'
import User from '#modules/users/models/user'
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
    private refreshTokenRepository: RefreshTokenRepository
  ) {}

  async run(payload: JwtContent): Promise<GenerateAuthTokensResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.issueRefreshToken(payload),
    ])

    return { access_token: accessToken, refresh_token: refreshToken }
  }

  /**
   * Atomically consumes a refresh token and returns a rotated token pair. Only
   * the HMAC of the opaque refresh token is persisted, so a database leak does
   * not expose reusable credentials.
   */
  async refresh(refreshToken: string): Promise<GenerateAuthTokensResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken)

    return db.transaction(async (client) => {
      const current = await this.refreshTokenRepository.findByHashForUpdate(tokenHash, client)
      const now = DateTime.now()

      if (!current || current.revoked_at || current.expires_at.toMillis() <= now.toMillis()) {
        throw new UnauthorizedException('Invalid or expired refresh token')
      }

      const user = await User.query({ client }).where('id', current.user_id).first()
      if (!user) {
        throw new UnauthorizedException('Invalid or expired refresh token')
      }

      current.useTransaction(client)
      current.revoked_at = now
      await current.save()

      const payload: JwtContent = {
        userId: user.id,
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
