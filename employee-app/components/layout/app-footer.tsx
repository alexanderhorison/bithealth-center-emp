import packageJson from '@/package.json';

export function AppFooter() {
  return (
    <footer className="bg-stone-100">
      <div className="mx-auto max-w-3xl px-6 pb-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-700">
            Bithealth Center
          </span>
          <span className="rounded-full border border-stone-300 px-2 py-0.5 text-xs font-semibold text-zinc-900">
            v{packageJson.version}
          </span>
        </div>
      </div>
    </footer>
  );
}
