'use client';

import { Button } from '@/components/ui/button';

export default function PresencesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <h2 className="text-xl font-semibold">Unable to load presences</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset} aria-label="Retry presence list">
        Retry
      </Button>
    </main>
  );
}
