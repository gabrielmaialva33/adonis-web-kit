import { type symbols } from '@adonisjs/auth'
import type { SignOptions } from 'jsonwebtoken'

/**
 * The bridge between the User provider and the
 * Guard
 */
export type JwtGuardUser<RealUser> = {
  /**
   * Returns the unique ID of the user
   */
  getId(): string | number | BigInt

  /**
   * Returns the original user object
   */
  getOriginal(): RealUser
}

/**
 * The interface for the UserProvider accepted by the
 * JWT guard.
 */
export interface JwtUserProviderContract<RealUser> {
  /**
   * A property the guard implementation can use to infer
   * the data type of the actual user (aka RealUser)
   */
  [symbols.PROVIDER_REAL_USER]: RealUser

  /**
   * Create a user object that acts as an adapter between
   * the guard and real user value.
   */
  createUserForGuard(user: RealUser): Promise<JwtGuardUser<RealUser>>

  /**
   * Find a user by their id.
   */
  findById(identifier: string | number | BigInt): Promise<JwtGuardUser<RealUser> | null>
}

export type BaseJwtContent = {
  userId: string | number | BigInt
  /**
   * The active tenant for this token. Optional: a user may have no tenant yet,
   * and tokens minted by `authenticateAsClient` (Japa `loginAs`) omit it — in
   * that case the tenant middleware falls back to the user's first tenant.
   */
  tenantId?: number
}

export type JwtGuardOptions<RealUser extends any = unknown> = {
  secret: string
  expiresIn?: SignOptions['expiresIn']
  useCookies?: boolean
  content?: (user: JwtGuardUser<RealUser>) => Record<string, any>
}
