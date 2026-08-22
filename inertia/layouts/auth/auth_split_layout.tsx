import { Link } from '@inertiajs/react'
import { CheckCircle2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { ThemeToggle } from '~/components/theme/theme_toggle'
import { useApp } from '~/hooks/use_app'

interface Feature {
  title: string
  description: string
  icon?: LucideIcon
}

interface AuthSplitLayoutProps {
  title: string
  subtitle: string
  panelTitle: string
  panelDescription: string
  features?: Feature[]
  children: ReactNode
  footer?: ReactNode
}

/**
 * Centered auth layout with a branded gradient panel on the right (desktop).
 * Shared by the login and register pages so they stay visually consistent.
 */
export function AuthSplitLayout({
  title,
  subtitle,
  panelTitle,
  panelDescription,
  features = [],
  children,
  footer,
}: AuthSplitLayoutProps) {
  const application = useApp()
  const brandMark = application.name.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="flex min-h-screen">
      {/* Form side */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between p-6 lg:p-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">{brandMark}</span>
            </div>
            <span className="text-xl font-bold">{application.name}</span>
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </div>

            {children}

            {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
          </div>
        </div>

        <footer className="p-6 text-sm text-muted-foreground lg:p-8">
          &copy; {new Date().getFullYear()} {application.name}. All rights reserved.
        </footer>
      </div>

      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:block lg:w-[45%] xl:w-[50%]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/70" />
        <svg className="absolute inset-0 size-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="auth-grid"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="16" cy="16" r="1.5" fill="currentColor" className="text-white" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        <div className="relative flex h-full flex-col justify-center p-12 text-primary-foreground xl:p-16">
          <h2 className="max-w-md text-4xl font-bold leading-tight">{panelTitle}</h2>
          <p className="mt-4 max-w-md text-lg text-primary-foreground/80">{panelDescription}</p>

          {features.length > 0 && (
            <ul className="mt-10 space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon ?? CheckCircle2
                return (
                  <li key={feature.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <Icon className="size-4.5" />
                    </span>
                    <div>
                      <p className="font-semibold">{feature.title}</p>
                      <p className="text-sm text-primary-foreground/75">{feature.description}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
