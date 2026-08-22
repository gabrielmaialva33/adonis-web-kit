import { usePage } from '@inertiajs/react'
import { useState, type ReactNode } from 'react'
import { Header } from './main/components/header'
import { Sidebar } from './main/components/sidebar'
import { cn } from '~/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { flash } = usePage().props as {
    flash?: { success?: string | null; error?: string | null }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={() => setCollapsed((value) => !value)} collapsed={collapsed} />

      <Sidebar isCollapsed={collapsed} />

      <main
        className={cn(
          'min-h-[calc(100vh-4rem)] transition-[padding] duration-300',
          collapsed ? 'lg:ps-[76px]' : 'lg:ps-[260px]'
        )}
      >
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {flash?.success && (
            <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              {flash.success}
            </div>
          )}
          {flash?.error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {flash.error}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
