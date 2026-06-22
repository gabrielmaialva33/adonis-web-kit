import { usePage } from '@inertiajs/react'
import type { AuthSharedProps } from '~/types'

export function useAuth() {
  const { auth } = usePage().props as { auth?: AuthSharedProps }

  const tenants = auth?.tenants ?? []
  const activeTenantId = auth?.activeTenantId ?? null
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0] ?? null

  return {
    user: auth?.user ?? null,
    isAuthenticated: !!auth?.user,
    tenants,
    activeTenant,
    activeTenantId,
  }
}
