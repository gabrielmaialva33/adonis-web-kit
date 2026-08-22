import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import BadRequestException from '#exceptions/bad_request_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import CreateTenantService from '#modules/tenants/services/create_tenant_service'
import { createTenantValidator } from '#modules/tenants/validators/tenant_validator'

/**
 * Switches the active browser tenant by reissuing the signed HTTP-only access
 * cookie through the JWT guard. The guard owns all security claims and cookie
 * options, preventing this controller from drifting from API authentication.
 */
@inject()
export default class InertiaTenantController {
  constructor(private createTenantService: CreateTenantService) {}

  async create({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createTenantValidator)
    const tenant = await this.createTenantService.run(user.id, payload)

    await auth.use('jwt').generate(user, { tenantId: tenant.id })
    session.flash('success', 'Workspace created successfully.')

    return response.redirect().toPath('/settings?tab=workspaces')
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

    await auth.use('jwt').generate(user, { tenantId: tenant.id })

    return response.redirect().back()
  }
}
