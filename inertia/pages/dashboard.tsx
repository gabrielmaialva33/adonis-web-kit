import { Head, Link } from '@inertiajs/react'
import {
  ArrowUpRight,
  Building2,
  FileText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import { MainLayout } from '~/layouts'
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'
import { PageHeader } from '~/components/page_header'
import { useAuth } from '~/hooks/use_auth'

interface DashboardStats {
  totals: { users: number; tenants: number; files: number; roles: number }
  signups: { month: string; users: number }[]
  recentUsers: {
    id: number
    full_name: string
    email: string
    created_at: string | null
    roles: string[]
  }[]
}

interface DashboardPageProps {
  stats: DashboardStats
}

const chartConfig = {
  users: { label: 'New users', color: 'var(--color-primary)' },
} satisfies ChartConfig

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string
  value: number
  icon: LucideIcon
  href?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
          {href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowUpRight className="size-3" />
            </Link>
          )}
        </div>
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage({ stats }: DashboardPageProps) {
  const { user, activeTenant, can } = useAuth()
  const canListUsers = can('users.list')

  return (
    <MainLayout>
      <Head title="Dashboard" />

      <div className="space-y-6">
        <PageHeader
          title={`Welcome back, ${user?.full_name ?? 'there'}`}
          description={
            activeTenant
              ? `You're working in ${activeTenant.name}.`
              : 'Join an active workspace to see tenant-scoped activity.'
          }
          actions={
            can('users.create') ? (
              <Link href="/users/create">
                <Button variant="primary">Add user</Button>
              </Link>
            ) : undefined
          }
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Workspace users"
            value={stats.totals.users}
            icon={Users}
            href={canListUsers ? '/users' : undefined}
          />
          <StatCard title="My workspaces" value={stats.totals.tenants} icon={Building2} />
          <StatCard
            title="Workspace files"
            value={stats.totals.files}
            icon={FileText}
            href={can('files.list') ? '/files' : undefined}
          />
          <StatCard
            title="Global roles"
            value={stats.totals.roles}
            icon={ShieldCheck}
            href={can('roles.list') ? '/roles' : undefined}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>New workspace users</CardTitle>
                <p className="text-sm text-muted-foreground">Sign-ups over the last 6 months</p>
              </CardHeading>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <AreaChart data={stats.signups} margin={{ left: 4, right: 4 }}>
                  <defs>
                    <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="users"
                    type="monotone"
                    fill="url(#fillUsers)"
                    stroke="var(--color-users)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Monthly activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Registrations in the active workspace
                </p>
              </CardHeading>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={stats.signups} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="var(--color-users)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent users */}
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Recent workspace users</CardTitle>
              <p className="text-sm text-muted-foreground">The latest people to join</p>
            </CardHeading>
            {canListUsers && (
              <CardToolbar>
                <Link href="/users">
                  <Button variant="outline" size="sm">
                    View all
                  </Button>
                </Link>
              </CardToolbar>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentUsers.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No users in the active workspace yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.recentUsers.map((recent) => (
                  <li
                    key={recent.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/50"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initialsOf(recent.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{recent.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{recent.email}</p>
                    </div>
                    <div className="hidden gap-1 sm:flex">
                      {recent.roles.length > 0 ? (
                        recent.roles.map((role) => (
                          <Badge key={role} variant="secondary" appearance="light" size="sm">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No role</span>
                      )}
                    </div>
                    <span className="hidden text-xs text-muted-foreground md:block">
                      {formatDate(recent.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
