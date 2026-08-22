import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  useTable,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { Edit, MoreVertical, Plus, Search, Trash2 } from 'lucide-react'

import { MainLayout } from '~/layouts'
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { DataGrid, DataGridContainer } from '~/components/ui/data-grid'
import { dataGridFeatures, type DataGridFeatures } from '~/components/ui/data-grid-features'
import { DataGridTable } from '~/components/ui/data-grid-table'
import { DataGridPagination } from '~/components/ui/data-grid-pagination'
import { DataGridColumnHeader } from '~/components/ui/data-grid-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { PageHeader } from '~/components/page_header'
import { useAuth } from '~/hooks/use_auth'
import type { PaginatedResponse } from '~/types'

interface UserRole {
  id: number
  name: string
  display_name?: string
}

interface UserRow {
  id: number
  full_name: string
  email: string
  username: string | null
  email_verified_at: string | null
  created_at: string
  roles?: UserRole[]
}

interface UsersPageProps {
  users: PaginatedResponse<UserRow>
  search: string
  sortBy: string
  direction: 'asc' | 'desc'
}

const columnHelper = createColumnHelper<DataGridFeatures, UserRow>()

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function UsersPage({ users, search, sortBy, direction }: UsersPageProps) {
  const { can } = useAuth()
  const canCreate = can('users.create')
  const canEdit = can('users.read') && can('users.update')
  const canDelete = can('users.delete')

  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null)
  const [searchValue, setSearchValue] = useState(search)

  const currentPage = Number(users.meta.current_page)
  const perPage = Number(users.meta.per_page)
  const total = Number(users.meta.total)

  const navigate = (params: {
    page?: number
    perPage?: number
    sortBy?: string
    direction?: string
    search?: string
  }) => {
    router.get(
      '/users',
      {
        page: params.page ?? currentPage,
        per_page: params.perPage ?? perPage,
        sort_by: params.sortBy ?? sortBy,
        order: params.direction ?? direction,
        search: params.search ?? searchValue,
      },
      { preserveState: true, preserveScroll: true, replace: true }
    )
  }

  const sorting: SortingState = [{ id: sortBy, desc: direction === 'desc' }]
  const pagination: PaginationState = { pageIndex: currentPage - 1, pageSize: perPage }

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    const first = next[0]
    if (first) {
      navigate({ sortBy: first.id, direction: first.desc ? 'desc' : 'asc', page: 1 })
    }
  }

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === 'function' ? updater(pagination) : updater
    navigate({ page: next.pageIndex + 1, perPage: next.pageSize })
  }

  const columns = useMemo(
    () =>
      // `columns()` keeps each column's TValue intact across the array — v9
      // otherwise widens them to `unknown` and the defs stop matching.
      columnHelper.columns([
        columnHelper.accessor('full_name', {
          id: 'full_name',
          header: ({ column }) => <DataGridColumnHeader column={column} title="Name" />,
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initialsOf(row.original.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.original.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
              </div>
            </div>
          ),
          enableSorting: true,
        }),
        columnHelper.accessor('roles', {
          id: 'roles',
          header: 'Roles',
          cell: ({ row }) => {
            const roles = row.original.roles ?? []
            if (roles.length === 0) {
              return <span className="text-xs text-muted-foreground">—</span>
            }
            return (
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => (
                  <Badge key={role.id} variant="secondary" appearance="light" size="sm">
                    {role.display_name ?? role.name}
                  </Badge>
                ))}
              </div>
            )
          },
          enableSorting: false,
        }),
        columnHelper.accessor('email_verified_at', {
          id: 'email_verified_at',
          header: 'Status',
          cell: ({ row }) =>
            row.original.email_verified_at ? (
              <Badge variant="success" appearance="light" size="sm">
                Verified
              </Badge>
            ) : (
              <Badge variant="warning" appearance="light" size="sm">
                Unverified
              </Badge>
            ),
          enableSorting: false,
        }),
        columnHelper.accessor('created_at', {
          id: 'created_at',
          header: ({ column }) => <DataGridColumnHeader column={column} title="Created" />,
          cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
              {formatDate(row.original.created_at)}
            </span>
          ),
          enableSorting: true,
        }),
        columnHelper.display({
          id: 'actions',
          header: '',
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" mode="icon" size="sm" aria-label="Open user actions">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/users/${row.original.id}/edit`}>
                      <Edit className="size-4" />
                      Edit user
                    </Link>
                  </DropdownMenuItem>
                )}
                {canEdit && canDelete && <DropdownMenuSeparator />}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setUserToDelete(row.original)}
                  >
                    <Trash2 className="size-4" />
                    Deactivate user
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        }),
      ]),
    [canDelete, canEdit]
  )

  const table = useTable({
    features: dataGridFeatures,
    data: users.data,
    columns,
    state: {
      sorting,
      pagination,
      columnVisibility: { actions: canEdit || canDelete },
    },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    getRowId: (row) => String(row.id),
  })

  const confirmDelete = () => {
    if (!userToDelete || !canDelete) return
    router.delete(`/users/${userToDelete.id}`, {
      preserveScroll: true,
      onFinish: () => setUserToDelete(null),
    })
  }

  return (
    <MainLayout>
      <Head title="Users" />

      <AlertDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userToDelete?.full_name}</strong> will no longer be able to sign in and will
              disappear from normal user listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage application users and their global roles."
          actions={
            canCreate ? (
              <Link href="/users/create">
                <Button variant="primary">
                  <Plus className="size-4" />
                  Add user
                </Button>
              </Link>
            ) : undefined
          }
        />

        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>All users</CardTitle>
            </CardHeading>
            <CardToolbar>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  navigate({ search: searchValue, page: 1 })
                }}
                className="relative"
              >
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="w-full ps-9 sm:w-64"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </form>
            </CardToolbar>
          </CardHeader>
          <CardContent className="p-0">
            <DataGrid
              table={table}
              recordCount={total}
              tableLayout={{ rowBorder: true, headerBackground: true }}
              emptyMessage="No users found."
            >
              <DataGridContainer border={false}>
                <DataGridTable />
              </DataGridContainer>
              <div className="border-t p-4">
                <DataGridPagination />
              </div>
            </DataGrid>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
