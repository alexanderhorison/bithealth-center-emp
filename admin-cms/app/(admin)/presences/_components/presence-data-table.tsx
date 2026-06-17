'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

import { DeletePresenceButton } from '@/app/(admin)/presences/_components/delete-presence-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PresenceSortField, TableSortDirection } from '@/lib/validations/table-search-params';

type PresenceStatus = 'PRESENT' | 'WFH' | 'NOT_PRESENT' | 'GO_TO_CLIENT';

type PresenceRow = {
  id: string;
  employee_id: string;
  presence_date: string;
  status: PresenceStatus;
  selfie_url: string | null;
  note: string | null;
  employee: {
    full_name: string | null;
    email: string;
  } | null;
};

type PresenceDataTableProps = {
  rows: PresenceRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  sortBy: PresenceSortField;
  sortDir: TableSortDirection;
};

function statusBadge(status: PresenceStatus) {
  if (status === 'PRESENT') {
    return (
      <span className="inline-flex rounded-full bg-stone-200 px-2.5 py-1 text-xs font-medium text-zinc-700">
        Present
      </span>
    );
  }

  if (status === 'WFH') {
    return (
      <span className="inline-flex rounded-full bg-stone-300 px-2.5 py-1 text-xs font-medium text-zinc-700">
        WFH
      </span>
    );
  }

  if (status === 'GO_TO_CLIENT') {
    return (
      <span className="inline-flex rounded-full bg-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-800">
        Go to Client
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600">
      Not Present
    </span>
  );
}

export function PresenceDataTable({ rows, page, pageSize, totalCount, sortBy, sortDir }: PresenceDataTableProps) {
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

  const onSort = useCallback((field: PresenceSortField) => {
    const nextDirection: TableSortDirection = sortBy === field && sortDir === 'asc' ? 'desc' : 'asc';
    updateParams({
      sortBy: field,
      sortDir: nextDirection,
      page: '1'
    });
  }, [sortBy, sortDir, updateParams]);

  const columns = useMemo<ColumnDef<PresenceRow>[]>(
    () => [
      {
        id: 'presence_date',
        header: () => (
          <SortButton active={sortBy === 'presence_date'} direction={sortDir} onClick={() => onSort('presence_date')}>
            Date
          </SortButton>
        ),
        cell: ({ row }) => row.original.presence_date
      },
      {
        id: 'employee',
        header: () => (
          <SortButton active={sortBy === 'employee'} direction={sortDir} onClick={() => onSort('employee')}>
            Employee
          </SortButton>
        ),
        cell: ({ row }) => (
          <>
            <p className="font-medium">{row.original.employee?.full_name ?? '-'}</p>
            <p className="text-muted-foreground">{row.original.employee?.email ?? '-'}</p>
          </>
        )
      },
      {
        id: 'status',
        header: () => (
          <SortButton active={sortBy === 'status'} direction={sortDir} onClick={() => onSort('status')}>
            Status
          </SortButton>
        ),
        cell: ({ row }) => statusBadge(row.original.status)
      },
      {
        id: 'selfie',
        header: 'Selfie',
        cell: ({ row }) =>
          row.original.selfie_url ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-md border">
              <Image src={row.original.selfie_url} alt="Employee selfie" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
      },
      {
        id: 'note',
        header: () => (
          <SortButton active={sortBy === 'note'} direction={sortDir} onClick={() => onSort('note')}>
            Note
          </SortButton>
        ),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.note ?? '-'}</span>
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => <DeletePresenceButton presenceId={row.original.id} />
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
                  <td key={cell.id} className={cn('px-2 py-3', cell.column.id === 'note' && 'max-w-64')}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!table.getRowModel().rows.length ? <p className="pt-4 text-sm text-muted-foreground">No records found.</p> : null}
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
