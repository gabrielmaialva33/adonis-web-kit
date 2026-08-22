import { Head, Link } from '@inertiajs/react'
import { ShieldCheck, Users, Zap } from 'lucide-react'

import { LoginForm } from '~/components/auth'
import { useApp } from '~/hooks/use_app'
import { AuthSplitLayout } from '~/layouts/auth/auth_split_layout'

export default function LoginPage() {
  const application = useApp()

  return (
    <>
      <Head title="Login" />
      <AuthSplitLayout
        title="Sign in"
        subtitle="Enter your email and password to access your account"
        panelTitle={`Welcome back to ${application.name}`}
        panelDescription="Secure account access, global RBAC, active-workspace context and a typed full-stack foundation."
        features={[
          {
            title: 'Role-based access',
            description: 'Global roles and contextual permissions',
            icon: ShieldCheck,
          },
          { title: 'Multi-tenant', description: 'Switch workspaces in one click', icon: Users },
          {
            title: 'Account lifecycle',
            description: 'JWT auth, verification and password recovery',
            icon: Zap,
          },
        ]}
        footer={
          <>
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </>
        }
      >
        <LoginForm />
      </AuthSplitLayout>
    </>
  )
}
