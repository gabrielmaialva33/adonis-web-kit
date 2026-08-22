import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'

import IPermission from '#modules/permissions/interfaces/permission_interface'
import Permission from '#modules/permissions/models/permission'
import PermissionService from '#modules/permissions/services/permission_service'
import SyncRolePermissionsService from '#modules/permissions/services/sync_role_permissions_service'
import SyncUserPermissionsService from '#modules/permissions/services/sync_user_permissions_service'
import type IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import SyncRolesService from '#modules/roles/services/sync_roles_service'
import User from '#modules/users/models/user'

test.group('Permission cache invalidation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function usersReadPermission() {
    return Permission.query()
      .where('resource', IPermission.Resources.USERS)
      .where('action', IPermission.Actions.READ)
      .where('context', IPermission.Contexts.ANY)
      .firstOrFail()
  }

  async function limitedUser() {
    const user = await User.create({
      full_name: 'Cached User',
      email: 'cached-user@example.com',
      username: 'cached-user',
      password: 'password123',
    })
    const limitedRole = await Role.create({
      name: 'Cache Limited',
      slug: 'cache-limited' as IRole.Slugs,
      description: 'Role without inherited or direct permissions',
    })
    await user.related('roles').sync([limitedRole.id])
    return { user, limitedRole }
  }

  test('should invalidate user caches after role permissions change', async ({ assert }) => {
    const permission = await usersReadPermission()
    const { user, limitedRole } = await limitedUser()
    const permissionService = await app.container.make(PermissionService)
    const syncRolePermissions = await app.container.make(SyncRolePermissionsService)

    assert.isFalse(
      await permissionService.checkUserPermission({
        user_id: user.id,
        permission: permission.name,
      })
    )

    await syncRolePermissions.attachPermissions(limitedRole.id, [permission.id])

    assert.isTrue(
      await permissionService.checkUserPermission({
        user_id: user.id,
        permission: permission.name,
      })
    )
  })

  test('should invalidate user caches after a role is attached', async ({ assert }) => {
    const permission = await usersReadPermission()
    const { user } = await limitedUser()
    const readerRole = await Role.create({
      name: 'Cache Reader',
      slug: 'cache-reader' as IRole.Slugs,
      description: 'Role with one direct permission',
    })
    await readerRole.related('permissions').sync([permission.id])

    const permissionService = await app.container.make(PermissionService)
    const syncRoles = await app.container.make(SyncRolesService)

    assert.isFalse(
      await permissionService.checkUserPermission({
        user_id: user.id,
        permission: permission.name,
      })
    )

    await syncRoles.run({ userId: user.id, roleIds: [readerRole.id] })

    assert.isTrue(
      await permissionService.checkUserPermission({
        user_id: user.id,
        permission: permission.name,
      })
    )
  })

  test('should invalidate user caches after a direct permission is attached', async ({
    assert,
  }) => {
    const permission = await usersReadPermission()
    const { user } = await limitedUser()
    const permissionService = await app.container.make(PermissionService)
    const syncUserPermissions = await app.container.make(SyncUserPermissionsService)

    assert.isFalse(
      await permissionService.checkUserPermission({
        user_id: user.id,
        permission: permission.name,
      })
    )

    await syncUserPermissions.attachPermission(user.id, permission.id)

    assert.isTrue(
      await permissionService.checkUserPermission({
        user_id: user.id,
        permission: permission.name,
      })
    )
  })
})
