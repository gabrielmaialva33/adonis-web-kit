import type LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import { type AccessToken } from '@adonisjs/auth/access_tokens'
import type User from '#modules/users/models/user'

namespace IUser {
  export interface Repository extends LucidRepositoryInterface<typeof User> {
    /**
     * Verify user credentials and return the user
     * @param uid
     * @param password
     */
    verifyCredentials(uid: string, password: string): Promise<User>

    /**
     * Generate an access token for the user with the given abilities
     * @param userId
     * @param abilities
     */
    generateAccessToken(userId: number, abilities?: string[]): Promise<AccessToken>

    /**
     * Generate a refresh token for the user with the given abilities
     * @param userId
     * @param abilities
     */
    generateRefreshToken(userId: number, abilities?: string[]): Promise<AccessToken>

    findByIdWithPermissionsAndRoles(userId: number): Promise<User | null>

    findByIdWithPermissionsAndRolesOrFail(userId: number): Promise<User>

    findByIdWithActivePermissions(userId: number): Promise<User | null>

    findCreatedSince(startSql: string): Promise<User[]>

    listRecentWithRoles(limit: number): Promise<User[]>

    findByEmailVerificationToken(token: string): Promise<User | null>

    syncPermissions(user: User, syncData: PermissionPivotMap): Promise<void>

    findPermissionPivot(user: User, permissionId: number): Promise<Record<string, unknown> | null>

    updatePermissionPivot(
      user: User,
      permissionId: number,
      pivotData: PermissionPivotData
    ): Promise<void>

    attachPermission(
      user: User,
      permissionId: number,
      pivotData: PermissionPivotData
    ): Promise<void>

    detachPermissions(user: User, permissionIds: number[]): Promise<void>
  }

  export interface PermissionPivotData {
    granted: boolean
    expires_at: string | null
  }

  export type PermissionPivotMap = Record<number, PermissionPivotData>

  export interface CreatePayload {
    full_name: string
    email: string
    username?: string
    password: string
  }

  export interface EditPayload {
    full_name?: string
    email?: string
    username?: string
    password?: string
  }
}

export default IUser
