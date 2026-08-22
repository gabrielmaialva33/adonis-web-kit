import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'

import File from '#modules/files/models/file'
import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import Tenant from '#modules/tenants/models/tenant'
import User from '#modules/users/models/user'

test.group('File management', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should list only the active workspace and allow owners to delete their own files', async ({
    client,
    assert,
    cleanup,
  }) => {
    const userRole = await Role.findByOrFail('slug', IRole.Slugs.USER)
    const owner = await User.create({
      full_name: 'File Owner',
      email: 'file-owner@example.com',
      username: 'file-owner',
      password: 'password123',
    })
    const teammate = await User.create({
      full_name: 'File Teammate',
      email: 'file-teammate@example.com',
      username: 'file-teammate',
      password: 'password123',
    })
    await owner.related('roles').attach([userRole.id])
    await teammate.related('roles').attach([userRole.id])

    const workspace = await Tenant.create({
      name: 'File Workspace',
      slug: 'file-workspace',
      is_active: true,
    })
    const otherWorkspace = await Tenant.create({
      name: 'Other Workspace',
      slug: 'other-file-workspace',
      is_active: true,
    })
    await owner.related('tenants').attach({ [workspace.id]: { role: 'owner' } })
    await teammate.related('tenants').attach({ [workspace.id]: { role: 'member' } })

    const disk = drive.use()
    const ownKey = `uploads/own-${randomUUID()}.txt`
    const teammateKey = `uploads/teammate-${randomUUID()}.txt`
    const otherKey = `uploads/other-${randomUUID()}.txt`
    const keys = [ownKey, teammateKey, otherKey]
    cleanup(async () => {
      await Promise.all(keys.map((key) => disk.delete(key)))
    })

    await Promise.all(keys.map((key) => disk.put(key, Buffer.from(key))))

    const ownFile = await File.create({
      owner_id: owner.id,
      tenant_id: workspace.id,
      client_name: 'own-file',
      file_name: ownKey,
      file_size: 128,
      file_type: 'text/plain',
      file_category: 'file',
      url: `/uploads/${ownKey}`,
    })
    const teammateFile = await File.create({
      owner_id: teammate.id,
      tenant_id: workspace.id,
      client_name: 'teammate-file',
      file_name: teammateKey,
      file_size: 256,
      file_type: 'text/plain',
      file_category: 'file',
      url: `/uploads/${teammateKey}`,
    })
    await File.create({
      owner_id: owner.id,
      tenant_id: otherWorkspace.id,
      client_name: 'other-workspace-file',
      file_name: otherKey,
      file_size: 512,
      file_type: 'text/plain',
      file_category: 'file',
      url: `/uploads/${otherKey}`,
    })

    const list = await client
      .get('/api/v1/files')
      .header('x-tenant-id', String(workspace.id))
      .loginAs(owner)

    list.assertStatus(200)
    assert.equal(list.body().meta.total, 2)
    assert.sameMembers(
      list.body().data.map((file: { id: number }) => file.id),
      [ownFile.id, teammateFile.id]
    )

    const foreignDelete = await client
      .delete(`/api/v1/files/${teammateFile.id}`)
      .header('x-tenant-id', String(workspace.id))
      .loginAs(owner)
    foreignDelete.assertStatus(403)
    assert.isNotNull(await File.find(teammateFile.id))

    const ownDelete = await client
      .delete(`/api/v1/files/${ownFile.id}`)
      .header('x-tenant-id', String(workspace.id))
      .loginAs(owner)
    ownDelete.assertStatus(204)
    assert.isNull(await File.find(ownFile.id))
  })

  test('should require authentication and an active workspace for listing files', async ({
    client,
  }) => {
    const unauthenticated = await client.get('/api/v1/files')
    unauthenticated.assertStatus(401)

    const user = await User.create({
      full_name: 'No Workspace',
      email: 'no-file-workspace@example.com',
      username: 'no-file-workspace',
      password: 'password123',
    })
    const userRole = await Role.findByOrFail('slug', IRole.Slugs.USER)
    await user.related('roles').attach([userRole.id])

    const withoutWorkspace = await client.get('/api/v1/files').loginAs(user)
    withoutWorkspace.assertStatus(400)
  })
})
