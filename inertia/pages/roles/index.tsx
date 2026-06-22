import { Head } from '@inertiajs/react'
import { useMemo } from 'react'
import { ShieldCheck, Users } from 'lucide-react'

import { MainLayout } from '~/layouts'
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { PageHeader } from '~/components/page_header'

interface RolePermission {
  id: number
  name: string
  resource: string
  action: string
  context: string
}

interface RoleRow {
  id: number
  name: string
  slug: string
  description: string | null
  users_count: number
  permissions: RolePermission[]
}

interface RolesPageProps {
  roles: RoleRow[]
}

const SLUG_BADGE: Record<string, 'primary' | 'destructive' | 'info' | 'success' | 'secondary'> = {
  root: 'destructive',
  admin: 'primary',
  editor: 'info',
  user: 'success',
  guest: 'secondary',
}

function groupByResource(permissions: RolePermission[]): [string, RolePermission[]][] {
  const groups = new Map<string, RolePermission[]>()
  for (const permission of permissions) {
    const bucket = groups.get(permission.resource) ?? []
    bucket.push(permission)
    groups.set(permission.resource, bucket)
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
}

function RoleCard({ role }: { role: RoleRow }) {
  const grouped = useMemo(() => groupByResource(role.permissions), [role.permissions])

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-4.5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                {role.name}
                <Badge variant={SLUG_BADGE[role.slug] ?? 'secondary'} appearance="light" size="sm">
                  {role.slug}
                </Badge>
              </CardTitle>
              {role.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{role.description}</p>
              )}
            </div>
          </div>
        </CardHeading>
        <CardToolbar>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{role.users_count}</span>
          </div>
        </CardToolbar>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Permissions</p>
          <Badge variant="secondary" appearance="light" size="sm">
            {role.permissions.length}
          </Badge>
        </div>

        {role.permissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No permissions assigned.</p>
        ) : (
          <div className="space-y-3">
            {grouped.map(([resource, permissions]) => (
              <div key={resource}>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {resource}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {permissions.map((permission) => (
                    <Badge key={permission.id} variant="info" appearance="outline" size="sm">
                      {permission.action}
                      {permission.context !== 'any' && (
                        <span className="text-muted-foreground">:{permission.context}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function RolesPage({ roles }: RolesPageProps) {
  return (
    <MainLayout>
      <Head title="Roles" />

      <div className="space-y-6">
        <PageHeader
          title="Roles"
          description="Roles bundle permissions and are assigned to users across the application."
        />

        {roles.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No roles found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {roles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
