import { Head, Link } from '@inertiajs/react'
import { RegisterForm } from '~/components/auth/RegisterForm'

interface RegisterPageProps {
  errors?: Record<string, string>
}

export default function RegisterPage({ errors }: RegisterPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Head title="Register" />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">A</span>
              </div>
              <span className="text-lg font-semibold">AdonisKit</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Already have an account?
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create an account</h1>
            <p className="text-muted-foreground mt-2">Get started with your free account today</p>
          </div>

          <RegisterForm errors={errors} />
        </div>
      </div>
    </div>
  )
}
