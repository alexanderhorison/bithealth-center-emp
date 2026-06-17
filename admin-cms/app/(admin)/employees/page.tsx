import { EmployeeDataTable } from '@/app/(admin)/employees/_components/employee-data-table';
import { EmployeeFilter } from '@/app/(admin)/employees/_components/employee-filter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  employeeTableSearchParamsSchema,
  type EmployeeSortField,
  type TableSortDirection
} from '@/lib/validations/table-search-params';

type EmployeeRow = {
  id: string;
  full_name: string | null;
  email: string;
  auth_user_id: string | null;
  is_active: boolean;
  employee_roles: Array<{
    roles: { id: string; code: string; name: string; app: string } | null;
  }>;
  created_at: string;
};

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const defaultPage = 1;
const defaultPageSize = 10;
const defaultSortBy: EmployeeSortField = 'created_at';
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

export default async function EmployeeManagementPage({ searchParams }: PageProps) {
  await requireAdmin();

  const parsed = employeeTableSearchParamsSchema.safeParse({
    page: getSingleValue(searchParams.page),
    pageSize: getSingleValue(searchParams.pageSize),
    q: getSingleValue(searchParams.q),
    sortBy: getSingleValue(searchParams.sortBy),
    sortDir: getSingleValue(searchParams.sortDir)
  });

  const page = parsed.success ? parsed.data.page ?? defaultPage : defaultPage;
  const pageSize = parsed.success ? parsed.data.pageSize ?? defaultPageSize : defaultPageSize;
  const query = parsed.success ? parsed.data.q ?? '' : '';
  const sortBy = parsed.success ? parsed.data.sortBy ?? defaultSortBy : defaultSortBy;
  const sortDir = parsed.success ? parsed.data.sortDir ?? defaultSortDir : defaultSortDir;

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  const supabase = createSupabaseAdminClient();
  let employeeQuery = supabase
    .schema('presence')
    .from('employees')
    .select('id, full_name, email, auth_user_id, is_active, employee_roles!employee_roles_employee_id_fkey(roles(id, code, name, app)), created_at', {
      count: 'exact'
    });

  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery) {
    employeeQuery = employeeQuery.or(
      `full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%,auth_user_id.ilike.%${normalizedQuery}%`
    );
  }

  const isAscending = sortDir === 'asc';
  if (sortBy === 'full_name') {
    employeeQuery = employeeQuery.order('full_name', { ascending: isAscending });
  } else if (sortBy === 'email') {
    employeeQuery = employeeQuery.order('email', { ascending: isAscending });
  } else if (sortBy === 'is_active') {
    employeeQuery = employeeQuery.order('is_active', { ascending: isAscending });
  } else {
    employeeQuery = employeeQuery.order('created_at', { ascending: isAscending });
  }

  const { data, error, count } = await employeeQuery.range(rangeFrom, rangeTo);

  if (error) {
    throw new Error(error.message);
  }

  const employees = (data ?? []) as unknown as EmployeeRow[];
  const totalCount = count ?? 0;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Management</h1>
        <p className="text-sm text-muted-foreground">Manage employee records linked to Supabase Auth accounts.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <EmployeeFilter query={query} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Employees</CardTitle>
            <span className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'Employee' : 'Employees'}
            </span>
          </div>
          <CardDescription>Server-side data table with search, sorting, and pagination.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeDataTable
            rows={employees}
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
