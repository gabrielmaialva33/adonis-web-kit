import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'

import { Field } from '~/components/forms/field'
import { PageHeader } from '~/components/page_header'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { MainLayout } from '~/layouts'
import type { User } from '~/types'

interface EditUserPageProps {
  user: User
}

export default function EditUserPage({ user }: EditUserPageProps) {
  const { data, setData, put, processing, errors } = useForm({
    full_name: user.full_name || '',
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    put(`/users/${user.id}`)
  }

  return (
    <MainLayout>
      <Head title={`Edit user: ${user.full_name}`} />

      <div className="space-y-6">
        <PageHeader
          title="Edit user"
          description="Update the user's editable profile details."
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
                value={user.email}
                hint="The sign-in email cannot be changed from this screen."
                disabled
                readOnly
              />
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-5">
              <Link href="/users">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={processing}>
                {processing ? 'Saving...' : 'Save changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  )
}
