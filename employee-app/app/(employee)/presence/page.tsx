import { PresenceForm } from '@/app/(employee)/presence/_components/presence-form';
import { PresenceHistory } from '@/app/(employee)/presence/_components/presence-history';
import { type HistoryPresenceRow } from '@/app/(employee)/presence/_shared';
import { PageHeader } from '@/components/layout/page-header';
import { type AuthenticatedEmployeeUser } from '@/lib/auth/shared';
import { requireEmployeeUser } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { syncEmployee } from '@/lib/employee/sync';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type EmployeeRow = {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
};

type PresenceRow = {
  status: 'PRESENT' | 'WFH' | 'NOT_PRESENT' | 'GO_TO_CLIENT';
  selfie_url: string | null;
  note: string | null;
  presence_date: string;
  updated_at: string;
};

async function getOrCreateEmployee(user: AuthenticatedEmployeeUser): Promise<EmployeeRow> {
  return syncEmployee({
    userId: user.id,
    primaryEmail: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl
  });
}

export default async function EmployeePresencePage() {
  const user = await requireEmployeeUser();
  const employee = await getOrCreateEmployee(user);

  if (!employee.is_active) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Account Disabled</CardTitle>
            <CardDescription>Your admin has disabled this account.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [todayResult, historyResult] = await Promise.all([
    supabase
      .schema('presence')
      .from('presences')
      .select('status, selfie_url, note, presence_date, updated_at')
      .eq('employee_id', employee.id)
      .eq('presence_date', today)
      .maybeSingle<PresenceRow>(),
    supabase
      .schema('presence')
      .from('presences')
      .select('status, presence_date, updated_at, note')
      .eq('employee_id', employee.id)
      .order('presence_date', { ascending: false })
      .limit(7)
  ]);

  const todayPresence = todayResult.data;
  const historyEntries = (historyResult.data ?? []) as HistoryPresenceRow[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader fullName={employee.full_name} email={user.email} />

      {/* GAP-PRES-04: History now lives in a client component that supports "Load more". */}
      <PresenceHistory initialEntries={historyEntries} />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Presence</CardTitle>
          <CardDescription>Choose your status and optionally upload a selfie.</CardDescription>
        </CardHeader>
        <CardContent>
          <PresenceForm
            initialStatus={todayPresence?.status ?? 'PRESENT'}
            initialSelfieUrl={todayPresence?.selfie_url}
            initialNote={todayPresence?.note}
            hasExistingSubmission={!!todayPresence}
          />
        </CardContent>
      </Card>
    </main>
  );
}
