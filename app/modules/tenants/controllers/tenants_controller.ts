import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

import JwtAuthTokensService from '#modules/auth/services/jwt_auth_tokens_service'
import ForbiddenException from '#exceptions/forbidden_exception'
import BadRequestException from '#exceptions/bad_request_exception'

@inject()
export default class TenantsController {
  constructor(private jwtAuthTokensService: JwtAuthTokensService) {}

  /**
   * Lists the tenants the authenticated user belongs to, including the user's
   * role inside each tenant (from the `user_tenants` pivot).
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const tenants = await user.related('tenants').query()

    const data = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      is_active: tenant.is_active,
      role: tenant.$extras.pivot_role as string,
    }))

    return response.ok({ data })
  }

  /**
   * Switches the active tenant: validates membership and mints a fresh token
   * pair carrying the requested tenant as the active one.
   */
  async switch({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const tenantIdInput: unknown = request.input('tenant_id')
    const tenantId = Number(tenantIdInput)

    if (!Number.isInteger(tenantId)) {
      throw new BadRequestException('tenant_id is required and must be an integer')
    }

    const tenant = await user.related('tenants').query().where('tenants.id', tenantId).first()
    if (!tenant) {
      throw new ForbiddenException('You do not belong to this tenant')
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
