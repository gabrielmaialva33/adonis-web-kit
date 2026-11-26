import { inject } from '@adonisjs/core'
import UserManagementPolicyService from '#modules/users/services/user_management_policy_service'
import SyncRolePermissionsService from '#modules/permissions/services/sync_role_permissions_service'
import SyncUserPermissionsService from '#modules/permissions/services/sync_user_permissions_service'

/** Actor-aware application boundary; raw sync services also serve trusted migrations. */
@inject()
export default class PermissionAssignmentService {
  constructor(
    private policy: UserManagementPolicyService,
    private roles: SyncRolePermissionsService,
    private users: SyncUserPermissionsService
  ) {}

  async syncRole(actorId: number, roleId: number, permissionIds: number[]) {
    await this.policy.assertCanManagePermissions(actorId)
    await this.roles.handle(roleId, permissionIds)
  }

  async attachRole(actorId: number, roleId: number, permissionIds: number[]) {
    await this.policy.assertCanManagePermissions(actorId)
    await this.roles.attachPermissions(roleId, permissionIds)
  }

  async detachRole(actorId: number, roleId: number, permissionIds: number[]) {
    await this.policy.assertCanManagePermissions(actorId)
    await this.roles.detachPermissions(roleId, permissionIds)
  }

  async syncUser(
    actorId: number,
    userId: number,
    permissions: Parameters<SyncUserPermissionsService['handle']>[1]
  ) {
    await this.policy.assertCanManagePermissions(actorId)
    await this.users.handle(userId, permissions)
  }
}
