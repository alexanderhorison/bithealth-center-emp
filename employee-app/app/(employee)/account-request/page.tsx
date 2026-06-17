import { Grid3X3 } from 'lucide-react';
import Link from 'next/link';

import { AccountRequestForm } from '@/app/(employee)/account-request/_components/account-request-form';
import { RequestHistory } from '@/app/(employee)/account-request/_components/request-history';
import { UserMenu } from '@/components/auth/user-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireEmployeeUser } from '@/lib/auth/server';
import { syncEmployee } from '@/lib/employee/sync';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  accessRequestSearchParamsSchema,
  type CreateAccessRequestInput
} from '@/lib/validations/access-request';

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function getSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AccountRequestPage({ searchParams }: PageProps) {
  const user = await requireEmployeeUser();
  const employee = await syncEmployee({
    userId: user.id,
    primaryEmail: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl
  });

  const parsed = accessRequestSearchParamsSchema.safeParse({
    page: getSingle(searchParams.page),
    pageSize: getSingle(searchParams.pageSize)
  });

  const page = parsed.success ? parsed.data.page ?? 1 : 1;
  const pageSize = parsed.success ? parsed.data.pageSize ?? 10 : 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseAdminClient();
  const { data, error, count } = await supabase
    .schema('presence')
    .from('access_requests')
    .select('id, provider, request_type, target_url, display_name, justification, extra_info, status, admin_note, resolved_by, resolved_at, created_at', {
      count: 'exact'
    })
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  const rows = data ?? [];
  const total = count ?? 0;

  const formDefaults: Partial<CreateAccessRequestInput> = {
    provider: 'GITHUB',
    requestType: 'REPO_ACCESS'
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hello, {employee.full_name ?? user.email}</h1>
          <p className="text-sm text-muted-foreground">
            Manage your daily operations from Bithealth Center.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/modules"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 transition hover:bg-zinc-300 hover:text-zinc-900"
            aria-label="Open modules"
          >
            <Grid3X3 className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="shrink-0 pt-0.5">
            <UserMenu fullName={user.fullName} email={user.email} />
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Unable to load request history: {error.message}
        </div>
      ) : null}

      <RequestHistory rows={rows} page={page} pageSize={pageSize} totalCount={total} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Request</CardTitle>
          <CardDescription>Request GitHub repository or Figma access.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountRequestForm defaults={formDefaults} />
        </CardContent>
      </Card>
    </main>
  );
}
