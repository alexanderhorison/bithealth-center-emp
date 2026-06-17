import Link from 'next/link';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { Button } from '@/components/ui/button';

export default function NotAuthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Not Authorized</h1>
      <p className="text-sm text-muted-foreground">
        You are signed in but do not have admin access. Ask an existing admin to set your employee role to
        <strong> admin</strong> in Role Management.
      </p>
      <div className="flex items-center gap-2">
        <SignOutButton />
        <Link href="/">
          <Button variant="outline" aria-label="Go to home page">
            Back to Home
          </Button>
        </Link>
      </div>
    </main>
  );
}
