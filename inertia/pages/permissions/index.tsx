import { Head } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import { KeyRound, Search } from 'lucide-react'

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
import { Input } from '~/components/ui/input'
import { PageHeader } from '~/components/page_header'

interface PermissionRow {
  id: number
  name: string
  resource: string
  action: string
  context: string
  description: string | null
}

interface PermissionsPageProps {
  permissions: PermissionRow[]
}

const ACTION_BADGE: Record<string, 'success' | 'info' | 'warning' | 'destructive' | 'secondary'> = {
  create: 'success',
  read: 'info',
  list: 'info',
  update: 'warning',
  delete: 'destructive',
  assign: 'secondary',
  revoke: 'secondary',
  export: 'secondary',
  import: 'secondary',
}

function groupByResource(permissions: PermissionRow[]): [string, PermissionRow[]][] {
  const groups = new Map<string, PermissionRow[]>()
  for (const permission of permissions) {
    const bucket = groups.get(permission.resource) ?? []
    bucket.push(permission)
    groups.set(permission.resource, bucket)
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
}

export default function PermissionsPage({ permissions }: PermissionsPageProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return permissions
    return permissions.filter((permission) =>
      [permission.name, permission.resource, permission.action, permission.context]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [permissions, search])

  const grouped = useMemo(() => groupByResource(filtered), [filtered])

  return (
    <MainLayout>
      <Head title="Permissions" />

      <div className="space-y-6">
        <PageHeader
          title="Permissions"
          description="Granular permissions follow the resource.action.context convention, grouped by resource."
        />

        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search permissions..."
            className="w-full ps-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {grouped.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No permissions match your search.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map(([resource, items]) => (
              <Card key={resource}>
                <CardHeader>
                  <CardHeading>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <KeyRound className="size-4" />
                      </div>
                      <CardTitle className="capitalize">{resource}</CardTitle>
                    </div>
                  </CardHeading>
                  <CardToolbar>
                    <Badge variant="secondary" appearance="light" size="sm">
                      {items.length}
                    </Badge>
                  </CardToolbar>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium capitalize">
                          {permission.action}
                        </p>
                        {permission.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge
                          variant={ACTION_BADGE[permission.action] ?? 'secondary'}
                          appearance="light"
                          size="sm"
                        >
                          {permission.action}
                        </Badge>
                        {permission.context !== 'any' && (
                          <Badge variant="secondary" appearance="outline" size="sm">
                            {permission.context}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
