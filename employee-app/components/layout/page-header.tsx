import { Grid3X3 } from 'lucide-react';
import Link from 'next/link';

import { UserMenu } from '@/components/auth/user-menu';

type PageHeaderProps = {
  fullName: string | null;
  email: string;
  subtitle?: string;
};

export function PageHeader({
  fullName,
  email,
  subtitle = 'Manage your daily operations from Bithealth Center.'
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="min-w-0 flex-1 pr-4">
        <h1 className="truncate text-lg font-bold sm:text-2xl">
          Hello, {fullName ?? email}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/modules"
          prefetch={false}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 transition hover:bg-zinc-300 hover:text-zinc-900"
          aria-label="Open modules"
        >
          <Grid3X3 className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="shrink-0 pt-0.5">
          <UserMenu fullName={fullName} email={email} />
        </div>
      </div>
    </div>
  );
}
