import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/user-menu';
import { requireEmployeeUser } from '@/lib/auth/server';

export default async function ModulesPage() {
  const user = await requireEmployeeUser();
  const displayName = user.fullName ?? user.email;
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hello, {displayName}</h1>
          <p className="text-sm text-muted-foreground">
            Manage your daily operations from Bithealth Center.
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          <UserMenu fullName={user.fullName} email={user.email} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/presence" className="block">
          <Card className="h-full transition hover:border-zinc-400 hover:bg-zinc-50">
            <CardHeader>
              <CardTitle>Presence</CardTitle>
              <CardDescription>Submit your daily status and optional selfie.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm font-medium text-zinc-700">
              Open module
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full border-dashed opacity-80">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Account Request</CardTitle>
              <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Coming Soon
              </span>
            </div>
            <CardDescription>Request GitHub repository and Figma account access.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">This module is planned.</CardContent>
        </Card>

        <Card className="h-full border-dashed opacity-80">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Leave Request</CardTitle>
              <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Coming Soon
              </span>
            </div>
            <CardDescription>Plan and submit leave requests.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">This module is in development.</CardContent>
        </Card>

        <Card className="h-full border-dashed opacity-80">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Asset Request</CardTitle>
              <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                Coming Soon
              </span>
            </div>
            <CardDescription>Request tools and equipment from operations.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">This module is in development.</CardContent>
        </Card>
      </div>
    </main>
  );
}
