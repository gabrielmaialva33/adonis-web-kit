import { Head } from '@inertiajs/react'

import { FileUpload } from '~/components/file'
import { PageHeader } from '~/components/page_header'
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '~/components/ui/card'
import { useAuth } from '~/hooks/use_auth'
import { MainLayout } from '~/layouts'

export default function FilesPage() {
  const { can } = useAuth()
  const canUpload = can('files.create')

  return (
    <MainLayout>
      <Head title="Files" />

      <div className="space-y-6">
        <PageHeader
          title="File management"
          description="Upload and manage files in the active workspace."
        />

        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>{canUpload ? 'Upload files' : 'Workspace files'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {canUpload
                  ? 'Drag and drop or browse to upload a new file.'
                  : 'You have read-only access to files in this workspace.'}
              </p>
            </CardHeading>
          </CardHeader>
          <CardContent>
            {canUpload ? (
              <FileUpload />
            ) : (
              <p className="text-sm text-muted-foreground">
                Ask a workspace administrator for the files.create permission to upload files.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
