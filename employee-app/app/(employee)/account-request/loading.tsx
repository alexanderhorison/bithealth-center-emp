export default function AccountRequestLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 animate-pulse rounded-sm bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-sm bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      {/* History card */}
      <div className="h-24 animate-pulse rounded-sm border border-stone-200 bg-muted" />

      {/* Form card */}
      <div className="h-64 animate-pulse rounded-sm border border-stone-200 bg-muted" />
    </main>
  );
}
