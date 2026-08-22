import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'

import File from '#modules/files/models/file'
import IPermission from '#modules/permissions/interfaces/permission_interface'
import Permission from '#modules/permissions/models/permission'
import PermissionService from '#modules/permissions/services/permission_service'
import Tenant from '#modules/tenants/models/tenant'
import User from '#modules/users/models/user'

test.group('Contextual permissions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should enforce ownership and deny unsupported contexts by default', async ({ assert }) => {
    const owner = await User.create({
      full_name: 'File Owner',
      email: 'file-owner@example.com',
      username: 'file-owner',
      password: 'password123',
    })
    const tenant = await Tenant.create({
      name: 'Context Workspace',
      slug: 'context-workspace',
      is_active: true,
    })
    const file = await File.create({
      owner_id: owner.id,
      tenant_id: tenant.id,
      client_name: 'context-file',
      file_name: 'uploads/context-file.txt',
      file_size: 10,
      file_type: 'text/plain',
      file_category: 'file',
      url: '/uploads/context-file.txt',
    })

    const ownPermission = await Permission.create({
      name: 'files.read.own',
      resource: IPermission.Resources.FILES,
      action: IPermission.Actions.READ,
      context: IPermission.Contexts.OWN,
    })
    const teamPermission = await Permission.create({
      name: 'files.read.team',
      resource: IPermission.Resources.FILES,
      action: IPermission.Actions.READ,
      context: IPermission.Contexts.TEAM,
    })

    await owner.related('permissions').attach({
      [ownPermission.id]: { granted: true, expires_at: null },
      [teamPermission.id]: { granted: true, expires_at: null },
    })

    const permissionService = await app.container.make(PermissionService)

    assert.isTrue(
      await permissionService.checkUserPermission({
        user_id: owner.id,
        permission: ownPermission.name,
        resource_id: file.id,
      })
    )
    assert.isFalse(
      await permissionService.checkUserPermission({
        user_id: owner.id,
        permission: ownPermission.name,
      })
    )
    assert.isFalse(
      await permissionService.checkUserPermission({
        user_id: owner.id,
        permission: teamPermission.name,
        resource_id: file.id,
      })
    )
  })
})
