import { Head, Link } from '@inertiajs/react'
import { KeyRound, MailCheck, ShieldCheck } from 'lucide-react'

import { ForgotPasswordForm } from '~/components/auth'
import { useApp } from '~/hooks/use_app'
import { AuthSplitLayout } from '~/layouts/auth/auth_split_layout'

export default function ForgotPasswordPage() {
  const application = useApp()

  return (
    <>
      <Head title="Forgot password" />
      <AuthSplitLayout
        title="Forgot your password?"
        subtitle="Enter your email and we will send a secure reset link if the account exists."
        panelTitle={`Recover access to ${application.name}`}
        panelDescription="Password reset links are short-lived, single-use, and invalidate active refresh tokens after a successful change."
        features={[
          {
            title: 'Privacy preserving',
            description: 'The response never reveals whether an email is registered',
            icon: ShieldCheck,
          },
          {
            title: 'Single-use links',
            description: 'Each new request invalidates previous reset links',
            icon: KeyRound,
          },
          {
            title: 'Email delivery',
            description: 'Local development uses the bundled Mailpit inbox',
            icon: MailCheck,
          },
        ]}
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <ForgotPasswordForm />
      </AuthSplitLayout>
    </>
  )
}
