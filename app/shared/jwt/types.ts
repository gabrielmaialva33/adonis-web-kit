import { type symbols } from '@adonisjs/auth'
import type { JwtPayload, SignOptions } from 'jsonwebtoken'

/**
 * Adapter between an AdonisJS user provider and the custom JWT guard.
 */
export type JwtGuardUser<RealUser> = {
  getId(): string | number | BigInt
  getOriginal(): RealUser
}

export interface JwtUserProviderContract<RealUser> {
  [symbols.PROVIDER_REAL_USER]: RealUser
  createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>>
  findById(identifier: string | number | BigInt): Promise<JwtGuardUser<RealUser> | null>
}

export type JwtContent = {
  userId: string | number
  tenantId?: number
}

export type AccessTokenPayload = JwtPayload &
  JwtContent & {
    token_use: 'access'
  }

export type JwtCookieOptions = {
  path: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
}

export type JwtGuardOptions<RealUser = unknown> = {
  secret: string
  expiresIn?: SignOptions['expiresIn']
  issuer?: string
  audience?: string
  useCookies?: boolean
  cookieName?: string
  cookieOptions?: JwtCookieOptions
  content?: (user: JwtGuardUser<RealUser>) => Record<string, unknown>
}
