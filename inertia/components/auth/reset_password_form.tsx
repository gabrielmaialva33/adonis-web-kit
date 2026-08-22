import { FormEvent } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import { Loader2, Lock } from 'lucide-react'

import { Field } from '~/components/forms/field'
import { Alert, AlertContent, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'

interface ResetPasswordFormProps {
  token: string
}

interface SharedErrors {
  errors?: Record<string, string>
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { errors: sharedErrors } = usePage().props as SharedErrors
  const { data, setData, post, processing, errors } = useForm({
    token,
    password: '',
    password_confirmation: '',
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    post('/reset-password')
  }

  if (!token) {
    return (
      <Alert variant="destructive" appearance="light">
        <AlertContent>
          <AlertDescription>The password reset link is missing its token.</AlertDescription>
        </AlertContent>
      </Alert>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {sharedErrors?.general && (
        <Alert variant="destructive" appearance="light">
          <AlertContent>
            <AlertDescription>{sharedErrors.general}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      <Field
        label="New password"
        id="password"
        type="password"
        name="password"
        value={data.password}
        onChange={(event) => setData('password', event.target.value)}
        error={errors.password}
        hint="Must be at least 8 characters"
        required
        autoComplete="new-password"
        leftIcon={<Lock className="size-4" />}
      />

      <Field
        label="Confirm new password"
        id="password_confirmation"
        type="password"
        name="password_confirmation"
        value={data.password_confirmation}
        onChange={(event) => setData('password_confirmation', event.target.value)}
        error={errors.password_confirmation}
        required
        autoComplete="new-password"
        leftIcon={<Lock className="size-4" />}
      />

      <Button type="submit" variant="primary" disabled={processing} className="w-full" size="lg">
        {processing && <Loader2 className="size-4 animate-spin" />}
        Reset password
      </Button>
    </form>
  )
}
