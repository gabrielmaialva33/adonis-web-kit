import { Head, Link } from '@inertiajs/react'
import { Code, Database, FileText, Lock, Settings, Shield, Users, Zap } from 'lucide-react'

import { Button } from '~/components/ui/core/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/core/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Head title="Welcome to AdonisKit" />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">A</span>
              </div>
              <span className="text-lg font-semibold">AdonisKit</span>
            </div>

            <nav className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Build Modern Web Apps
            <span className="block text-primary">with AdonisKit</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            A powerful starter kit combining AdonisJS v6, React, and Inertia.js with
            enterprise-grade features out of the box.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Start Building</Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Build Production Apps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Advanced RBAC</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Role-based access control with permission inheritance and time-based permissions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Auth</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  JWT, API tokens, sessions, and basic auth strategies configured and ready.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Database Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  PostgreSQL with Lucid ORM, migrations, and seeders pre-configured.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Optimized build with Vite, React 19, and server-side rendering support.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>File Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Multi-provider file uploads with S3, GCS, and local storage support.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Code className="h-10 w-10 text-primary mb-2" />
                <CardTitle>TypeScript First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full TypeScript support with type-safe API calls and Inertia props.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete user CRUD with email verification and profile management.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Beautiful Metronic-inspired UI with dark mode and responsive design.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Built with Modern Technologies</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">A</span>
              </div>
              <h3 className="font-semibold">AdonisJS v6</h3>
              <p className="text-sm text-muted-foreground">Node.js Framework</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">R</span>
              </div>
              <h3 className="font-semibold">React 19</h3>
              <p className="text-sm text-muted-foreground">UI Framework</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">I</span>
              </div>
              <h3 className="font-semibold">Inertia.js</h3>
              <p className="text-sm text-muted-foreground">SPA Router</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">T</span>
              </div>
              <h3 className="font-semibold">TypeScript</h3>
              <p className="text-sm text-muted-foreground">Type Safety</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Something Amazing?</h2>
          <p className="text-lg mb-8 opacity-90">
            Get started with AdonisKit and launch your next project faster.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Built with ❤️ using AdonisJS and React. Open source and available on GitHub.</p>
        </div>
      </footer>
    </div>
  )
}
