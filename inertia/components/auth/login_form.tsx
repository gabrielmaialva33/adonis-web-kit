import { FormEvent } from 'react'
import { Link, useForm } from '@inertiajs/react'
import { Loader2, Mail, Lock } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Field } from '~/components/forms/field'

export function LoginForm() {
  const { data, setData, post, processing, errors } = useForm({
    uid: '',
    password: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    post('/login')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Email or Username"
        id="uid"
        type="text"
        name="uid"
        value={data.uid}
        onChange={(e) => setData('uid', e.target.value)}
        error={errors.uid}
        placeholder="john@example.com"
        required
        autoComplete="username"
        leftIcon={<Mail className="size-4" />}
      />

      <Field
        label="Password"
        id="password"
        type="password"
        name="password"
        value={data.password}
        onChange={(e) => setData('password', e.target.value)}
        error={errors.password}
        labelAction={
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        }
        required
        autoComplete="current-password"
        leftIcon={<Lock className="size-4" />}
      />

      <Button type="submit" variant="primary" disabled={processing} className="w-full" size="lg">
        {processing && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  )
}

export default LoginForm
