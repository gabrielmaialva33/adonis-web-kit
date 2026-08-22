import { Head, useForm, usePage } from '@inertiajs/react'
import { useTheme } from 'next-themes'
import { Building2, Check, Monitor, Moon, Sun, Trash2, type LucideIcon } from 'lucide-react'

import { MainLayout } from '~/layouts'
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { PageHeader } from '~/components/page_header'
import { useAuth } from '~/hooks/use_auth'
import { cn } from '~/lib/utils'

interface SettingsProfile {
  id: number
  full_name: string
  email: string
  username: string | null
}

interface SettingsPageProps {
  profile: SettingsProfile
}

const THEMES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function ProfileTab({ profile }: { profile: SettingsProfile }) {
  const { data, setData, post, processing, errors } = useForm({
    full_name: profile.full_name,
    username: profile.username ?? '',
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    post('/settings/profile', { preserveScroll: true })
  }

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-muted-foreground">Update your personal information.</p>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="max-w-xl space-y-5">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={data.full_name}
              onChange={(event) => setData('full_name', event.target.value)}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={data.username}
              onChange={(event) => setData('username', event.target.value)}
              aria-invalid={!!errors.username}
            />
            {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Your email is used to sign in and cannot be changed here.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={processing}>
              {processing ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">Customize how the interface looks.</p>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {THEMES.map((option) => {
            const active = theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  'relative flex flex-col items-center gap-3 rounded-lg border p-5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {active && (
                  <span className="absolute end-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
                <option.icon className="size-6" />
                {option.label}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function AccountTab() {
  const { errors: sharedErrors } = usePage().props as { errors?: Record<string, string> }
  const {
    data,
    setData,
    delete: deleteRequest,
    processing,
    errors,
  } = useForm({
    current_password: '',
    confirmation: '',
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    deleteRequest('/settings/account')
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardHeading>
          <CardTitle className="text-destructive">Delete account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Permanently disable your account, revoke active credentials and release your email for a
            future registration. Historical audit references are retained as an anonymized user.
          </p>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="max-w-xl space-y-5">
          {sharedErrors?.general && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {sharedErrors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              value={data.current_password}
              onChange={(event) => setData('current_password', event.target.value)}
              autoComplete="current-password"
              aria-invalid={!!errors.current_password}
            />
            {errors.current_password && (
              <p className="text-sm text-destructive">{errors.current_password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete_confirmation">
              Type <span className="font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete_confirmation"
              value={data.confirmation}
              onChange={(event) => setData('confirmation', event.target.value)}
              autoComplete="off"
              aria-invalid={!!errors.confirmation}
            />
            {errors.confirmation && (
              <p className="text-sm text-destructive">{errors.confirmation}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="destructive"
            disabled={
              processing ||
              !data.current_password ||
              data.confirmation.trim().toUpperCase() !== 'DELETE'
            }
          >
            <Trash2 className="size-4" />
            {processing ? 'Deleting account...' : 'Delete my account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function WorkspacesTab() {
  const { tenants, activeTenantId, can } = useAuth()
  const { data, setData, post, processing, errors, reset } = useForm({ name: '' })
  const canCreateWorkspace = can('tenants.create')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    post('/settings/workspaces', {
      preserveScroll: true,
      onSuccess: () => reset(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Workspaces</CardTitle>
          <p className="text-sm text-muted-foreground">
            Workspaces you belong to and your membership role in each.
          </p>
        </CardHeading>
      </CardHeader>
      <CardContent className="p-0">
        {canCreateWorkspace && (
          <form onSubmit={submit} className="space-y-3 border-b border-border p-5">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="workspace_name">New workspace</Label>
                <Input
                  id="workspace_name"
                  value={data.name}
                  onChange={(event) => setData('name', event.target.value)}
                  placeholder="Acme Workspace"
                  aria-invalid={!!errors.name}
                />
              </div>
              <Button type="submit" variant="primary" disabled={processing || !data.name.trim()}>
                {processing ? 'Creating...' : 'Create workspace'}
              </Button>
            </div>
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </form>
        )}

        {tenants.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            You don&apos;t belong to any workspace yet. Create one to unlock tenant-scoped features.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tenants.map((tenant) => (
              <li key={tenant.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tenant.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{tenant.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {tenant.role && (
                    <Badge variant="secondary" appearance="light" size="sm">
                      {tenant.role}
                    </Badge>
                  )}
                  {tenant.id === activeTenantId && (
                    <Badge variant="primary" appearance="light" size="sm">
                      Active
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default function SettingsPage({ profile }: SettingsPageProps) {
  const { url } = usePage()
  const requestedTab = new URL(url, 'http://localhost').searchParams.get('tab')
  const defaultTab = ['profile', 'appearance', 'workspaces', 'account'].includes(requestedTab ?? '')
    ? requestedTab!
    : 'profile'

  return (
    <MainLayout>
      <Head title="Settings" />

      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your account, appearance and workspaces."
        />

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList variant="line">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab profile={profile} />
          </TabsContent>
          <TabsContent value="appearance">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="workspaces">
            <WorkspacesTab />
          </TabsContent>
          <TabsContent value="account">
            <AccountTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
