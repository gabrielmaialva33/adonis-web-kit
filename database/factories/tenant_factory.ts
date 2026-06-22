import factory from '@adonisjs/lucid/factories'
import { type FactoryContextContract } from '@adonisjs/lucid/types/factory'

import Tenant from '#modules/tenants/models/tenant'

export const TenantFactory = factory
  .define(Tenant, async ({ faker }: FactoryContextContract) => {
    const name = faker.company.name()
    return {
      name,
      slug: `${faker.helpers.slugify(name).toLowerCase()}-${faker.string.alphanumeric(6).toLowerCase()}`,
      is_active: true,
    }
  })
  .build()
