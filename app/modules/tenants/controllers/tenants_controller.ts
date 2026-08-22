import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

import BadRequestException from '#exceptions/bad_request_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import JwtAuthTokensService from '#modules/auth/services/jwt_auth_tokens_service'
import CreateTenantService from '#modules/tenants/services/create_tenant_service'
import { createTenantValidator } from '#modules/tenants/validators/tenant_validator'

@inject()
export default class TenantsController {
  constructor(
    private jwtAuthTokensService: JwtAuthTokensService,
    private createTenantService: CreateTenantService
  ) {}

  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const tenants = await user.related('tenants').query().orderBy('tenants.id', 'asc')

    const data = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      is_active: tenant.is_active,
      role: tenant.$extras.pivot_role as string,
    }))

    return response.ok({ data })
  }

  async create({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTenantValidator)
    const tenant = await this.createTenantService.run(user.id, payload)
    const tokens = await this.jwtAuthTokensService.run({ userId: user.id, tenantId: tenant.id })

    return response.created({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: 'owner',
      },
      auth: tokens,
    })
  }

  async switch({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const tenantId = Number(request.input('tenant_id'))

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      throw new BadRequestException('tenant_id is required and must be a positive integer')
    }

    const tenant = await user
      .related('tenants')
      .query()
      .where('tenants.id', tenantId)
      .where('tenants.is_active', true)
      .first()

    if (!tenant) {
      throw new ForbiddenException('You do not belong to this active tenant')
    }

    const tokens = await this.jwtAuthTokensService.run({ userId: user.id, tenantId: tenant.id })

    return response.ok({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: tenant.$extras.pivot_role as string,
      },
      auth: tokens,
    })
  }
}
