import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'

import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'

import File from '#modules/files/models/file'
import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import Tenant from '#modules/tenants/models/tenant'
import User from '#modules/users/models/user'

async function createMember(withRole = true) {
  const id = randomUUID()
  const user = await User.create({
    full_name: 'File Security Member',
    email: `${id}@example.com`,
    username: id,
    password: 'password123',
  })
  if (withRole) {
    const role = await Role.findByOrFail('slug', IRole.Slugs.USER)
    await user.related('roles').attach([role.id])
  }
  const tenant = await Tenant.create({ name: 'Private files', slug: id, is_active: true })
  await user.related('tenants').attach({ [tenant.id]: { role: 'member' } })
  return { user, tenant }
}

async function createFile(owner: User, tenant: Tenant, key: string) {
  return File.create({
    owner_id: owner.id,
    tenant_id: tenant.id,
    client_name: 'private-note',
    file_name: key,
    file_size: 12,
    file_type: 'text/plain',
    file_category: 'file',
  })
}

test.group('Private workspace files', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('does not serve stored files through the old public route', async ({ client, cleanup }) => {
    const key = `uploads/private-${randomUUID()}.txt`
    const disk = drive.use()
    cleanup(() => disk.delete(key))
    await disk.put(key, Buffer.from('private data'))

    const response = await client.get(`/uploads/${key}`)
    response.assertStatus(404)
  })

  test('lists authorized download links instead of legacy public URLs', async ({
    client,
    assert,
  }) => {
    const { user, tenant } = await createMember()
    const file = await createFile(user, tenant, `uploads/${randomUUID()}.txt`)
    const response = await client.get('/api/v1/files').loginAs(user)
    response.assertStatus(200)
    assert.equal(response.body().data[0].url, `/api/v1/files/${tenant.id}/${file.id}/download`)
  })

  test('uploads private objects and returns an authenticated download link', async ({
    client,
    assert,
    cleanup,
  }) => {
    const { user, tenant } = await createMember()
    await mkdir(app.tmpPath(), { recursive: true })
    const source = app.tmpPath(`private-${randomUUID()}.txt`)
    cleanup(() => rm(source, { force: true }))
    cleanup(async () => {
      const files = await File.query().where('owner_id', user.id)
      await Promise.all(files.map((file) => drive.use().delete(file.file_name)))
    })
    await writeFile(source, 'private data')
    const uploaded = await client
      .post('/api/v1/files/upload')
      .withCsrfToken()
      .file('file', source)
      .loginAs(user)
    uploaded.assertStatus(201)
    const file = await File.findByOrFail('owner_id', user.id)
    assert.equal(uploaded.body().url, `/api/v1/files/${tenant.id}/${file.id}/download`)
    assert.equal(await drive.use().getVisibility(file.file_name), 'private')
    const downloaded = await client.get(uploaded.body().url).loginAs(user)
    downloaded.assertStatus(200)
    assert.equal(downloaded.text(), 'private data')
    const anonymous = await client.get(uploaded.body().url)
    anonymous.assertStatus(401)
  })

  test('downloads from the linked workspace even when another workspace is active', async ({
    client,
    assert,
    cleanup,
  }) => {
    const { user, tenant } = await createMember()
    const another = await Tenant.create({ name: 'Other', slug: randomUUID(), is_active: true })
    await user.related('tenants').attach({ [another.id]: { role: 'member' } })
    const key = `uploads/${randomUUID()}.txt`
    cleanup(() => drive.use().delete(key))
    await drive.use().put(key, Buffer.from('private data'))
    const file = await createFile(user, tenant, key)
    const response = await client
      .get(`/api/v1/files/${tenant.id}/${file.id}/download`)
      .header('x-tenant-id', String(another.id))
      .loginAs(user)
    response.assertStatus(200)
    assert.equal(response.text(), 'private data')
    response.assertHeader('cache-control', 'private, no-store')
    response.assertHeader('x-content-type-options', 'nosniff')
    assert.include(response.header('content-disposition'), 'attachment;')
  })

  test('rejects missing authentication, permission, and foreign or inactive membership', async ({
    client,
  }) => {
    const { user, tenant } = await createMember()
    const file = await createFile(user, tenant, `uploads/${randomUUID()}.txt`)
    const url = `/api/v1/files/${tenant.id}/${file.id}/download`
    const response1 = await client.get(url)
    response1.assertStatus(401)

    const noPermission = await createMember(false)
    await noPermission.user.related('tenants').attach({ [tenant.id]: { role: 'member' } })
    const response2 = await client.get(url).loginAs(noPermission.user)
    response2.assertStatus(403)

    const outsider = await createMember()
    const response3 = await client.get(url).loginAs(outsider.user)
    response3.assertStatus(403)

    await user.related('tenants').detach([tenant.id])
    const response4 = await client.get(url).loginAs(user)
    response4.assertStatus(403)
    await user.related('tenants').attach({ [tenant.id]: { role: 'member' } })
    tenant.is_active = false
    await tenant.save()
    const response5 = await client.get(url).loginAs(user)
    response5.assertStatus(403)
  })

  test('does not resolve a file under a different tenant or a missing storage object', async ({
    client,
  }) => {
    const { user, tenant } = await createMember()
    const another = await Tenant.create({ name: 'Other', slug: randomUUID(), is_active: true })
    await user.related('tenants').attach({ [another.id]: { role: 'member' } })
    const file = await createFile(user, tenant, `uploads/${randomUUID()}.txt`)
    const wrongTenant = await client
      .get(`/api/v1/files/${another.id}/${file.id}/download`)
      .loginAs(user)
    wrongTenant.assertStatus(404)
    const missingObject = await client
      .get(`/api/v1/files/${tenant.id}/${file.id}/download`)
      .loginAs(user)
    missingObject.assertStatus(404)
  })

  test('keeps files listable after their owner is soft deleted', async ({ client, assert }) => {
    const { user: owner, tenant } = await createMember()
    const { user: reader } = await createMember()
    await reader.related('tenants').attach({ [tenant.id]: { role: 'member' } })
    const file = await createFile(owner, tenant, `uploads/${randomUUID()}.txt`)
    owner.is_deleted = true
    await owner.save()

    const response = await client
      .get('/api/v1/files')
      .header('x-tenant-id', String(tenant.id))
      .loginAs(reader)
    response.assertStatus(200)
    assert.equal(response.body().data[0].id, file.id)
    assert.isNull(response.body().data[0].owner)
    assert.isNotNull(await File.find(file.id))
  })
})
