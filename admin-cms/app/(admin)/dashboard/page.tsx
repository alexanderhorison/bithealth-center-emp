import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export default async function AdminDashboardPage() {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [employeeResult, presenceTodayResult, pendingRequestResult] = await Promise.all([
    supabase.schema('presence').from('employees').select('id', { count: 'exact', head: true }),
    supabase
      .schema('presence')
      .from('presences')
      .select('id', { count: 'exact', head: true })
      .eq('presence_date', today),
    supabase
      .schema('presence')
      .from('access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PENDING')
  ]);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
            <CardDescription>All records in employee master data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{employeeResult.count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Presence Today</CardTitle>
            <CardDescription>{today}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-zinc-900">{presenceTodayResult.count ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>All access requests awaiting admin action</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-zinc-900">{pendingRequestResult.count ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
