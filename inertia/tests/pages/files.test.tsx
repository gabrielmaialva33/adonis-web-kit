import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import FilesPage from '~/pages/files/index'

vi.mock('@inertiajs/react', () => ({
  Head: () => null,
  Link: ({ children }: { children: ReactNode }) => children,
  router: { delete: vi.fn() },
}))
vi.mock('~/layouts', () => ({
  MainLayout: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('~/hooks/use_auth', () => ({
  useAuth: () => ({
    user: { id: 10 },
    can: (permission: string) => permission === 'files.delete.own',
  }),
}))

describe('Files page', () => {
  it('preserves access to files with a deleted owner without offering owner-only deletion', () => {
    render(
      <FilesPage
        files={{
          meta: {
            total: 1,
            perPage: 20,
            currentPage: 1,
            lastPage: 1,
            firstPage: 1,
            nextPageUrl: null,
            previousPageUrl: null,
          },
          data: [
            {
              id: 1,
              client_name: 'retained-document',
              file_name: 'uploads/private.txt',
              file_size: 12,
              file_type: 'text/plain',
              file_category: 'file',
              url: '/api/v1/files/2/1/download',
              owner: null,
              created_at: null,
            },
          ],
        }}
      />
    )
    expect(screen.getByText('retained-document')).toBeInTheDocument()
    expect(screen.getByText('Uploaded by Deleted user')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      '/api/v1/files/2/1/download'
    )
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})
