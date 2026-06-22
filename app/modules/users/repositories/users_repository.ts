import User from '#modules/users/models/user'

import type IUser from '#modules/users/interfaces/user_interface'
import LucidRepository from '#shared/lucid/lucid_repository'
import { type AccessToken } from '@adonisjs/auth/access_tokens'

export default class UsersRepository
  extends LucidRepository<typeof User>
  implements IUser.Repository
{
  constructor() {
    super(User)
  }

  async verifyCredentials(uid: string, password: string): Promise<User> {
    return this.model.verifyCredentials(uid, password)
  }

  /**
   * Load a user with direct permissions and roles (with their permissions)
   * preloaded. Returns null when not found.
   */
  async findByIdWithPermissionsAndRoles(userId: number): Promise<User | null> {
    return this.model
      .query()
      .where('id', userId)
      .preload('permissions')
      .preload('roles', (query) => {
        query.preload('permissions')
      })
      .first()
  }

  /**
   * Same as findByIdWithPermissionsAndRoles but throws when the user is missing
   * (mirrors the firstOrFail semantics used by the permission checks).
   */
  async findByIdWithPermissionsAndRolesOrFail(userId: number): Promise<User> {
    return this.model
      .query()
      .where('id', userId)
      .preload('roles', (query) => {
        query.preload('permissions')
      })
      .preload('permissions')
      .firstOrFail()
  }

  /**
   * Load a user with only the granted, non-expired direct permissions plus the
   * roles (with their permissions) preloaded. Used by the optimized permission
   * resolution path.
   */
  async findByIdWithActivePermissions(userId: number): Promise<User | null> {
    return this.model
      .query()
      .where('id', userId)
      .preload('permissions', (query) => {
        query.where('granted', true)
        query.where((subQuery) => {
          subQuery.whereNull('expires_at').orWhere('expires_at', '>', new Date())
        })
      })
      .preload('roles', (query) => {
        query.preload('permissions')
      })
      .first()
  }

  /**
   * Users created on or after the given SQL timestamp, selecting only the
   * created_at column (used to build the dashboard signup series).
   */
  async findCreatedSince(startSql: string): Promise<User[]> {
    return this.model.query().where('created_at', '>=', startSql).select('created_at')
  }

  /**
   * Most recently created users with their roles preloaded.
   */
  async listRecentWithRoles(limit: number): Promise<User[]> {
    return this.model.query().preload('roles').orderBy('created_at', 'desc').limit(limit)
  }

  /**
   * Find a user by the email verification token stored in metadata, ignoring
   * soft-deleted records.
   */
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.model
      .query()
      .whereRaw("metadata->>'email_verification_token' = ?", [token])
      .where('is_deleted', false)
      .first()
  }

  /**
   * Replace the user's direct permissions with the given pivot data.
   */
  async syncPermissions(user: User, syncData: IUser.PermissionPivotMap): Promise<void> {
    await user.related('permissions').sync(syncData)
  }

  /**
   * Return the pivot row for a user/permission pair, or null when not attached.
   */
  async findPermissionPivot(
    user: User,
    permissionId: number
  ): Promise<Record<string, unknown> | null> {
    return user.related('permissions').pivotQuery().where('permission_id', permissionId).first()
  }

  /**
   * Update the pivot row for an already attached permission.
   */
  async updatePermissionPivot(
    user: User,
    permissionId: number,
    pivotData: IUser.PermissionPivotData
  ): Promise<void> {
    await user
      .related('permissions')
      .pivotQuery()
      .where('permission_id', permissionId)
      .update(pivotData)
  }

  /**
   * Attach a single permission to the user with the given pivot data.
   */
  async attachPermission(
    user: User,
    permissionId: number,
    pivotData: IUser.PermissionPivotData
  ): Promise<void> {
    await user.related('permissions').attach({
      [permissionId]: pivotData,
    })
  }

  /**
   * Detach the given permissions from the user.
   */
  async detachPermissions(user: User, permissionIds: number[]): Promise<void> {
    await user.related('permissions').detach(permissionIds)
  }

  async generateAccessToken(userId: number, abilities?: string[]): Promise<AccessToken> {
    const user = await this.model.findByOrFail({ id: userId })
    return this.model.accessTokens.create(user, abilities, {
      name: `access_token:${user.id}:${user.email}`,
    })
  }

  async generateRefreshToken(userId: number, abilities?: string[]): Promise<AccessToken> {
    const user = await this.model.findByOrFail({ id: userId })
    return this.model.refreshTokens.create(user, abilities, {
      name: `refresh_token:${user.id}:${user.email}`,
    })
  }
}
