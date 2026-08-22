import { Head, Link } from '@inertiajs/react'
import { Layers, Lock, Rocket } from 'lucide-react'

import { RegisterForm } from '~/components/auth'
import { useApp } from '~/hooks/use_app'
import { AuthSplitLayout } from '~/layouts/auth/auth_split_layout'

interface RegisterPageProps {
  errors?: Record<string, string>
}

export default function RegisterPage({ errors }: RegisterPageProps) {
  const application = useApp()

  return (
    <>
      <Head title="Register" />
      <AuthSplitLayout
        title="Create account"
        subtitle="Enter your information to create your account"
        panelTitle={`Join ${application.name}`}
        panelDescription="Create an account with secure authentication, workspace onboarding, file management and recovery flows already wired."
        features={[
          {
            title: 'Secure by default',
            description: 'Argon2 hashing and JWT sessions',
            icon: Lock,
          },
          {
            title: 'Batteries included',
            description: 'Files, audits and rate limiting',
            icon: Layers,
          },
          {
            title: 'Ship faster',
            description: 'Skip the boilerplate, build features',
            icon: Rocket,
          },
        ]}
        footer={
          <>
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <RegisterForm errors={errors} />
      </AuthSplitLayout>
    </>
  )
}
