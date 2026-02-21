'use client';

import { Button } from '@/components/ui/button';

export default function PresenceError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold">Unable to load presence module</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset} aria-label="Retry presence request">
        Retry
      </Button>
    </main>
  );
}
