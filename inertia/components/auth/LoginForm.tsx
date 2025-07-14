import { FormEvent, useState } from 'react'
import { router } from '@inertiajs/react'

import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card'
import { Alert, AlertDescription } from '../ui/Alert'
import type { LoginFormData } from '~/types'

interface LoginFormProps {
  errors?: Record<string, string>
}

export function LoginForm({ errors }: LoginFormProps) {
  const [data, setData] = useState<LoginFormData>({
    uid: '',
    password: '',
  })
  const [processing, setProcessing] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    router.post('/api/v1/sessions/sign-in', data, {
      onFinish: () => setProcessing(false),
    })
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>Enter your email or username to continue</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errors?.general && (
            <Alert variant="error">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <Input
            label="Email or Username"
            type="text"
            name="uid"
            value={data.uid}
            onChange={(e) => setData({ ...data, uid: e.target.value })}
            error={errors?.uid}
            placeholder="john@example.com"
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            error={errors?.password}
            required
            autoComplete="current-password"
          />
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="submit" isLoading={processing} disabled={processing} className="w-full">
            Sign in
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
