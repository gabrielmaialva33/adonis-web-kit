import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import AuditService from '#modules/audits/services/audit_service'
import IOwnership from '#shared/interfaces/ownership_interface'
import OwnershipService from '#shared/services/ownership_service'

export interface OwnershipMiddlewareOptions {
  resource: string
  resourceIdParam?: string
  action?: string
  context?: string
  allowedLevels?: IOwnership.OwnershipLevel[]
}

@inject()
export default class OwnershipMiddleware {
  constructor(
    private ownershipService: OwnershipService,
    private auditService: AuditService
  ) {}

  async handle(ctx: HttpContext, next: NextFn, options: OwnershipMiddlewareOptions) {
    const { auth, params, response } = ctx
    const {
      resource,
      resourceIdParam = 'id',
      action = 'access',
      context = 'own',
      allowedLevels = [IOwnership.OwnershipLevel.OWNER],
    } = options

    const user = auth.user
    if (!user) {
      await this.auditService.logPermissionCheck(
        { resource, action, context, result: 'denied', reason: 'User not authenticated' },
        ctx
      )
      return response.unauthorized({ message: 'Authentication required' })
    }

    const resourceId = Number(params[resourceIdParam])
    if (!Number.isSafeInteger(resourceId) || resourceId <= 0) {
      await this.auditService.logPermissionCheck(
        {
          userId: user.id,
          resource,
          action,
          context,
          result: 'denied',
          reason: 'Invalid resource ID',
        },
        ctx
      )
      return response.badRequest({ message: 'Invalid resource ID' })
    }

    let ownershipLevel: IOwnership.OwnershipLevel | null
    try {
      ownershipLevel = await this.ownershipService.getOwnershipLevel(user.id, resource, resourceId)
    } catch (error) {
      await this.auditService.logPermissionCheck(
        {
          userId: user.id,
          resource,
          action,
          context,
          resourceId,
          result: 'denied',
          reason: `Error checking ownership: ${error instanceof Error ? error.message : 'unknown error'}`,
        },
        ctx
      )
      throw error
    }

    if (!ownershipLevel || !allowedLevels.includes(ownershipLevel)) {
      await this.auditService.logPermissionCheck(
        {
          userId: user.id,
          resource,
          action,
          context,
          resourceId,
          result: 'denied',
          reason: `Insufficient ownership level: ${ownershipLevel ?? 'none'}`,
        },
        ctx
      )
      return response.forbidden({ message: 'Insufficient permissions to access this resource' })
    }

    await this.auditService.logPermissionCheck(
      {
        userId: user.id,
        resource,
        action,
        context,
        resourceId,
        result: 'granted',
        reason: `Ownership level: ${ownershipLevel}`,
      },
      ctx
    )

    ctx.ownershipLevel = ownershipLevel
    ctx.resourceId = resourceId
    return next()
  }
}

export function ownership(options: OwnershipMiddlewareOptions) {
  return async (ctx: HttpContext, next: NextFn) => {
    const middleware = await ctx.containerResolver.make(OwnershipMiddleware)
    return middleware.handle(ctx, next, options)
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    ownershipLevel?: IOwnership.OwnershipLevel
    resourceId?: number
  }
}
