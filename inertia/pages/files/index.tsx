import { Head } from '@inertiajs/react'

import { MainLayout } from '~/layouts'
import { FileUpload } from '~/components/file'
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '~/components/ui/card'

export default function FilesPage() {
  return (
    <MainLayout>
      <Head title="Files" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage your files across providers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Upload files</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag and drop or browse to upload new files.
              </p>
            </CardHeading>
          </CardHeader>
          <CardContent>
            <FileUpload />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
