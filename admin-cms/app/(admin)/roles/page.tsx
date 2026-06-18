import Link from 'next/link';

import { RoleDataTable } from '@/app/(admin)/roles/_components/role-data-table';
import { RoleFilter } from '@/app/(admin)/roles/_components/role-filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { roleTableSearchParamsSchema, type RoleSortField, type TableSortDirection } from '@/lib/validations/table-search-params';

type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  app: string;
};

type EmployeeRoleCountRow = {
  role_id: string;
};

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const defaultPage = 1;
const defaultPageSize = 10;
const defaultSortBy: RoleSortField = 'name';
const defaultSortDir: TableSortDirection = 'asc';

function getSingleValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeSearchQuery(value: string | undefined): string {
  return (value ?? '').replace(/[%_]/g, '').replace(/,/g, ' ').trim();
}

export default async function RoleManagementPage({ searchParams }: PageProps) {
  await requireAdmin();

  const parsed = roleTableSearchParamsSchema.safeParse({
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
  let roleQuery = supabase.schema('presence').from('roles').select('id, code, name, description, is_system, app', { count: 'exact' });

  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery) {
    roleQuery = roleQuery.or(`code.ilike.%${normalizedQuery}%,name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
  }

  const isAscending = sortDir === 'asc';
  if (sortBy === 'code') {
    roleQuery = roleQuery.order('code', { ascending: isAscending });
  } else if (sortBy === 'description') {
    roleQuery = roleQuery.order('description', { ascending: isAscending, nullsFirst: false });
  } else if (sortBy === 'is_system') {
    roleQuery = roleQuery.order('is_system', { ascending: isAscending });
  } else {
    roleQuery = roleQuery.order('name', { ascending: isAscending });
  }

  const { data: roleData, error: roleError, count } = await roleQuery.range(rangeFrom, rangeTo);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const roles = (roleData ?? []) as RoleRow[];
  const totalCount = count ?? 0;
  const roleCounts = new Map<string, number>();
  const roleIds = roles.map((role) => role.id);

  if (roleIds.length > 0) {
    const { data: employeeRoleData, error: employeeRoleError } = await supabase
      .schema('presence')
      .from('employee_roles')
      .select('role_id')
      .in('role_id', roleIds);

    if (employeeRoleError) {
      throw new Error(employeeRoleError.message);
    }

    for (const row of (employeeRoleData ?? []) as EmployeeRoleCountRow[]) {
      roleCounts.set(row.role_id, (roleCounts.get(row.role_id) ?? 0) + 1);
    }
  }

  const rows = roles.map((role) => ({
    ...role,
    employee_count: roleCounts.get(role.id) ?? 0
  }));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-sm text-muted-foreground">Manage role master data and attach role to employees.</p>
        </div>
        <Link href="/roles/new">
          <Button aria-label="Create role">Add Role</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RoleFilter query={query} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Roles</CardTitle>
            <span className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'Role' : 'Roles'}
            </span>
          </div>
          <CardDescription>Master role table used by employee records and CMS access control.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleDataTable
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
