import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

/**
 * Concrete Inertia middleware.
 *
 * In Inertia v4 the framework ships an abstract `BaseInertiaMiddleware`, so the
 * host application must provide a concrete subclass that wires up the request
 * lifecycle and (optionally) shares data with every page.
 */
export default class InertiaMiddleware extends BaseInertiaMiddleware {
  async share(ctx: HttpContext) {
    return {
      errors: this.getValidationErrors(ctx),
      flash: {
        success: ctx.session?.flashMessages.get('success') ?? null,
        error: ctx.session?.flashMessages.get('error') ?? null,
      },
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)
    const result = await next()
    this.dispose(ctx)
    return result
  }
}
