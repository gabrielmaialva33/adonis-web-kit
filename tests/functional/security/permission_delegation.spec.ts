import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#modules/users/models/user'
import Role from '#modules/roles/models/role'
import Permission from '#modules/permissions/models/permission'

test.group('Permission delegation boundary', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function delegatedActor() {
    const actor = await User.create({
      full_name: 'Delegated actor',
      email: 'delegated@example.com',
      password: 'password123',
    })
    const permission = await Permission.findByOrFail('name', 'permissions.update')
    await actor.related('permissions').attach({ [permission.id]: { granted: true } })
    return actor
  }

  test('permissions.update alone cannot self-grant a privilege the actor does not possess', async ({
    client,
    assert,
  }) => {
    const actor = await delegatedActor()
    const permission = await Permission.findByOrFail('name', 'users.delete')
    const response = await client
      .put('/api/v1/admin/users/permissions/sync')
      .loginAs(actor)
      .withCsrfToken()
      .json({ user_id: actor.id, permissions: [{ permission_id: permission.id, granted: true }] })
    response.assertStatus(403)
    await actor.load('permissions')
    assert.notInclude(
      actor.permissions.map((p) => p.id),
      permission.id
    )
  })

  for (const action of ['sync', 'attach', 'detach']) {
    test(`permissions.update alone cannot ${action} ROOT role permissions`, async ({
      client,
      assert,
    }) => {
      const actor = await delegatedActor()
      const rootRole = await Role.findByOrFail('slug', 'root')
      await rootRole.load('permissions')
      const before = rootRole.permissions.map((p) => p.id).sort()
      const response = await client
        .put(`/api/v1/admin/roles/permissions/${action}`)
        .loginAs(actor)
        .withCsrfToken()
        .json({ role_id: rootRole.id, permission_ids: [before[0]] })
      response.assertStatus(403)
      await rootRole.load('permissions')
      assert.deepEqual(rootRole.permissions.map((p) => p.id).sort(), before)
    })
  }
})
