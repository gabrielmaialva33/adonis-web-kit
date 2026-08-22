import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import Tenant from '#modules/tenants/models/tenant'
import TenantRepository from '#modules/tenants/repositories/tenant_repository'

export type CreateTenantPayload = {
  name: string
  slug?: string
}

@inject()
export default class CreateTenantService {
  constructor(private tenantRepository: TenantRepository) {}

  async run(
    userId: number,
    payload: CreateTenantPayload,
    client?: TransactionClientContract
  ): Promise<Tenant> {
    const slug = await this.resolveUniqueSlug(payload.slug ?? payload.name, client)
    const tenant = await this.tenantRepository.create(
      {
        name: payload.name.trim(),
        slug,
        is_active: true,
      },
      client ? { client } : undefined
    )

    await tenant.related('users').attach({ [userId]: { role: 'owner' } }, client)

    return tenant
  }

  private async resolveUniqueSlug(
    value: string,
    client?: TransactionClientContract
  ): Promise<string> {
    const base = this.slugify(value) || 'workspace'
    const existing = await Tenant.query({ client }).where('slug', base).first()

    if (!existing) {
      return base
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `${base}-${randomUUID().slice(0, 8)}`
      const collision = await Tenant.query({ client }).where('slug', candidate).first()
      if (!collision) {
        return candidate
      }
    }

    return `${base}-${randomUUID()}`
  }

  private slugify(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
  }
}
