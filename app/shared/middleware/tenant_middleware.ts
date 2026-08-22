import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import BadRequestException from '#exceptions/bad_request_exception'
import ForbiddenException from '#exceptions/forbidden_exception'

type TenantMiddlewareOptions = {
  required?: boolean
}

/**
 * Resolves an active tenant and always verifies membership. RBAC remains global
 * in this starter kit; this middleware is responsible only for data scoping.
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: TenantMiddlewareOptions = {}) {
    const user = ctx.auth.user
    if (!user) {
      return next()
    }

    const requestedTenantId = this.resolveRequestedTenantId(ctx)

    if (requestedTenantId !== null) {
      const tenant = await user
        .related('tenants')
        .query()
        .where('tenants.id', requestedTenantId)
        .where('tenants.is_active', true)
        .first()

      if (!tenant) {
        const message =
          ctx.i18n?.t('errors.permission_denied') ||
          'The requested tenant is inactive or inaccessible'
        throw new ForbiddenException(message)
      }

      ctx.tenant = { id: tenant.id }
      return next()
    }

    const firstTenant = await user
      .related('tenants')
      .query()
      .where('tenants.is_active', true)
      .orderBy('tenants.id', 'asc')
      .first()

    if (firstTenant) {
      ctx.tenant = { id: firstTenant.id }
    } else if (options.required) {
      throw new BadRequestException('An active tenant is required for this operation')
    }

    return next()
  }

  private resolveRequestedTenantId(ctx: HttpContext): number | null {
    const headerTenantId = ctx.request.header('x-tenant-id')
    if (headerTenantId !== undefined) {
      const parsed = Number(headerTenantId)
      if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new BadRequestException('x-tenant-id must be a positive integer')
      }
      return parsed
    }

    const claimTenantId = ctx.auth.use('jwt').tokenPayload?.tenantId
    if (Number.isSafeInteger(claimTenantId) && claimTenantId! > 0) {
      return claimTenantId!
    }

    return null
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    tenant?: { id: number }
  }
}
