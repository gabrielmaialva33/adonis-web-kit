import * as React from 'react'
import { Link, usePage } from '@inertiajs/react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Settings,
  Shield,
  Users,
} from 'lucide-react'

import { cn } from '~/utils/cn'
import { Button } from '../ui/Button'

import type { User } from '~/types'

interface SidebarProps {
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  permission?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: 'Users',
    href: '/users',
    icon: <Users className="h-5 w-5" />,
    permission: 'users.list',
  },
  {
    title: 'Files',
    href: '/files',
    icon: <FileText className="h-5 w-5" />,
    permission: 'files.list',
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: 'Access Control',
    href: '#',
    icon: <Shield className="h-5 w-5" />,
    children: [
      {
        title: 'Roles',
        href: '/roles',
        icon: <Shield className="h-4 w-4" />,
        permission: 'roles.list',
      },
      {
        title: 'Permissions',
        href: '/permissions',
        icon: <Shield className="h-4 w-4" />,
        permission: 'permissions.list',
      },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const { auth, url } = usePage().props as unknown as { auth?: { user?: User }; url: string }
  const [collapsed, setCollapsed] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    return url.startsWith(href)
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const active = isActive(item.href)

    return (
      <div key={item.title}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              active && 'bg-accent text-accent-foreground',
              depth > 0 && 'ml-6'
            )}
          >
            {item.icon}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronRight
                  className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
                />
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              active && 'bg-accent text-accent-foreground',
              depth > 0 && 'ml-6'
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.title}</span>}
          </Link>
        )}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <span className="text-lg font-semibold">AdonisKit</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 hover:bg-accent"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* User section */}
      {auth?.user && (
        <div className="border-t p-4">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">
                {auth.user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{auth.user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{auth.user.email}</p>
              </div>
            )}
          </div>
          <Link href="/logout" method="post" as="button" className="w-full mt-4">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </Link>
        </div>
      )}
    </aside>
  )
}
