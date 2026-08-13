import { useMemo, useState } from 'react'
import { Head } from '@inertiajs/react'
import { createColumnHelper, useTable, type ColumnOrderState } from '@tanstack/react-table'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { Settings2 } from 'lucide-react'

import { MainLayout } from '~/layouts'
import { PageHeader } from '~/components/page_header'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '~/components/ui/card'
import { DataGrid, DataGridContainer } from '~/components/ui/data-grid'
import { dataGridFeatures, type DataGridFeatures } from '~/components/ui/data-grid-features'
import { DataGridColumnHeader } from '~/components/ui/data-grid-column-header'
import { DataGridColumnVisibility } from '~/components/ui/data-grid-column-visibility'
import { DataGridPagination } from '~/components/ui/data-grid-pagination'
import { DataGridTableDnd } from '~/components/ui/data-grid-table-dnd'
import { DataGridTableDndRows } from '~/components/ui/data-grid-table-dnd-rows'

interface ServerRow {
  id: string
  name: string
  region: string
  status: 'online' | 'degraded' | 'offline'
  cpu: number
  uptime: string
}

const LINHAS: ServerRow[] = [
  {
    id: 'srv-01',
    name: 'api-gateway',
    region: 'us-east-1',
    status: 'online',
    cpu: 32,
    uptime: '31d',
  },
  {
    id: 'srv-02',
    name: 'worker-queue',
    region: 'us-east-1',
    status: 'online',
    cpu: 58,
    uptime: '31d',
  },
  {
    id: 'srv-03',
    name: 'postgres-primary',
    region: 'eu-west-1',
    status: 'degraded',
    cpu: 87,
    uptime: '12d',
  },
  {
    id: 'srv-04',
    name: 'redis-cache',
    region: 'eu-west-1',
    status: 'online',
    cpu: 12,
    uptime: '12d',
  },
  {
    id: 'srv-05',
    name: 'image-resizer',
    region: 'sa-east-1',
    status: 'offline',
    cpu: 0,
    uptime: '—',
  },
  {
    id: 'srv-06',
    name: 'search-indexer',
    region: 'sa-east-1',
    status: 'online',
    cpu: 44,
    uptime: '5d',
  },
  {
    id: 'srv-07',
    name: 'mail-relay',
    region: 'us-west-2',
    status: 'online',
    cpu: 9,
    uptime: '61d',
  },
  {
    id: 'srv-08',
    name: 'cron-runner',
    region: 'us-west-2',
    status: 'degraded',
    cpu: 73,
    uptime: '61d',
  },
]

const APARENCIA_STATUS = {
  online: 'success',
  degraded: 'warning',
  offline: 'destructive',
} as const

const columnHelper = createColumnHelper<DataGridFeatures, ServerRow>()

/**
 * Exercises the parts of the data grid that no application page turns on today:
 * column pinning, resizing, column drag-and-drop, row drag-and-drop and column
 * visibility. Those paths compile either way, so without a page actually
 * rendering them a runtime regression stays invisible.
 */
export default function DataGridDemoPage() {
  const [linhas, setLinhas] = useState(LINHAS)
  const [ordemColunas, setOrdemColunas] = useState<ColumnOrderState>([
    'name',
    'region',
    'status',
    'cpu',
    'uptime',
  ])
  const [linhasArrastaveis, setLinhasArrastaveis] = useState(false)

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('name', {
          id: 'name',
          meta: { headerTitle: 'Server' },
          header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Server" pinnable visibility />
          ),
          cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
          size: 200,
          enableSorting: true,
        }),
        columnHelper.accessor('region', {
          id: 'region',
          meta: { headerTitle: 'Region' },
          header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Region" pinnable visibility />
          ),
          cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">{row.original.region}</span>
          ),
          size: 160,
          enableSorting: true,
        }),
        columnHelper.accessor('status', {
          id: 'status',
          meta: { headerTitle: 'Status' },
          header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Status" pinnable visibility />
          ),
          cell: ({ row }) => (
            <Badge variant={APARENCIA_STATUS[row.original.status]} appearance="light" size="sm">
              {row.original.status}
            </Badge>
          ),
          size: 150,
          enableSorting: true,
        }),
        columnHelper.accessor('cpu', {
          id: 'cpu',
          meta: { headerTitle: 'CPU %' },
          header: ({ column }) => (
            <DataGridColumnHeader column={column} title="CPU %" pinnable visibility />
          ),
          cell: ({ row }) => <span className="tabular-nums">{row.original.cpu}%</span>,
          size: 140,
          enableSorting: true,
        }),
        columnHelper.accessor('uptime', {
          id: 'uptime',
          meta: { headerTitle: 'Uptime' },
          header: ({ column }) => (
            <DataGridColumnHeader column={column} title="Uptime" pinnable visibility />
          ),
          cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">{row.original.uptime}</span>
          ),
          size: 140,
          enableSorting: true,
        }),
      ]),
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    data: linhas,
    columns,
    state: { columnOrder: ordemColunas },
    onColumnOrderChange: setOrdemColunas,
    getRowId: (row) => row.id,
    columnResizeMode: 'onChange',
    enableColumnPinning: true,
    enableColumnResizing: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 5 },
      columnPinning: { start: ['name'], end: [] },
    },
  })

  const aoArrastarColuna = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrdemColunas((ordemAtual) => {
      const origem = ordemAtual.indexOf(active.id as string)
      const destino = ordemAtual.indexOf(over.id as string)
      return arrayMove(ordemAtual, origem, destino)
    })
  }

  const aoArrastarLinha = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLinhas((linhasAtuais) => {
      const origem = linhasAtuais.findIndex((linha) => linha.id === active.id)
      const destino = linhasAtuais.findIndex((linha) => linha.id === over.id)
      return arrayMove(linhasAtuais, origem, destino)
    })
  }

  const idsDasLinhas = useMemo(() => linhas.map((linha) => linha.id), [linhas])

  return (
    <MainLayout>
      <Head title="Data grid" />

      <PageHeader
        title="Data grid"
        description="Pinning, resizing, column and row drag-and-drop, and column visibility."
      />

      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Servers</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLinhasArrastaveis((valorAtual) => !valorAtual)}
            >
              {linhasArrastaveis ? 'Drag columns' : 'Drag rows'}
            </Button>
            <DataGridColumnVisibility
              table={table}
              trigger={
                <Button variant="outline" size="sm">
                  <Settings2 className="size-4" />
                  Columns
                </Button>
              }
            />
          </CardToolbar>
        </CardHeader>

        <CardContent>
          <DataGrid
            table={table}
            recordCount={linhas.length}
            tableLayout={{
              columnsPinnable: true,
              columnsResizable: true,
              columnsMovable: true,
              columnsVisibility: true,
              columnsDraggable: !linhasArrastaveis,
              rowsDraggable: linhasArrastaveis,
              width: 'fixed',
            }}
          >
            <DataGridContainer>
              {linhasArrastaveis ? (
                <DataGridTableDndRows handleDragEnd={aoArrastarLinha} dataIds={idsDasLinhas} />
              ) : (
                <DataGridTableDnd handleDragEnd={aoArrastarColuna} />
              )}
            </DataGridContainer>
            <DataGridPagination />
          </DataGrid>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
