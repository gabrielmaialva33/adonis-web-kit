import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'

import ForbiddenException from '#exceptions/forbidden_exception'

/**
 * Resolves the active tenant for the request and validates that the
 * authenticated user is a member of it.
 *
 * Resolution order:
 *   1. `x-tenant-id` request header
 *   2. `tenantId` claim from the JWT (bearer header or `token` cookie)
 *   3. fallback: the user's first tenant (via the `user_tenants` pivot)
 *
 * Membership is always enforced: if a tenant is resolved but the authenticated
 * user does not belong to it, a ForbiddenException is thrown.
 *
 * If no tenant can be resolved (the user belongs to no tenant and none was
 * requested), the request is allowed through WITHOUT `ctx.tenant`. Routes that
 * truly require a tenant should account for `ctx.tenant` being undefined.
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth?.user
    if (!user) {
      // Should be paired with auth() before it; nothing to scope without a user.
      return next()
    }

    const resolvedTenantId = this.#resolveRequestedTenantId(ctx)

    if (resolvedTenantId !== null) {
      const isMember = await this.#isMember(user.id, resolvedTenantId)
      if (!isMember) {
        const message = ctx.i18n?.t('errors.permission_denied') || 'Access denied to this tenant'
        throw new ForbiddenException(message)
      }
      ctx.tenant = { id: resolvedTenantId }
      return next()
    }

    // Fallback: first tenant the user belongs to.
    const firstTenant = await user.related('tenants').query().first()
    if (firstTenant) {
      ctx.tenant = { id: firstTenant.id }
    }

    return next()
  }

  /**
   * Reads an explicitly requested tenant id from the header or the JWT claim.
   * Returns null when none is present.
   */
  #resolveRequestedTenantId(ctx: HttpContext): number | null {
    const headerTenantId = ctx.request.header('x-tenant-id')
    if (headerTenantId) {
      const parsed = Number(headerTenantId)
      return Number.isInteger(parsed) ? parsed : null
    }

    const claimTenantId = this.#tenantIdFromToken(ctx)
    return claimTenantId
  }

  /**
   * Decodes (without verifying — auth middleware already verified) the JWT to
   * read the `tenantId` claim. Token may come from the bearer header or the
   * `token` cookie.
   */
  #tenantIdFromToken(ctx: HttpContext): number | null {
    let token: string | undefined

    const authHeader = ctx.request.header('authorization')
    if (authHeader) {
      token = authHeader.split('Bearer ')[1]
    }

    if (!token) {
      const cookieToken = ctx.request.cookie('token')
      if (typeof cookieToken === 'string') {
        token = cookieToken
      }
    }

    if (!token) {
      return null
    }

    const payload: unknown = jwt.decode(token)
    if (
      payload &&
      typeof payload === 'object' &&
      'tenantId' in payload &&
      typeof (payload as { tenantId: unknown }).tenantId === 'number'
    ) {
      return (payload as { tenantId: number }).tenantId
    }

    return null
  }

  async #isMember(userId: number, tenantId: number): Promise<boolean> {
    const { default: db } = await import('@adonisjs/lucid/services/db')
    const row = await db
      .from('user_tenants')
      .where('user_id', userId)
      .where('tenant_id', tenantId)
      .first()
    return row !== null && row !== undefined
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    tenant: { id: number }
  }
}
