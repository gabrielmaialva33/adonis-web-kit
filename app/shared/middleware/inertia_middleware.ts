import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

import PermissionService from '#modules/permissions/services/permission_service'
import env from '#start/env'

type SharedUser = {
  id: number
  full_name: string
  email: string
}

type SharedTenant = {
  id: number
  name: string
  slug: string
  is_active: boolean
  role: string | null
}

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    const auth = await this.resolveAuth(ctx)
    const environment = env.get('NODE_ENV')

    return {
      app: {
        name: env.get('APP_NAME', 'Adonis Web Kit'),
        url: env.get('APP_URL', `http://${env.get('HOST')}:${env.get('PORT')}`),
        sourceUrl: env.get('APP_SOURCE_URL') ?? null,
        environment,
        demoPagesEnabled: env.get('DEMO_PAGES_ENABLED', environment === 'development'),
      },
      errors: this.getValidationErrors(ctx),
      flash: {
        success: ctx.session?.flashMessages.get('success') ?? null,
        error: ctx.session?.flashMessages.get('error') ?? null,
      },
      auth,
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    try {
      return await next()
    } finally {
      this.dispose(ctx)
    }
  }

  private async resolveAuth(ctx: HttpContext): Promise<{
    user: SharedUser | null
    tenants: SharedTenant[]
    activeTenantId: number | null
    permissions: string[]
  }> {
    const empty = {
      user: null,
      tenants: [] as SharedTenant[],
      activeTenantId: null,
      permissions: [] as string[],
    }

    if (!ctx.auth) {
      return empty
    }

    const guard = ctx.auth.use('jwt')
    const isAuthenticated = await guard.check()
    const user = guard.user
    if (!isAuthenticated || !user) {
      return empty
    }

    const tenantRecords = await user
      .related('tenants')
      .query()
      .where('tenants.is_active', true)
      .orderBy('tenants.id', 'asc')

    const tenants: SharedTenant[] = tenantRecords.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      is_active: tenant.is_active,
      role: (tenant.$extras.pivot_role as string | undefined) ?? null,
    }))

    const claimedTenantId = guard.tokenPayload?.tenantId
    const activeTenantId =
      claimedTenantId && tenants.some((tenant) => tenant.id === claimedTenantId)
        ? claimedTenantId
        : (tenants[0]?.id ?? null)

    const permissionService = await app.container.make(PermissionService)
    const permissions = await permissionService.getEffectivePermissionNames(user.id)

    return {
      user: { id: user.id, full_name: user.full_name, email: user.email },
      tenants,
      activeTenantId,
      permissions,
    }
  }
}
