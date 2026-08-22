import { Head, Link, router } from '@inertiajs/react'
import { ExternalLink, File as FileIcon, Trash2 } from 'lucide-react'

import { FileUpload } from '~/components/file'
import { PageHeader } from '~/components/page_header'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '~/components/ui/card'
import { useAuth } from '~/hooks/use_auth'
import { MainLayout } from '~/layouts'

interface FileRow {
  id: number
  client_name: string
  file_name: string
  file_size: number
  file_type: string
  file_category: string
  url: string
  owner: {
    id: number
    full_name: string
  }
  created_at: string | null
}

interface FilesPageProps {
  files: {
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
      firstPage: number
      nextPageUrl: string | null
      previousPageUrl: string | null
    }
    data: FileRow[]
  }
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function FilesPage({ files }: FilesPageProps) {
  const { user, can } = useAuth()
  const canUpload = can('files.create')
  const canDeleteAny = can('files.delete')
  const canDeleteOwn = can('files.delete.own')

  const deleteFile = (file: FileRow) => {
    const confirmed = window.confirm(`Delete “${file.client_name}”? This cannot be undone.`)
    if (!confirmed) return

    router.delete(`/files/${file.id}`, { preserveScroll: true })
  }

  return (
    <MainLayout>
      <Head title="Files" />

      <div className="space-y-6">
        <PageHeader
          title="File management"
          description="Upload and manage files in the active workspace."
        />

        {canUpload && (
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Upload files</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or browse to upload a new workspace file.
                </p>
              </CardHeading>
            </CardHeader>
            <CardContent>
              <FileUpload />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Workspace files</CardTitle>
              <p className="text-sm text-muted-foreground">
                {files.meta.total.toLocaleString()} file{files.meta.total === 1 ? '' : 's'} in the
                active workspace.
              </p>
            </CardHeading>
          </CardHeader>
          <CardContent className="p-0">
            {files.data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileIcon className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">No files yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {canUpload
                      ? 'Upload the first file for this workspace.'
                      : 'No workspace files are available to you yet.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {files.data.map((file) => {
                  const canDelete = canDeleteAny || (canDeleteOwn && file.owner.id === user?.id)

                  return (
                    <div
                      key={file.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileIcon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{file.client_name}</p>
                          <Badge variant="secondary" appearance="light" size="sm">
                            {file.file_category}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{file.file_type}</span>
                          <span>Uploaded by {file.owner.full_name}</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="size-4" />
                            Open
                          </Button>
                        </a>
                        {canDelete && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteFile(file)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {files.meta.lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-4">
                <p className="text-sm text-muted-foreground">
                  Page {files.meta.currentPage} of {files.meta.lastPage}
                </p>
                <div className="flex gap-2">
                  {files.meta.currentPage > files.meta.firstPage && (
                    <Link href={`/files?page=${files.meta.currentPage - 1}`} preserveScroll>
                      <Button variant="outline" size="sm">
                        Previous
                      </Button>
                    </Link>
                  )}
                  {files.meta.currentPage < files.meta.lastPage && (
                    <Link href={`/files?page=${files.meta.currentPage + 1}`} preserveScroll>
                      <Button variant="outline" size="sm">
                        Next
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
