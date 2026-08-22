import { Link, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { ChevronDown, FileText, Home, type LucideIcon, Settings, Upload, Users } from 'lucide-react'

import { useApp } from '~/hooks/use_app'
import { useAuth } from '~/hooks/use_auth'
import { cn } from '~/lib/utils'

interface MenuLink {
  title: string
  href: string
  permission?: string
}

interface MenuItem {
  title: string
  href?: string
  permission?: string
  icon?: LucideIcon
  developmentOnly?: boolean
  children?: MenuLink[]
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home, permission: 'dashboard.read' },
  {
    title: 'Users',
    icon: Users,
    children: [
      { title: 'All Users', href: '/users', permission: 'users.list' },
      { title: 'Roles', href: '/roles', permission: 'roles.list' },
      { title: 'Permissions', href: '/permissions', permission: 'permissions.list' },
    ],
  },
  { title: 'Files', href: '/files', icon: Upload, permission: 'files.list' },
  { title: 'Components', href: '/ui-demo', icon: FileText, developmentOnly: true },
  { title: 'Settings', href: '/settings', icon: Settings },
]

function useCurrentUrl() {
  return usePage().url
}

function isActive(url: string, href?: string) {
  if (!href) return false
  return url === href || url.startsWith(`${href}/`)
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const url = useCurrentUrl()
  const application = useApp()
  const { can } = useAuth()

  const visibleItems = menuItems
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => !child.permission || can(child.permission)),
    }))
    .filter((item) => {
      if (item.developmentOnly && !application.demoPagesEnabled) return false
      if (item.permission && !can(item.permission)) return false
      if (!item.href && item.children?.length === 0) return false
      return true
    })

  const [expanded, setExpanded] = useState<string[]>(() =>
    visibleItems
      .filter((item) => item.children?.some((child) => isActive(url, child.href)))
      .map((item) => item.title)
  )

  const toggle = (title: string) =>
    setExpanded((previous) =>
      previous.includes(title) ? previous.filter((item) => item !== title) : [...previous, title]
    )

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {visibleItems.map((item) => {
        const open = expanded.includes(item.title)
        const parentActive =
          isActive(url, item.href) ||
          Boolean(item.children?.some((child) => isActive(url, child.href)))

        if (item.href) {
          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive(url, item.href)
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.icon && <item.icon className="size-4.5 shrink-0" />}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        }

        return (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => toggle(item.title)}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                parentActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item.icon && <item.icon className="size-4.5 shrink-0" />}
              {!collapsed && (
                <>
                  <span className="flex-1 text-start">{item.title}</span>
                  <ChevronDown
                    className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')}
                  />
                </>
              )}
            </button>

            {item.children && open && !collapsed && (
              <div className="ms-3.5 mt-1 space-y-1 border-s border-border ps-3">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors',
                      isActive(url, child.href)
                        ? 'font-medium text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

interface SidebarProps {
  isCollapsed?: boolean
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed start-0 top-16 z-40 hidden h-[calc(100vh-4rem)] border-e bg-background transition-[width] duration-300 lg:flex lg:flex-col',
        isCollapsed ? 'w-[76px]' : 'w-[260px]'
      )}
    >
      <SidebarNav collapsed={isCollapsed} />
    </aside>
  )
}
