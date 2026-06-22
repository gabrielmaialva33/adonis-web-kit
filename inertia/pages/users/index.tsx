import { Head, Link, router } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
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

const columnHelper = createColumnHelper<UserRow>()

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
    () => [
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
              <Button variant="ghost" mode="icon" size="sm">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/users/${row.original.id}/edit`}>
                  <Edit className="size-4" />
                  Edit user
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setUserToDelete(row.original)}
              >
                <Trash2 className="size-4" />
                Delete user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    []
  )

  const table = useReactTable({
    data: users.data,
    columns,
    state: { sorting, pagination },
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const confirmDelete = () => {
    if (!userToDelete) return
    router.delete(`/users/${userToDelete.id}`, {
      preserveScroll: true,
      onFinish: () => setUserToDelete(null),
    })
  }

  return (
    <MainLayout>
      <Head title="Users" />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{userToDelete?.full_name}</strong>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your application users and their roles.
            </p>
          </div>
          <Link href="/users/create">
            <Button>
              <Plus className="size-4" />
              Add user
            </Button>
          </Link>
        </div>

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
