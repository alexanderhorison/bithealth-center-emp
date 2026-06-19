export default function EditEmployeeLoading() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Full Name + Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
        {/* Auth User ID + Active toggle */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        {/* Roles */}
        <div className="space-y-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-52 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </main>
  );
}
