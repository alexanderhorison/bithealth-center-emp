export default function AccessRequestsLoading() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      {/* Filter bar */}
      <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex gap-4 border-b border-border px-6 py-4">
          {[100, 80, 120, 96, 80, 72].map((w, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border px-6 py-4 last:border-0">
            {[100, 80, 120, 96, 80, 72].map((w, j) => (
              <div key={j} className="h-4 animate-pulse rounded bg-muted" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
