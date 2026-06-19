import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { requireEmployeeUser } from '@/lib/auth/server';
import { hasRouteAccess } from '@/lib/employee/sync';

export default async function ModulesPage() {
  const user = await requireEmployeeUser();

  const canPresence = hasRouteAccess(user.roles, 'presence');
  const canAccountRequest = hasRouteAccess(user.roles, 'account-request');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader fullName={user.fullName} email={user.email} />

        <div className="grid gap-4 sm:grid-cols-2">
          {canPresence && (
            <Link href="/presence" prefetch={false} className="group block">
              <Card className="h-full border-border bg-background transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:bg-brand-25 group-hover:shadow-sm">
                <CardHeader>
                  <CardTitle className="transition-colors group-hover:text-brand-700">Presence</CardTitle>
                  <CardDescription>Submit your daily status and optional selfie.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm font-medium text-text-secondary transition-colors group-hover:text-brand-600">
                  Open module
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </CardContent>
              </Card>
            </Link>
          )}

          {canAccountRequest && (
            <Link href="/account-request" prefetch={false} className="group block">
              <Card className="h-full border-border bg-background transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:bg-brand-25 group-hover:shadow-sm">
                <CardHeader>
                  <CardTitle className="transition-colors group-hover:text-brand-700">Account Request</CardTitle>
                  <CardDescription>Request GitHub repo access or Figma access.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm font-medium text-text-secondary transition-colors group-hover:text-brand-600">
                  Open module
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </CardContent>
              </Card>
            </Link>
          )}

          <Card className="h-full border-dashed border-border bg-surface-subtle text-text-disabled">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-text-secondary">Leave Request</CardTitle>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary bg-white">
                  Coming Soon
                </span>
              </div>
              <CardDescription className="text-text-disabled">Plan and submit leave requests.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="h-full border-dashed border-border bg-surface-subtle text-text-disabled">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-text-secondary">Asset Request</CardTitle>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary bg-white">
                  Coming Soon
                </span>
              </div>
              <CardDescription className="text-text-disabled">Request tools and equipment from operations.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}
