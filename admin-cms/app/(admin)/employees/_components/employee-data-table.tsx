'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

import { ToggleEmployeeButton } from '@/app/(admin)/employees/_components/toggle-employee-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EmployeeSortField, TableSortDirection } from '@/lib/validations/table-search-params';

type EmployeeRow = {
  id: string;
  full_name: string | null;
  email: string;
  auth_user_id: string | null;
  is_active: boolean;
  role_id: string;
  roles:
    | {
        id: string;
        code: string;
        name: string;
      }
    | Array<{
        id: string;
        code: string;
        name: string;
      }>
    | null;
  created_at: string;
};

type EmployeeDataTableProps = {
  rows: EmployeeRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy: EmployeeSortField;
  sortDir: TableSortDirection;
};

function normalizeRole(
  role: EmployeeRow['roles']
):
  | {
      id: string;
      code: string;
      name: string;
    }
  | null {
  if (Array.isArray(role)) {
    return role[0] ?? null;
  }

  return role ?? null;
}

export function EmployeeDataTable({ rows, page, pageSize, totalCount, sortBy, sortDir }: EmployeeDataTableProps) {
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

  const onSort = useCallback((field: EmployeeSortField) => {
    const nextDirection: TableSortDirection = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
    updateParams({
      sortBy: field,
      sortDir: nextDirection,
      page: '1'
    });
  }, [sortBy, sortDir, updateParams]);

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        id: 'full_name',
        header: () => (
          <SortButton active={sortBy === 'full_name'} direction={sortDir} onClick={() => onSort('full_name')}>
            Name
          </SortButton>
        ),
        cell: ({ row }) => row.original.full_name ?? '-'
      },
      {
        id: 'email',
        header: () => (
          <SortButton active={sortBy === 'email'} direction={sortDir} onClick={() => onSort('email')}>
            Email
          </SortButton>
        ),
        cell: ({ row }) => row.original.email
      },
      {
        id: 'auth_user_id',
        header: 'Auth User ID',
        cell: ({ row }) => row.original.auth_user_id ?? '-'
      },
      {
        id: 'is_active',
        header: () => (
          <SortButton active={sortBy === 'is_active'} direction={sortDir} onClick={() => onSort('is_active')}>
            Status
          </SortButton>
        ),
        cell: ({ row }) =>
          row.original.is_active ? (
            <span className="inline-flex rounded-full bg-stone-200 px-2.5 py-1 text-xs font-medium text-zinc-700">Active</span>
          ) : (
            <span className="inline-flex rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600">Disabled</span>
          )
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = normalizeRole(row.original.roles);
          const isAdmin = role?.code === 'ADMIN';
          return (
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                isAdmin ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-200 text-zinc-700'
              )}
            >
              {role?.name ?? 'Unassigned'}
            </span>
          );
        }
      },
      {
        id: 'created_at',
        header: () => (
          <SortButton active={sortBy === 'created_at'} direction={sortDir} onClick={() => onSort('created_at')}>
            Created
          </SortButton>
        ),
        cell: ({ row }) => new Date(row.original.created_at).toISOString().slice(0, 10)
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/employees/${row.original.id}/edit`}>
              <Button variant="outline" className="h-8 px-3" aria-label="Edit employee">
                Edit
              </Button>
            </Link>
            <ToggleEmployeeButton employeeId={row.original.id} isActive={row.original.is_active} />
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
        {!table.getRowModel().rows.length ? <p className="pt-4 text-sm text-muted-foreground">No employees found.</p> : null}
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
