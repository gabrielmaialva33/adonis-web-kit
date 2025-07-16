import * as React from 'react'
import { Link } from '@inertiajs/react'
import { Menu, Bell, Search, User } from 'lucide-react'
import { Button } from '~/components/ui/core/button'
import { ThemeToggle } from '~/components/theme/theme-toggle'
import { cn } from '~/utils/cn'

interface HeaderProps {
  onToggleSidebar: () => void
  isMobile?: boolean
}

export function Header({ onToggleSidebar, isMobile = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 sm:px-6">
        {/* Mobile menu button */}
        {isMobile && (
          <Button variant="ghost" size="icon" className="mr-3 lg:hidden" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">A</span>
          </div>
          <span className="text-lg font-semibold hidden sm:inline-block">AdonisKit</span>
        </Link>

        {/* Desktop toggle */}
        {!isMobile && (
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Search bar */}
        <div className="flex-1 px-4 hidden md:block">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <ThemeToggle />

          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
