import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold text-zinc-800">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to access this page. Contact your administrator to request access.
        </p>
        <Link href="/modules">
          <Button variant="outline" className="mt-2">
            Back to Modules
          </Button>
        </Link>
      </div>
    </main>
  );
}
