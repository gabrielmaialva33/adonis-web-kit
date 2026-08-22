import { router } from '@inertiajs/react'
import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { CloudUpload, File as FileIcon, Loader2, X } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Alert, AlertIcon, AlertTitle, AlertContent, AlertDescription } from '~/components/ui/alert'
import { cn } from '~/lib/utils'
import { useApi } from '~/hooks/use_api'
import type { FileUploadResponse } from '~/types'

const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'audio/mpeg': ['.mp3'],
  'video/mp4': ['.mp4'],
  'application/zip': ['.zip'],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<FileUploadResponse | null>(null)
  const [rejectionError, setRejectionError] = useState<string | null>(null)
  const { client, loading, error, request, clearError } = useApi()

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      clearError()
      setUploadedFile(null)

      if (fileRejections.length > 0) {
        const firstError = fileRejections[0]?.errors[0]
        if (firstError?.code === 'file-too-large') {
          setRejectionError(`File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`)
        } else if (firstError?.code === 'file-invalid-type') {
          setRejectionError('Unsupported file type.')
        } else {
          setRejectionError(firstError?.message ?? 'File could not be accepted.')
        }
        return
      }

      const file = acceptedFiles[0]
      if (file) {
        setRejectionError(null)
        setSelectedFile(file)
      }
    },
    [clearError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: loading,
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    const result = await request<FileUploadResponse>(() =>
      client.upload('/files/upload', selectedFile)
    )

    if (result) {
      setUploadedFile(result)
      setSelectedFile(null)
      router.reload({ only: ['files'] })
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setRejectionError(null)
    clearError()
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-input bg-background px-6 py-10 text-center transition-colors',
          loading
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-primary/50 hover:bg-accent/40',
          isDragActive && 'border-primary bg-primary/5'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CloudUpload className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Drag &amp; drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Images, PDFs, documents and more — up to {formatFileSize(MAX_FILE_SIZE)}
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
            <FileIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            mode="icon"
            size="sm"
            onClick={clearSelection}
            disabled={loading}
            aria-label="Remove selected file"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={handleUpload}
          disabled={!selectedFile || loading}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Uploading...' : 'Upload File'}
        </Button>
      </div>

      {rejectionError && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <X className="size-4" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>File rejected</AlertTitle>
            <AlertDescription>{rejectionError}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <X className="size-4" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </AlertContent>
        </Alert>
      )}

      {uploadedFile && (
        <Alert variant="success" appearance="light">
          <AlertIcon>
            <CloudUpload className="size-4" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>Upload successful</AlertTitle>
            <AlertDescription>
              <div className="mt-1 space-y-1">
                <p>
                  <strong>File:</strong> {uploadedFile.clientName}
                </p>
                <p>
                  <strong>Type:</strong> {uploadedFile.fileType}
                </p>
                <p>
                  <strong>Size:</strong> {formatFileSize(uploadedFile.size)}
                </p>
                <p className="truncate">
                  <strong>URL:</strong>{' '}
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    {uploadedFile.url}
                  </a>
                </p>
              </div>
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </div>
  )
}

export default FileUpload
