import { inject } from '@adonisjs/core'

import PermissionCacheService from '#modules/permissions/services/permission_cache_service'
import PermissionInheritanceService from '#modules/permissions/services/permission_inheritance_service'

import Permission from '#modules/permissions/models/permission'
import UsersRepository from '#modules/users/repositories/users_repository'

import IPermission from '#modules/permissions/interfaces/permission_interface'
import OwnershipService from '#shared/services/ownership_service'

@inject()
export default class PermissionService {
  constructor(
    private cacheService: PermissionCacheService,
    private inheritanceService: PermissionInheritanceService,
    private usersRepository: UsersRepository,
    private ownershipService: OwnershipService
  ) {}

  /**
   * Check user permission with caching and inheritance
   */
  async checkUserPermission(data: IPermission.PermissionCheck): Promise<boolean> {
    const {
      user_id: userId,
      permission,
      requireAll = false,
      context,
      resource_id: resourceId,
    } = data

    // Handle single permission
    if (typeof permission === 'string') {
      return await this.checkSinglePermission(userId, permission, context, resourceId)
    }

    // Handle multiple permissions
    const results = await Promise.all(
      permission.map((p) => this.checkSinglePermission(userId, p, context, resourceId))
    )

    return requireAll ? results.every(Boolean) : results.some(Boolean)
  }

  /**
   * Batch check permissions for multiple users
   */
  async batchCheckPermissions(
    checks: Array<{
      userId: number
      permission: string
      context?: string
      resourceId?: number
    }>
  ): Promise<Array<{ userId: number; permission: string; granted: boolean }>> {
    const results = await Promise.all(
      checks.map(async (check) => {
        const granted = await this.checkSinglePermission(
          check.userId,
          check.permission,
          check.context,
          check.resourceId
        )

        return {
          userId: check.userId,
          permission: check.permission,
          granted,
        }
      })
    )

    return results
  }

  /**
   * Pre-warm cache for multiple users
   */
  async preWarmCache(userIds: number[]): Promise<void> {
    await Promise.all(userIds.map((userId) => this.cacheService.warmUpUserCache(userId)))
  }

  /**
   * Resolve effective permissions through direct grants, roles and inheritance.
   * The same cached path is shared by middleware and Inertia UI capabilities.
   */
  async getEffectivePermissions(userId: number): Promise<Permission[]> {
    const cachedPermissions = await this.cacheService.getCachedUserPermissions(userId)
    if (cachedPermissions) {
      return cachedPermissions
    }

    const permissions = await this.loadUserPermissionsOptimized(userId)
    await this.cacheService.cacheUserPermissions(userId, permissions)
    return permissions
  }

  async getEffectivePermissionNames(userId: number): Promise<string[]> {
    const permissions = await this.getEffectivePermissions(userId)
    return permissions.map((permission) => permission.name)
  }

  /**
   * Get user permission summary
   */
  async getUserPermissionSummary(userId: number): Promise<{
    directPermissions: Permission[]
    rolePermissions: Permission[]
    effectivePermissions: Permission[]
    roles: string[]
  }> {
    const user = await this.usersRepository.findByIdWithPermissionsAndRoles(userId)

    if (!user) {
      return {
        directPermissions: [],
        rolePermissions: [],
        effectivePermissions: [],
        roles: [],
      }
    }

    const directPermissions = user.permissions
    const rolePermissions = new Map<number, Permission>()
    const roles = user.roles.map((role) => role.slug)

    // Collect all role permissions with inheritance
    for (const role of user.roles) {
      const effectiveRolePermissions = await this.inheritanceService.getEffectivePermissions(
        role.slug
      )
      effectiveRolePermissions.forEach((permission) => {
        rolePermissions.set(permission.id, permission)
      })
    }

    const rolePermissionsList = Array.from(rolePermissions.values())

    // Combine all permissions
    const effectivePermissions = new Map<number, Permission>()
    directPermissions.forEach((p) => effectivePermissions.set(p.id, p))
    rolePermissionsList.forEach((p) => effectivePermissions.set(p.id, p))

    return {
      directPermissions,
      rolePermissions: rolePermissionsList,
      effectivePermissions: Array.from(effectivePermissions.values()),
      roles,
    }
  }

  /**
   * Check single permission for user
   */
  private async checkSinglePermission(
    userId: number,
    permission: string,
    context?: string,
    resourceId?: number
  ): Promise<boolean> {
    // Parse permission string (resource.action.context)
    const parts = permission.split('.')
    const resource = parts[0]
    const action = parts[1]
    const permissionContext = parts[2] || context || 'any'

    const userPermissions = await this.getEffectivePermissions(userId)
    const hasPermission = this.checkPermissionInList(
      userPermissions,
      resource,
      action,
      permissionContext
    )

    if (hasPermission) {
      return await this.checkContextualPermission(
        userId,
        resource,
        action,
        permissionContext,
        resourceId
      )
    }

    return false
  }

  /**
   * Load user permissions with optimized queries
   */
  private async loadUserPermissionsOptimized(userId: number): Promise<Permission[]> {
    const user = await this.usersRepository.findByIdWithActivePermissions(userId)

    if (!user) {
      return []
    }

    const allPermissions = new Map<number, Permission>()

    // Add direct user permissions
    user.permissions.forEach((permission) => {
      allPermissions.set(permission.id, permission)
    })

    // Add permissions from roles with inheritance
    for (const role of user.roles) {
      const effectivePermissions = await this.inheritanceService.getEffectivePermissions(role.slug)
      effectivePermissions.forEach((permission) => {
        allPermissions.set(permission.id, permission)
      })
    }

    return Array.from(allPermissions.values())
  }

  /**
   * Check if permission exists in list
   */
  private checkPermissionInList(
    permissions: Permission[],
    resource: string,
    action: string,
    context: string
  ): boolean {
    return permissions.some((permission) => {
      return (
        permission.resource === resource &&
        permission.action === action &&
        (permission.context === context || permission.context === 'any')
      )
    })
  }

  /**
   * Check contextual permission (ownership, etc.)
   */
  private async checkContextualPermission(
    userId: number,
    resource: string,
    action: string,
    context: string,
    resourceId?: number
  ): Promise<boolean> {
    if (context === IPermission.Contexts.ANY) {
      return true
    }

    if (context === IPermission.Contexts.OWN) {
      if (!resourceId) {
        return false
      }

      return this.ownershipService.checkOwnership({
        userId,
        resource,
        resourceId,
        action,
        context,
      })
    }

    // Team and department contexts are denied until a concrete domain policy is
    // registered. Unknown contextual permissions must never fail open.
    return false
  }
}
