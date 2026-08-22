import { usePage } from '@inertiajs/react'

import type { AuthSharedProps } from '~/types'

export function useAuth() {
  const { auth } = usePage().props as { auth?: AuthSharedProps }

  const tenants = auth?.tenants ?? []
  const activeTenantId = auth?.activeTenantId ?? null
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0] ?? null
  const permissions = auth?.permissions ?? []

  return {
    user: auth?.user ?? null,
    isAuthenticated: !!auth?.user,
    tenants,
    activeTenant,
    activeTenantId,
    permissions,
    can: (permission: string) => permissions.includes(permission),
    canAny: (required: string[]) => required.some((permission) => permissions.includes(permission)),
    canAll: (required: string[]) =>
      required.every((permission) => permissions.includes(permission)),
  }
}
