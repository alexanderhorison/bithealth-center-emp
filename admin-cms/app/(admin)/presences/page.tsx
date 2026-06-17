import { PresenceDataTable } from '@/app/(admin)/presences/_components/presence-data-table';
import { PresenceFilter } from '@/app/(admin)/presences/_components/presence-filter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { presenceTableSearchParamsSchema, type PresenceSortField, type TableSortDirection } from '@/lib/validations/table-search-params';

type PresenceRow = {
  id: string;
  employee_id: string;
  presence_date: string;
  status: 'PRESENT' | 'WFH' | 'NOT_PRESENT' | 'GO_TO_CLIENT';
  selfie_url: string | null;
  note: string | null;
  employee: {
    full_name: string | null;
    email: string;
  } | null;
};

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const defaultPage = 1;
const defaultPageSize = 10;
const defaultSortBy: PresenceSortField = 'presence_date';
const defaultSortDir: TableSortDirection = 'desc';

function getSingleValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeSearchQuery(value: string | undefined): string {
  return (value ?? '').replace(/[%_]/g, '').replace(/,/g, ' ').trim();
}

export default async function PresenceManagementPage({ searchParams }: PageProps) {
  await requireAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const parsedFilter = presenceTableSearchParamsSchema.safeParse({
    date: getSingleValue(searchParams.date),
    q: getSingleValue(searchParams.q),
    page: getSingleValue(searchParams.page),
    pageSize: getSingleValue(searchParams.pageSize),
    sortBy: getSingleValue(searchParams.sortBy),
    sortDir: getSingleValue(searchParams.sortDir)
  });

  const filterDate = parsedFilter.success ? parsedFilter.data.date ?? today : today;
  const filterQuery = parsedFilter.success ? parsedFilter.data.q ?? '' : '';
  const page = parsedFilter.success ? parsedFilter.data.page ?? defaultPage : defaultPage;
  const pageSize = parsedFilter.success ? parsedFilter.data.pageSize ?? defaultPageSize : defaultPageSize;
  const sortBy = parsedFilter.success ? parsedFilter.data.sortBy ?? defaultSortBy : defaultSortBy;
  const sortDir = parsedFilter.success ? parsedFilter.data.sortDir ?? defaultSortDir : defaultSortDir;

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const supabase = createSupabaseAdminClient();

  let presenceQuery = supabase
    .schema('presence')
    .from('presences')
    .select('id, employee_id, presence_date, status, selfie_url, note, employees!inner(full_name, email)', { count: 'exact' })
    .eq('presence_date', filterDate);

  const normalizedQuery = normalizeSearchQuery(filterQuery);
  if (normalizedQuery) {
    presenceQuery = presenceQuery.or(`full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`, {
      foreignTable: 'employees'
    });
  }

  const isAscending = sortDir === 'asc';
  if (sortBy === 'employee') {
    presenceQuery = presenceQuery.order('full_name', {
      ascending: isAscending,
      foreignTable: 'employees'
    });
  } else if (sortBy === 'status') {
    presenceQuery = presenceQuery.order('status', { ascending: isAscending });
  } else if (sortBy === 'note') {
    presenceQuery = presenceQuery.order('note', { ascending: isAscending, nullsFirst: false });
  } else {
    presenceQuery = presenceQuery.order('presence_date', { ascending: isAscending });
  }

  const { data, error, count } = await presenceQuery.range(rangeFrom, rangeTo);

  if (error) {
    throw new Error(error.message);
  }

  const rows: PresenceRow[] = (data ?? []).map((item) => ({
    id: item.id,
    employee_id: item.employee_id,
    presence_date: item.presence_date,
    status: item.status,
    selfie_url: item.selfie_url,
    note: item.note,
    employee: Array.isArray(item.employees) ? item.employees[0] ?? null : item.employees
  }));
  const totalCount = count ?? 0;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Presence Management</h1>
        <p className="text-sm text-muted-foreground">Showing data for {filterDate}. Use date filter to change.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <PresenceFilter currentDate={filterDate} defaultDate={today} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presence Records</CardTitle>
          <CardDescription>Server-side data table for selected date filter.</CardDescription>
        </CardHeader>
        <CardContent>
          <PresenceDataTable
            rows={rows}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            sortBy={sortBy}
            sortDir={sortDir}
          />
        </CardContent>
      </Card>
    </main>
  );
}
