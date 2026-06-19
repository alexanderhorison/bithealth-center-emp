import packageJson from '@/package.json';

export function AppFooter() {
  return (
    <footer className="border-t border-border-subtle bg-white py-4">
      <div className="mx-auto max-w-3xl px-6">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
            Bithealth Center
          </span>
          <span className="rounded-full border border-border-subtle px-2 py-0.5 text-xs font-semibold text-text-secondary">
            v{packageJson.version}
          </span>
        </div>
      </div>
    </footer>
  );
}
