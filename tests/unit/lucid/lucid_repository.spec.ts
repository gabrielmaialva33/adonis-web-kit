import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'

import Tenant from '#modules/tenants/models/tenant'
import TenantRepository from '#modules/tenants/repositories/tenant_repository'

test.group('LucidRepository', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should preserve false as a legitimate lookup value', async ({ assert }) => {
    await Tenant.create({ name: 'Active', slug: 'repository-active', is_active: true })
    const inactive = await Tenant.create({
      name: 'Inactive',
      slug: 'repository-inactive',
      is_active: false,
    })
    const repository = await app.container.make(TenantRepository)

    const result = await repository.findBy('is_active', false)

    assert.equal(result?.id, inactive.id)
  })

  test('should reject unknown sort keys before building the query', async ({ assert }) => {
    const repository = await app.container.make(TenantRepository)

    await assert.rejects(
      () => repository.paginate({ sortBy: 'not_a_column' }),
      /Invalid sort key: not_a_column/
    )
  })
})
