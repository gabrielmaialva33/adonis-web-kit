import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

import { MainLayout } from '~/layouts'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Field } from '~/components/forms/field'
import type { User } from '~/types'

interface EditUserPageProps {
  user: User
}

export default function EditUserPage({ user }: EditUserPageProps) {
  const { data, setData, put, processing, errors } = useForm({
    full_name: user.full_name || '',
    email: user.email || '',
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    put(`/users/${user.id}`)
  }

  return (
    <MainLayout>
      <Head title={`Edit user: ${user.full_name}`} />

      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/users"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to users
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit user</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update the user&apos;s details.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
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
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-5">
              <Link href="/users">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : 'Save changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  )
}
