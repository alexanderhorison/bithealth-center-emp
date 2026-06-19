export default function EditRoleLoading() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </main>
  );
}
