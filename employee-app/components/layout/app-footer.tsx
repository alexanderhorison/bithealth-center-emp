import packageJson from '@/package.json';

export function AppFooter() {
  return (
    <footer className="border-t border-border-subtle bg-navy-600 py-4">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-navy-200">
            Bithealth Center
          </span>
          <span className="rounded-full border border-navy-400 px-2 py-0.5 text-xs font-semibold text-white">
            v{packageJson.version}
          </span>
        </div>
      </div>
    </footer>
  );
}
