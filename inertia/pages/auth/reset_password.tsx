import { Head, Link } from '@inertiajs/react'
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'

import { ResetPasswordForm } from '~/components/auth'
import { useApp } from '~/hooks/use_app'
import { AuthSplitLayout } from '~/layouts/auth/auth_split_layout'

interface ResetPasswordPageProps {
  token: string
}

export default function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const application = useApp()

  return (
    <>
      <Head title="Reset password" />
      <AuthSplitLayout
        title="Choose a new password"
        subtitle="Use a strong password you do not reuse on other services."
        panelTitle={`Secure your ${application.name} account`}
        panelDescription="A successful reset consumes the link and revokes every active API refresh token for the account."
        features={[
          {
            title: 'One-time token',
            description: 'The link cannot be replayed after a successful reset',
            icon: KeyRound,
          },
          {
            title: 'Credential rotation',
            description: 'Existing refresh sessions are revoked automatically',
            icon: LockKeyhole,
          },
          {
            title: 'Hashed storage',
            description: 'Only an HMAC of the reset token is stored in the database',
            icon: ShieldCheck,
          },
        ]}
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <ResetPasswordForm token={token} />
      </AuthSplitLayout>
    </>
  )
}
