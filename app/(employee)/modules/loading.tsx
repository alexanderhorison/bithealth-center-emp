export default function ModulesLoading() {
  return (
    <main className="min-h-screen bg-stone-100">
      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-sm bg-muted" />
            <div className="h-4 w-72 animate-pulse rounded-sm bg-muted" />
          </div>
          <div className="h-9 w-9 animate-pulse rounded-sm bg-muted" />
        </div>

        {/* Module grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-sm border border-stone-200 bg-muted"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
