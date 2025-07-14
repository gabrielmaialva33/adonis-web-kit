import { Head } from '@inertiajs/react'

import { AppLayout } from '~/components/layout/AppLayout'
import { FileUpload } from '~/components/file/FileUpload'

export default function FilesPage() {
  return (
    <AppLayout>
      <Head title="Files" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-sand-12 mb-8">File Management</h1>

        <FileUpload />
      </div>
    </AppLayout>
  )
}
