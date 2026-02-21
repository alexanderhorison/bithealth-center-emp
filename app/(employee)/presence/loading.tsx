export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </main>
  );
}
