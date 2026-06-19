export default function AccessRequestDetailLoading() {
  return (
    <main className="space-y-6">
      {/* Back + action button */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      {/* Detail card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Title row */}
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        {/* Fields grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        {/* Justification */}
        <div className="space-y-1">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-16 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </main>
  );
}
