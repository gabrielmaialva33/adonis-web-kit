import { Link, router } from '@inertiajs/react'
import { Bell, Check, ChevronsUpDown, LogOut, Menu, Search, Settings, User } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import { Input } from '~/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet'
import { ThemeToggle } from '~/components/theme/theme_toggle'
import { useAuth } from '~/hooks/use_auth'
import { SidebarNav } from './sidebar'

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function TenantSwitcher() {
  const { tenants, activeTenant } = useAuth()

  if (tenants.length === 0) {
    return null
  }

  const switchTenant = (tenantId: number) => {
    if (tenantId === activeTenant?.id) return
    router.post('/tenant/switch', { tenant_id: tenantId }, { preserveScroll: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2 max-w-[200px]">
          <Avatar className="size-5">
            <AvatarFallback className="text-[0.625rem]">
              {activeTenant ? initialsOf(activeTenant.name) : '—'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{activeTenant?.name ?? 'No tenant'}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onSelect={() => switchTenant(tenant.id)}
            className="gap-2"
          >
            <Avatar className="size-6">
              <AvatarFallback className="text-[0.625rem]">
                {initialsOf(tenant.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{tenant.name}</span>
              {tenant.role && (
                <span className="text-xs capitalize text-muted-foreground">{tenant.role}</span>
              )}
            </div>
            {tenant.id === activeTenant?.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          Sign in
        </Button>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" mode="icon" className="rounded-full">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initialsOf(user.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initialsOf(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user.full_name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => router.post('/logout')}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Mobile nav (Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" mode="icon" className="lg:hidden">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <Link href="/dashboard" className="flex h-16 items-center gap-2 border-b px-5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-lg font-semibold">AdonisKit</span>
          </Link>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <Link href="/dashboard" className="me-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <span className="font-bold text-primary-foreground">A</span>
        </div>
        <span className="hidden text-lg font-semibold sm:inline-block">AdonisKit</span>
      </Link>

      {/* Desktop sidebar collapse toggle */}
      <Button variant="ghost" mode="icon" className="hidden lg:flex" onClick={onToggleSidebar}>
        <Menu className="size-5" />
      </Button>

      {/* Search */}
      <div className="hidden flex-1 md:block">
        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="ps-9" />
        </div>
      </div>

      {/* Right actions */}
      <div className="ms-auto flex items-center gap-2">
        <TenantSwitcher />

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <Button variant="ghost" mode="icon" className="relative">
          <Bell className="size-5" />
          <Badge
            variant="destructive"
            shape="circle"
            className="absolute -end-0.5 -top-0.5 size-2 min-w-0 p-0"
          />
        </Button>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
