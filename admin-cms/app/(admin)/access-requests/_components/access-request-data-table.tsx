'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  ACCESS_REQUEST_PROVIDER_BADGE_CLASSES,
  ACCESS_REQUEST_STATUS_BADGE_CLASSES,
  ACCESS_REQUEST_TYPE_LABELS
} from '@/lib/access-requests/constants';
import type { AccessRequestRecord, AccessRequestSortBy, AccessRequestSortDir } from '@/lib/access-requests/types';
import { cn } from '@/lib/utils';

type AccessRequestDataTableProps = {
  rows: AccessRequestRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy: AccessRequestSortBy;
  sortDir: AccessRequestSortDir;
};

export function AccessRequestDataTable({
  rows,
  page,
  pageSize,
  totalCount,
  sortBy,
  sortDir
}: AccessRequestDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'ALL') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const onSort = useCallback(
    (field: AccessRequestSortBy) => {
      const nextDir: AccessRequestSortDir = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
      updateParams({ sortBy: field, sortDir: nextDir, page: '1' });
    },
    [sortBy, sortDir, updateParams]
  );

  const columns = useMemo<ColumnDef<AccessRequestRecord>[]>(
    () => [
      {
        id: 'created_at',
        header: () => (
          <SortButton active={sortBy === 'created_at'} direction={sortDir} onClick={() => onSort('created_at')}>
            Date
          </SortButton>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{new Date(row.original.created_at).toISOString().slice(0, 10)}</span>
        )
      },
      {
        id: 'employee',
        header: 'Employee',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.employee?.full_name ?? '-'}</p>
            <p className="text-muted-foreground">{row.original.employee?.email ?? '-'}</p>
          </div>
        )
      },
      {
        id: 'provider',
        header: () => (
          <SortButton active={sortBy === 'provider'} direction={sortDir} onClick={() => onSort('provider')}>
            Provider
          </SortButton>
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
              ACCESS_REQUEST_PROVIDER_BADGE_CLASSES[row.original.provider]
            )}
          >
            {row.original.provider}
          </span>
        )
      },
      {
        id: 'request_type',
        header: 'Type',
        cell: ({ row }) => <span className="whitespace-nowrap">{ACCESS_REQUEST_TYPE_LABELS[row.original.request_type]}</span>
      },
      {
        id: 'target_url',
        header: 'Target',
        cell: ({ row }) => (
          row.original.target_url ? (
            <Link href={row.original.target_url} className="text-primary underline" target="_blank" rel="noreferrer">
              {row.original.target_url}
            </Link>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        )
      },
      {
        id: 'justification',
        header: 'Justification',
        cell: ({ row }) => (
          <p className="line-clamp-1 text-sm text-muted-foreground">{row.original.justification}</p>
        )
      },
      {
        id: 'status',
        header: () => (
          <SortButton active={sortBy === 'status'} direction={sortDir} onClick={() => onSort('status')}>
            Status
          </SortButton>
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
              ACCESS_REQUEST_STATUS_BADGE_CLASSES[row.original.status]
            )}
          >
            {row.original.status}
          </span>
        )
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link href={`/access-requests/${row.original.id}`} prefetch={false}>
              <Button variant="outline" className="h-8 px-3">
                Detail
              </Button>
            </Link>
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
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize))
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
        {!table.getRowModel().rows.length ? <p className="pt-4 text-sm text-muted-foreground">No requests found.</p> : null}
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
  direction: AccessRequestSortDir;
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
