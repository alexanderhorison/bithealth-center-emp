import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { requireEmployeeUser } from '@/lib/auth/server';

export default async function ModulesPage() {
  const user = await requireEmployeeUser();
  return (
    <main className="min-h-screen bg-stone-100">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader fullName={user.fullName} email={user.email} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/presence" className="block">
            <Card className="h-full border-stone-300 bg-stone-50 transition hover:border-stone-400">
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

          <Link href="/account-request" className="block">
            <Card className="h-full border-stone-300 bg-stone-50 transition hover:border-stone-400">
              <CardHeader>
                <CardTitle>Account Request</CardTitle>
                <CardDescription>Request GitHub repo access or Figma access.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm font-medium text-zinc-700">
                Open module
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>

          <Card className="h-full border-dashed border-stone-300 bg-stone-100/70 text-zinc-500">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-zinc-600">Leave Request</CardTitle>
                <span className="rounded-full border border-stone-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Coming Soon
                </span>
              </div>
              <CardDescription className="text-zinc-500">Plan and submit leave requests.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="h-full border-dashed border-stone-300 bg-stone-100/70 text-zinc-500">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-zinc-600">Asset Request</CardTitle>
                <span className="rounded-full border border-stone-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Coming Soon
                </span>
              </div>
              <CardDescription className="text-zinc-500">Request tools and equipment from operations.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}
