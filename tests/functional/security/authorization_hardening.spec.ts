import { test } from '@japa/runner'
import { mock } from 'node:test'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import redis from '@adonisjs/redis/services/main'
import User from '#modules/users/models/user'
import Role from '#modules/roles/models/role'
import Permission from '#modules/permissions/models/permission'
import PermissionService from '#modules/permissions/services/permission_service'
import PermissionCacheService from '#modules/permissions/services/permission_cache_service'
import AuditService from '#modules/audits/services/audit_service'
import type { HttpContext } from '@adonisjs/core/http'

test.group('Authorization hardening', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => mock.restoreAll())

  async function userWithRole(slug: string, suffix = slug) {
    const user = await User.create({
      full_name: suffix,
      email: `hardening-${suffix}@example.com`,
      password: 'password123',
    })
    const role = await Role.findByOrFail('slug', slug)
    await user.related('roles').attach([role.id])
    return user
  }

  for (const slug of ['root', 'admin']) {
    test(`ADMIN cannot delegate ${slug} to themselves`, async ({ client, assert }) => {
      const admin = await userWithRole('admin')
      const role = await Role.findByOrFail('slug', slug)
      const response = await client
        .put('/api/v1/admin/roles/attach')
        .loginAs(admin)
        .withCsrfToken()
        .json({
          user_id: admin.id,
          role_ids: [role.id],
        })
      response.assertStatus(403)
      await admin.load('roles')
      assert.deepEqual(
        admin.roles.map((r) => r.slug),
        ['admin']
      )
    })
  }

  for (const path of ['/api/v1/users', '/users']) {
    test(`ADMIN cannot change ROOT password through ${path}`, async ({ client, assert }) => {
      const admin = await userWithRole('admin')
      const root = await userWithRole('root')
      const previousPassword = root.password
      const response = await client.put(`${path}/${root.id}`).loginAs(admin).withCsrfToken().json({
        password: 'attackerPassword123',
        password_confirmation: 'attackerPassword123',
      })
      response.assertStatus(403)
      await root.refresh()
      assert.equal(root.password, previousPassword)
    })

    test(`ADMIN cannot delete ROOT through ${path}`, async ({ client, assert }) => {
      const admin = await userWithRole('admin')
      const root = await userWithRole('root')
      const response = await client.delete(`${path}/${root.id}`).loginAs(admin).withCsrfToken()
      response.assertStatus(403)
      assert.isNotNull(await User.find(root.id))
    })
  }

  test('ADMIN can delegate a lower role and ROOT can delegate ADMIN', async ({ client }) => {
    const admin = await userWithRole('admin')
    const root = await userWithRole('root')
    const target = await userWithRole('guest')
    for (const [actor, slug] of [
      [admin, 'editor'],
      [root, 'admin'],
    ] as const) {
      const role = await Role.findByOrFail('slug', slug)
      const response = await client
        .put('/api/v1/admin/roles/attach')
        .loginAs(actor)
        .json({
          user_id: target.id,
          role_ids: [role.id],
        })
      response.assertStatus(200)
    }
  })

  test('direct users.update permission does not authorize changing an ADMIN or ROOT account', async ({
    client,
    assert,
  }) => {
    const actor = await userWithRole('user')
    const permission = await Permission.findByOrFail('name', 'users.update')
    await actor.related('permissions').attach({ [permission.id]: { granted: true } })
    for (const slug of ['admin', 'root']) {
      const target = await userWithRole(slug)
      const response = await client
        .put(`/api/v1/users/${target.id}`)
        .loginAs(actor)
        .withCsrfToken()
        .json({ full_name: 'Taken over' })
      response.assertStatus(403)
      await target.refresh()
      assert.equal(target.full_name, slug)
    }
  })

  test('a permanent role grant remains valid after the same direct grant expires', async ({
    assert,
  }) => {
    const user = await userWithRole('user')
    const role = await Role.findByOrFail('slug', 'user')
    const permission = await Permission.create({
      name: 'special.permanent',
      resource: 'special',
      action: 'permanent',
      context: 'any',
    })
    await role.related('permissions').attach([permission.id])
    const expiresAt = Date.now() + 60_000
    await user
      .related('permissions')
      .attach({ [permission.id]: { granted: true, expires_at: new Date(expiresAt) } })
    const service = await app.container.make(PermissionService)
    assert.include(await service.getEffectivePermissionNames(user.id), permission.name)
    mock.method(Date, 'now', () => expiresAt + 1)
    assert.include(await service.getEffectivePermissionNames(user.id), permission.name)
  })

  test('a warm permission cache stops granting a temporary permission at expiry', async ({
    assert,
  }) => {
    const user = await User.create({
      full_name: 'Temporary User',
      email: 'temporary@example.com',
      password: 'password123',
    })
    const permission = await Permission.findByOrFail('name', 'users.delete')
    const expiresAt = Date.now() + 60_000
    await user.related('permissions').attach({
      [permission.id]: { granted: true, expires_at: new Date(expiresAt) },
    })
    const service = await app.container.make(PermissionService)
    assert.include(await service.getEffectivePermissionNames(user.id), permission.name)
    mock.method(Date, 'now', () => expiresAt + 1)
    assert.notInclude(await service.getEffectivePermissionNames(user.id), permission.name)
  })

  test('cache warmup excludes denied and expired direct grants and includes inheritance', async ({
    assert,
  }) => {
    const user = await userWithRole('editor')
    const expired = await Permission.create({
      name: 'special.expired',
      resource: 'special',
      action: 'expired',
      context: 'any',
    })
    const denied = await Permission.create({
      name: 'special.denied',
      resource: 'special',
      action: 'denied',
      context: 'any',
    })
    const inherited = await Permission.create({
      name: 'special.inherited',
      resource: 'special',
      action: 'inherited',
      context: 'any',
    })
    const userRole = await Role.findByOrFail('slug', 'user')
    await userRole.related('permissions').attach([inherited.id])
    await user.related('permissions').attach({
      [expired.id]: { granted: true, expires_at: new Date(Date.now() - 60_000) },
      [denied.id]: { granted: false },
    })
    const cache = await app.container.make(PermissionCacheService)
    await cache.warmUpUserCache(user.id)
    const service = await app.container.make(PermissionService)
    const names = await service.getEffectivePermissionNames(user.id)
    assert.notInclude(names, expired.name)
    assert.notInclude(names, denied.name)
    assert.include(names, inherited.name)
  })

  test('readiness fails when Redis is unavailable', async ({ client, assert }) => {
    mock.method(redis.connection(), 'ping', async () => {
      throw new Error('Redis unavailable')
    })
    const response = await client.get('/api/v1/health')
    response.assertStatus(503)
    assert.isFalse(response.body().healthy)
    assert.isFalse(response.body().services.redis.healthy)
  })

  test('audit redacts nested objects and arrays without changing the request', async ({
    assert,
  }) => {
    const service = await app.container.make(AuditService)
    const requestData = {
      profile: { password: 'private', label: 'kept' },
      items: [{ refreshToken: 'private', count: 2 }],
      values: ['ordinary', null],
    }
    const original = structuredClone(requestData)
    const ctx = {
      request: {
        ip: () => '127.0.0.1',
        header: () => undefined,
        method: () => 'POST',
        url: () => '/audit-test',
        all: () => requestData,
      },
      response: { getStatus: () => 200 },
    } as unknown as HttpContext
    const audit = await service.logPermissionCheck(
      {
        resource: 'test',
        action: 'read',
        result: 'granted',
        metadata: { nested: [{ secret: 'private', safe: true }] },
      },
      ctx
    )
    assert.deepEqual(audit.request_data, {
      profile: { password: '[REDACTED]', label: 'kept' },
      items: [{ refreshToken: '[REDACTED]', count: 2 }],
      values: ['ordinary', null],
    })
    assert.deepEqual(audit.metadata, { nested: [{ secret: '[REDACTED]', safe: true }] })
    assert.deepEqual(requestData, original)
  })
})
