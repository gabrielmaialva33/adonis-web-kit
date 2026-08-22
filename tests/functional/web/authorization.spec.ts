import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import redis from '@adonisjs/redis/services/main'

import IPermission from '#modules/permissions/interfaces/permission_interface'
import Permission from '#modules/permissions/models/permission'
import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import User from '#modules/users/models/user'

test.group('Web authorization', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(async () => {
    await redis.flushdb()
  })

  async function createUserWithPermissions(permissionIds: number[]) {
    const user = await User.create({
      full_name: 'Limited User',
      email: 'limited-web@example.com',
      username: 'limited-web',
      password: 'password123',
    })
    const role = await Role.findByOrFail('slug', IRole.Slugs.GUEST)

    await role.related('permissions').sync(permissionIds)
    await user.related('roles').sync([role.id])

    return user
  }

  test('users.list should not grant create, update, edit or delete access', async ({ client }) => {
    const listPermission = await Permission.query()
      .where('resource', IPermission.Resources.USERS)
      .where('action', IPermission.Actions.LIST)
      .where('context', IPermission.Contexts.ANY)
      .firstOrFail()
    const user = await createUserWithPermissions([listPermission.id])

    const list = await client.get('/users').loginAs(user)
    list.assertStatus(200)

    const create = await client.post('/users').withCsrfToken().loginAs(user).json({
      full_name: 'Unauthorized Create',
      email: 'unauthorized-create@example.com',
      username: 'unauthorized-create',
      password: 'password123',
      password_confirmation: 'password123',
    })
    create.assertStatus(403)

    const edit = await client.get(`/users/${user.id}/edit`).loginAs(user)
    edit.assertStatus(403)

    const update = await client
      .put(`/users/${user.id}`)
      .withCsrfToken()
      .loginAs(user)
      .json({ full_name: 'Unauthorized Update' })
    update.assertStatus(403)

    const destroy = await client.delete(`/users/${user.id}`).withCsrfToken().loginAs(user)
    destroy.assertStatus(403)
  })

  test('dashboard should require dashboard.read', async ({ client }) => {
    const listPermission = await Permission.query()
      .where('resource', IPermission.Resources.USERS)
      .where('action', IPermission.Actions.LIST)
      .where('context', IPermission.Contexts.ANY)
      .firstOrFail()
    const user = await createUserWithPermissions([listPermission.id])

    const response = await client.get('/dashboard').loginAs(user)
    response.assertStatus(403)
  })

  test('dashboard.read should grant access without leaking unrelated privileges', async ({
    client,
  }) => {
    const dashboardPermission = await Permission.query()
      .where('resource', IPermission.Resources.DASHBOARD)
      .where('action', IPermission.Actions.READ)
      .where('context', IPermission.Contexts.ANY)
      .firstOrFail()
    const user = await createUserWithPermissions([dashboardPermission.id])

    const dashboard = await client.get('/dashboard').loginAs(user)
    dashboard.assertStatus(200)

    const users = await client.get('/users').loginAs(user)
    users.assertStatus(403)
  })
})
