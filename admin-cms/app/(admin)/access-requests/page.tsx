import { AccessRequestDataTable } from '@/app/(admin)/access-requests/_components/access-request-data-table';
import { AccessRequestFilter } from '@/app/(admin)/access-requests/_components/access-request-filter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';
import { AccessRequestService } from '@/lib/access-requests/service';

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AccessRequestsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const accessRequestService = new AccessRequestService();
  const result = await accessRequestService.getPaginated(searchParams);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Requests</h1>
        <p className="text-sm text-muted-foreground">Manage GitHub and Figma access requests.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <AccessRequestFilter
            query={result.filters.q}
            provider={result.filters.provider}
            status={result.filters.status}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>Server-side table with filters and status updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccessRequestDataTable
            rows={result.rows}
            page={result.filters.page}
            pageSize={result.filters.pageSize}
            totalCount={result.totalCount}
            sortBy={result.filters.sortBy}
            sortDir={result.filters.sortDir}
          />
        </CardContent>
      </Card>
    </main>
  );
}
