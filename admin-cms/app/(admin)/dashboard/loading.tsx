export default function DashboardLoading() {
  return (
    <main className="space-y-6">
      <div className="h-8 w-52 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    </main>
  );
}
