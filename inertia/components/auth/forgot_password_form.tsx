import { FormEvent } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import { Loader2, Mail } from 'lucide-react'

import { Field } from '~/components/forms/field'
import { Alert, AlertContent, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'

interface FlashProps {
  flash?: { success?: string | null }
}

export default function ForgotPasswordForm() {
  const { flash } = usePage().props as FlashProps
  const { data, setData, post, processing, errors } = useForm({ email: '' })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    post('/forgot-password', { preserveScroll: true })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {flash?.success && (
        <Alert variant="success" appearance="light">
          <AlertContent>
            <AlertDescription>{flash.success}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      <Field
        label="Email"
        id="email"
        type="email"
        name="email"
        value={data.email}
        onChange={(event) => setData('email', event.target.value)}
        error={errors.email}
        placeholder="john@example.com"
        required
        autoComplete="email"
        leftIcon={<Mail className="size-4" />}
      />

      <Button type="submit" variant="primary" disabled={processing} className="w-full" size="lg">
        {processing && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </Button>
    </form>
  )
}
