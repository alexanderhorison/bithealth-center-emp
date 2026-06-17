'use client';

import { Button } from '@/components/ui/button';

export default function EmployeesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <h2 className="text-xl font-semibold">Unable to load employees</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset} aria-label="Retry employee list">
        Retry
      </Button>
    </main>
  );
}
