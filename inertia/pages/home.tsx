import { Head, Link } from '@inertiajs/react'
import {
  ArrowRight,
  Blocks,
  Building2,
  Database,
  FileText,
  KeyRound,
  ShieldCheck,
  TestTube2,
} from 'lucide-react'

import { Button } from '~/components/ui/core/button'
import { useApp } from '~/hooks/use_app'

const features = [
  {
    title: 'Secure authentication',
    description:
      'HTTP-only JWT cookies, bearer access tokens, rotating opaque refresh tokens, verification and password reset.',
    icon: KeyRound,
  },
  {
    title: 'Global RBAC',
    description:
      'Roles, contextual permissions, direct grants, inheritance, cached checks and permission-aware navigation.',
    icon: ShieldCheck,
  },
  {
    title: 'Workspace foundation',
    description:
      'N:N membership, active-workspace selection and configurable personal workspace onboarding.',
    icon: Building2,
  },
  {
    title: 'File management',
    description:
      'Tenant-scoped uploads, listings and owner-aware deletion across local and cloud storage.',
    icon: FileText,
  },
  {
    title: 'Domain modules',
    description:
      'Controllers, services, repositories, models, validators and routes stay together by domain.',
    icon: Blocks,
  },
  {
    title: 'Tested delivery',
    description:
      'Japa, Playwright, Vitest, PostgreSQL, Redis, Docker and a production Inertia SSR build.',
    icon: TestTube2,
  },
]

export default function Home() {
  const application = useApp()
  const brandMark = application.name.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="min-h-screen bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <Head title={`${application.name} — Full-stack starter`} />

      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              {brandMark}
            </span>
            <span className="truncate text-xl font-semibold">{application.name}</span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-5">
            <a
              href="/docs"
              className="hidden text-sm text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white sm:inline"
            >
              API docs
            </a>
            {application.sourceUrl && (
              <a
                href={application.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-sm text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white md:inline"
              >
                Source
              </a>
            )}
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
            <Database className="size-4" />
            AdonisJS + React + Inertia
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            A production-minded foundation for SaaS and multi-tenant applications
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-400">
            Start with authentication, workspaces, RBAC, file management, API documentation, testing
            and SSR instead of rebuilding infrastructure for every product.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Create an account <ArrowRight className="ms-2 size-4" />
              </Button>
            </Link>
            {application.sourceUrl && (
              <a href={application.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="px-8">
                  View source
                </Button>
              </a>
            )}
          </div>
        </section>

        <section className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <feature.icon className="size-5" />
              </span>
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-20 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-2xl font-bold">Real product flows included</h2>
            <p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">
              Registration can create a personal workspace, API tokens carry its identity, users can
              recover or delete their account, and files are manageable from the API and web UI.
            </p>
            <a
              href="/docs"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Explore the API contract <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
            <div className="border-b border-gray-800 px-5 py-3 text-xs text-gray-400">
              Typed from page to policy
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-6 text-gray-200">
              <code>{`const { activeTenant, can } = useAuth()

if (activeTenant && can('files.create')) {
  // POST /api/v1/files/upload
  // x-tenant-id: activeTenant.id
}

if (can('files.delete.own')) {
  // Ownership is verified again by the server.
}`}</code>
            </pre>
          </div>
        </section>

        <section className="mt-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Run it locally</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            PostgreSQL, Redis and Mailpit are included in the development Compose stack.
          </p>
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-xl border border-gray-800 bg-gray-950 text-start">
            <pre className="overflow-x-auto p-6 text-sm leading-6 text-gray-200">
              <code>{`git clone ${application.sourceUrl ?? '<repository-url>'}
cd adonis-web-kit
pnpm install
cp .env.example .env
pnpm ace generate:key
docker compose up -d postgres redis mailpit
pnpm ace migration:run
pnpm ace db:seed
pnpm dev`}</code>
            </pre>
          </div>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" className="px-8">
              Start building <ArrowRight className="ms-2 size-4" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="mt-20 border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{application.name} · AdonisJS, React and Inertia · MIT licensed</p>
          <div className="flex gap-4">
            <a href="/docs" className="hover:text-gray-950 dark:hover:text-white">
              Documentation
            </a>
            {application.sourceUrl && (
              <a
                href={application.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-950 dark:hover:text-white"
              >
                Source
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
