import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

import { MainLayout } from '~/layouts'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Field } from '~/components/forms/field'
import { PageHeader } from '~/components/page_header'

export default function CreateUserPage() {
  const { data, setData, post, processing, errors } = useForm({
    full_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    post('/users')
  }

  return (
    <MainLayout>
      <Head title="Create user" />

      <div className="space-y-6">
        <PageHeader
          title="Create new user"
          description="Fill out the form to add a new user."
          actions={
            <Link href="/users">
              <Button variant="outline">
                <ArrowLeft className="size-4" />
                Back to users
              </Button>
            </Link>
          }
        />

        <form onSubmit={handleSubmit}>
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>User details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field
                label="Full name"
                name="full_name"
                value={data.full_name}
                onChange={(event) => setData('full_name', event.target.value)}
                error={errors.full_name}
                autoComplete="name"
                required
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={data.email}
                onChange={(event) => setData('email', event.target.value)}
                error={errors.email}
                autoComplete="email"
                required
              />
              <Field
                label="Password"
                name="password"
                type="password"
                value={data.password}
                onChange={(event) => setData('password', event.target.value)}
                error={errors.password}
                hint="Must be at least 8 characters"
                autoComplete="new-password"
                required
              />
              <Field
                label="Confirm password"
                name="password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={(event) => setData('password_confirmation', event.target.value)}
                error={errors.password_confirmation}
                autoComplete="new-password"
                required
              />
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-5">
              <Link href="/users">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={processing}>
                {processing ? 'Saving...' : 'Save user'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  )
}
