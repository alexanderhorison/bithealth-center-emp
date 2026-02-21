import { CalendarDays, ChevronDown, Grid3X3, UserRound } from 'lucide-react';
import Link from 'next/link';

import { PresenceForm } from '@/app/(employee)/presence/_components/presence-form';
import { UserMenu } from '@/components/auth/user-menu';
import { type AuthenticatedEmployeeUser } from '@/lib/auth/shared';
import { requireEmployeeUser } from '@/lib/auth/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { syncEmployee } from '@/lib/employee/sync';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

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

type HistoryPresenceRow = Pick<PresenceRow, 'status' | 'presence_date' | 'updated_at'>;

const presenceStatusMeta: Record<
  PresenceRow['status'],
  { label: string; className: string }
> = {
  PRESENT: {
    label: 'Present',
    className: 'bg-emerald-100 text-emerald-800'
  },
  WFH: {
    label: 'WFH',
    className: 'bg-sky-100 text-sky-800'
  },
  NOT_PRESENT: {
    label: 'Not Present',
    className: 'bg-zinc-200 text-zinc-700'
  },
  GO_TO_CLIENT: {
    label: 'Go to Client',
    className: 'bg-amber-100 text-amber-800'
  }
};

function formatHistoryDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function formatHistoryTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

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
      .select('status, presence_date, updated_at')
      .eq('employee_id', employee.id)
      .order('presence_date', { ascending: false })
      .limit(7)
  ]);

  const todayPresence = todayResult.data;
  const historyEntries = (historyResult.data ?? []) as HistoryPresenceRow[];

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

      <Card className="mb-6">
        <details className="group">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Last 7 Entries</CardTitle>
                  <CardDescription>Recent submission history. Expand when needed.</CardDescription>
                </div>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </div>
            </CardHeader>
          </summary>
          <CardContent>
            <div className="space-y-3">
              {historyEntries.length ? (
                historyEntries.map((presence) => (
                  <div
                    key={`${presence.presence_date}-${presence.updated_at}`}
                    className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
                        <CalendarDays className="h-4 w-4 text-stone-500" aria-hidden="true" />
                        <span>{formatHistoryDate(presence.presence_date)}</span>
                      </div>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          presenceStatusMeta[presence.status].className
                        )}
                      >
                        {presenceStatusMeta[presence.status].label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-2">
                      <p className="text-xs text-muted-foreground">Date: {presence.presence_date}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatHistoryTime(presence.updated_at)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center">
                  <UserRound className="mx-auto mb-2 h-5 w-5 text-stone-400" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">No history yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </details>
      </Card>

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
          />
        </CardContent>
      </Card>
    </main>
  );
}
