import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import Permission from '#modules/permissions/models/permission'
import { getDefaultPermissionNames } from '#modules/permissions/services/create_default_permissions_service'
import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import User from '#modules/users/models/user'

const userPermissionNames = [
  'dashboard.read',
  'files.create',
  'files.delete.own',
  'files.list',
  'files.read',
  'tenants.create',
  'tenants.list',
  'tenants.read',
]

test.group('Database bootstrap', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should keep migration defaults aligned with the runtime permission catalog', async ({
    assert,
  }) => {
    const permissions = await Permission.query().orderBy('name', 'asc')
    const actualPermissionNames = permissions.map((permission) => permission.name)
    const expectedPermissionNames = [...getDefaultPermissionNames()].sort()

    assert.deepEqual(actualPermissionNames, expectedPermissionNames)

    const root = await Role.findByOrFail('slug', IRole.Slugs.ROOT)
    await root.load('permissions')
    assert.sameMembers(
      root.permissions.map((permission) => permission.name),
      expectedPermissionNames
    )

    const user = await Role.findByOrFail('slug', IRole.Slugs.USER)
    await user.load('permissions')
    assert.sameMembers(
      user.permissions.map((permission) => permission.name),
      userPermissionNames
    )
  })

  test('should enforce canonical RBAC uniqueness constraints', async ({ assert }) => {
    const user = await User.create({
      full_name: 'Constraint User',
      email: 'constraint-user@example.com',
      username: 'constraint-user',
      password: 'password123',
    })
    const role = await Role.findByOrFail('slug', IRole.Slugs.USER)
    await user.related('roles').attach([role.id])

    await assert.rejects(() =>
      db.transaction(async (client) => {
        await client.table('user_roles').insert({
          user_id: user.id,
          role_id: role.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
      })
    )

    const fileDeletePermissions = await Permission.query()
      .where('resource', 'files')
      .where('action', 'delete')
    assert.sameMembers(
      fileDeletePermissions.map((permission) => permission.context),
      ['any', 'own']
    )

    await assert.rejects(() =>
      db.transaction(async (client) => {
        await client.table('permissions').insert({
          name: 'files.delete.duplicate-own',
          description: 'Duplicate contextual permission',
          resource: 'files',
          action: 'delete',
          context: 'own',
          created_at: new Date(),
          updated_at: new Date(),
        })
      })
    )
  })
})
