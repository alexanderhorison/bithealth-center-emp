'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const onSignOut = async () => {
    setIsPending(true);

    await fetch('/api/auth/sign-out', {
      method: 'POST'
    });

    router.replace('/');
    router.refresh();
  };

  return (
    <Button type="button" variant="outline" onClick={onSignOut} disabled={isPending} aria-label="Sign out">
      {isPending ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
