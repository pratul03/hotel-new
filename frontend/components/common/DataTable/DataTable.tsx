'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { DataTableToolbar } from './DataTableToolbar'
import { DataTablePagination } from './DataTablePagination'
import { useState, useEffect } from 'react'

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  totalCount: number
  page: number
  limit: number
  isLoading?: boolean
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  addLabel?: string
  onAdd?: () => void
  onPageChange: (page: number) => void
}

export function DataTable<TData>({
  columns,
  data,
  totalCount,
  page,
  limit,
  isLoading = false,
  searchPlaceholder = 'Search...',
  onSearch,
  addLabel,
  onAdd,
  onPageChange,
}: DataTableProps<TData>) {
  const [searchValue, setSearchValue] = useState('')

  const table = useReactTable({
    data: isLoading ? Array(limit).fill({}) : data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleSearch = (query: string) => {
    setSearchValue(query)
    onSearch?.(query)
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        onSearch={handleSearch}
        searchValue={searchValue}
        searchPlaceholder={searchPlaceholder}
        addLabel={addLabel}
        onAdd={onAdd}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(limit)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No data</EmptyTitle>
                      <EmptyDescription>No data found</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        pageSize={limit}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}
