import { Link, usePage } from '@inertiajs/react'
import { useState } from 'react'
import {
  ChevronDown,
  FileText,
  Home,
  type LucideIcon,
  Settings,
  Shield,
  Upload,
  Users,
} from 'lucide-react'

import { cn } from '~/lib/utils'

interface MenuItem {
  title: string
  href?: string
  icon?: LucideIcon
  children?: { title: string; href: string }[]
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: Home },
  {
    title: 'Users',
    icon: Users,
    children: [
      { title: 'All Users', href: '/users' },
      { title: 'Roles', href: '/roles' },
      { title: 'Permissions', href: '/permissions' },
    ],
  },
  { title: 'Files', href: '/files', icon: Upload },
  {
    title: 'Security',
    icon: Shield,
    children: [
      { title: 'Audit Logs', href: '/audit-logs' },
      { title: 'Sessions', href: '/sessions' },
    ],
  },
  { title: 'Components', href: '/ui-demo', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
]

function useCurrentUrl() {
  const { url } = usePage()
  return url
}

function isActive(url: string, href?: string) {
  if (!href) return false
  return url === href || url.startsWith(href + '/')
}

/**
 * The navigation tree. Shared between the fixed desktop sidebar and the mobile
 * Sheet, so both stay in sync. `collapsed` renders an icon-only rail.
 */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const url = useCurrentUrl()
  const [expanded, setExpanded] = useState<string[]>(() =>
    menuItems
      .filter((item) => item.children?.some((child) => isActive(url, child.href)))
      .map((item) => item.title)
  )

  const toggle = (title: string) =>
    setExpanded((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {menuItems.map((item) => {
        const open = expanded.includes(item.title)
        const parentActive =
          isActive(url, item.href) || !!item.children?.some((c) => isActive(url, c.href))

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

/**
 * Fixed desktop sidebar. Mobile navigation is handled by the Sheet rendered in
 * the header, so this is hidden below `lg`.
 */
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
