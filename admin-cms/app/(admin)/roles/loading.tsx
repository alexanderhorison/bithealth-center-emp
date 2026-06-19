export default function RolesLoading() {
  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Filter bar */}
      <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Table header */}
        <div className="flex gap-4 border-b border-border px-6 py-4">
          {[80, 96, 160, 80, 64, 64, 80].map((w, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border px-6 py-4 last:border-0">
            {[80, 96, 160, 80, 64, 64, 80].map((w, j) => (
              <div key={j} className="h-4 animate-pulse rounded bg-muted" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
