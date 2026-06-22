import { Head } from '@inertiajs/react'

import { MainLayout } from '~/layouts'
import { FileUpload } from '~/components/file'
import { PageHeader } from '~/components/page_header'
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '~/components/ui/card'

export default function FilesPage() {
  return (
    <MainLayout>
      <Head title="Files" />

      <div className="space-y-6">
        <PageHeader
          title="File management"
          description="Upload and manage your files across providers."
        />

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
