import { FormEvent, useState } from 'react'
import { router } from '@inertiajs/react'

import { Button } from '../ui/core/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/core/card'
import { Alert, AlertDescription } from '../ui/core/alert'

import type { RegisterFormData } from '~/types'
import { FormInput } from '~/components/ui/core'

interface RegisterFormProps {
  errors?: Record<string, string>
}

export function RegisterForm({ errors }: RegisterFormProps) {
  const [data, setData] = useState<RegisterFormData>({
    full_name: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: '',
  })
  const [processing, setProcessing] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    router.post('/api/v1/sessions/sign-up', data as any, {
      onFinish: () => setProcessing(false),
    })
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your information to get started</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errors?.general && (
            <Alert variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <FormInput
            label="Full Name"
            type="text"
            name="full_name"
            value={data.full_name}
            onChange={(e) => setData({ ...data, full_name: e.target.value })}
            error={errors?.full_name}
            placeholder="John Doe"
            required
            autoComplete="name"
          />

          <FormInput
            label="Email"
            type="email"
            name="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            error={errors?.email}
            placeholder="john@example.com"
            required
            autoComplete="email"
          />

          <FormInput
            label="Username (optional)"
            type="text"
            name="username"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
            error={errors?.username}
            placeholder="johndoe"
            autoComplete="username"
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            error={errors?.password}
            hint="Must be at least 8 characters"
            required
            autoComplete="new-password"
          />

          <FormInput
            label="Confirm Password"
            type="password"
            name="password_confirmation"
            value={data.password_confirmation}
            onChange={(e) => setData({ ...data, password_confirmation: e.target.value })}
            error={errors?.password_confirmation}
            required
            autoComplete="new-password"
          />
        </CardContent>

        <CardFooter>
          <Button type="submit" loading={processing} disabled={processing} className="w-full">
            Create account
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
