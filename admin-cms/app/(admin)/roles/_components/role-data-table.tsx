'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

import { DeleteRoleButton } from '@/app/(admin)/roles/_components/delete-role-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RoleSortField, TableSortDirection } from '@/lib/validations/table-search-params';

type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  employee_count: number;
};

type RoleDataTableProps = {
  rows: RoleRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy: RoleSortField;
  sortDir: TableSortDirection;
};

export function RoleDataTable({ rows, page, pageSize, totalCount, sortBy, sortDir }: RoleDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [pathname, router, searchParams]);

  const onSort = useCallback((field: RoleSortField) => {
    const nextDirection: TableSortDirection = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
    updateParams({
      sortBy: field,
      sortDir: nextDirection,
      page: '1'
    });
  }, [sortBy, sortDir, updateParams]);

  const columns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        id: 'code',
        header: () => (
          <SortButton active={sortBy === 'code'} direction={sortDir} onClick={() => onSort('code')}>
            Code
          </SortButton>
        ),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>
      },
      {
        id: 'name',
        header: () => (
          <SortButton active={sortBy === 'name'} direction={sortDir} onClick={() => onSort('name')}>
            Name
          </SortButton>
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
      },
      {
        id: 'description',
        header: () => (
          <SortButton active={sortBy === 'description'} direction={sortDir} onClick={() => onSort('description')}>
            Description
          </SortButton>
        ),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.description ?? '-'}</span>
      },
      {
        id: 'is_system',
        header: () => (
          <SortButton active={sortBy === 'is_system'} direction={sortDir} onClick={() => onSort('is_system')}>
            Type
          </SortButton>
        ),
        cell: ({ row }) => (
          <span className="inline-flex rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700">
            {row.original.is_system ? 'System' : 'Custom'}
          </span>
        )
      },
      {
        id: 'employee_count',
        header: 'Assigned',
        cell: ({ row }) => row.original.employee_count
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/roles/${row.original.id}/edit`}>
              <Button variant="outline" className="h-8 px-3" aria-label="Edit role">
                Edit
              </Button>
            </Link>
            <DeleteRoleButton roleId={row.original.id} roleName={row.original.name} disabled={row.original.is_system} />
          </div>
        )
      }
    ],
    [onSort, sortBy, sortDir]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-2 py-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b align-top">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!table.getRowModel().rows.length ? <p className="pt-4 text-sm text-muted-foreground">No roles found.</p> : null}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 px-3"
            onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            className="h-8 px-3"
            onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

type SortButtonProps = {
  children: ReactNode;
  active: boolean;
  direction: TableSortDirection;
  onClick: () => void;
};

function SortButton({ children, active, direction, onClick }: SortButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium text-zinc-700 transition hover:text-zinc-900',
        active && 'text-zinc-900'
      )}
      onClick={onClick}
      aria-label={`Sort by ${typeof children === 'string' ? children.toLowerCase() : 'column'}`}
    >
      {children}
      <ArrowUpDown className={cn('h-3.5 w-3.5', active && direction === 'desc' && 'rotate-180')} aria-hidden="true" />
    </button>
  );
}
