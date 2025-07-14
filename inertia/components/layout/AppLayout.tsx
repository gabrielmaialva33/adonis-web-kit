import { ReactNode } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { Button } from '../ui/Button'
import { User } from '~/types'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { auth } = usePage().props as { auth?: { user?: User } }

  return (
    <div className="min-h-screen bg-sand-2">
      <nav className="bg-white border-b border-sand-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <svg className="h-8 w-8 fill-primary" viewBox="0 0 33 33">
                  <path
                    fillRule="evenodd"
                    d="M0 16.333c0 13.173 3.16 16.333 16.333 16.333 13.173 0 16.333-3.16 16.333-16.333C32.666 3.16 29.506 0 16.333 0 3.16 0 0 3.16 0 16.333Zm6.586 3.393L11.71 8.083c.865-1.962 2.528-3.027 4.624-3.027 2.096 0 3.759 1.065 4.624 3.027l5.123 11.643c.233.566.432 1.297.432 1.93 0 2.893-2.029 4.923-4.923 4.923-.986 0-1.769-.252-2.561-.506-.812-.261-1.634-.526-2.695-.526-1.048 0-1.89.267-2.718.529-.801.253-1.59.503-2.538.503-2.894 0-4.923-2.03-4.923-4.924 0-.632.2-1.363.432-1.929Zm9.747-9.613-5.056 11.443c1.497-.699 3.227-1.032 5.056-1.032 1.763 0 3.56.333 4.99 1.032l-4.99-11.444Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>

              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className="border-transparent text-sand-11 hover:border-sand-8 hover:text-sand-12 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Home
                </Link>
                {auth?.user && (
                  <>
                    <Link
                      href="/dashboard"
                      className="border-transparent text-sand-11 hover:border-sand-8 hover:text-sand-12 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/users"
                      className="border-transparent text-sand-11 hover:border-sand-8 hover:text-sand-12 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Users
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {auth?.user ? (
                <>
                  <span className="text-sm text-sand-11">{auth.user.full_name}</span>
                  <Link href="/logout" method="post" as="button">
                    <Button variant="outline" size="sm">
                      Logout
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  )
}
