'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AuthShellProps = {
  appLabel: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ appLabel, title, subtitle, children }: AuthShellProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100dvh';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.height = previousBodyHeight;
    };
  }, [isMobile]);

  const intro = useMemo(
    () => ({
      heading: 'Where Teams Move in Sync',
      description:
        "Bithealth Center is your company's command center for daily operations across teams and workflows."
    }),
    []
  );

  return (
    <main
      className={cn(
        'bg-stone-100',
        isMobile
          ? 'h-[100dvh] overflow-hidden overscroll-none px-0 py-0'
          : 'min-h-screen px-4 py-6 sm:px-6 lg:flex lg:items-center lg:py-10'
      )}
    >
      <div
        className={cn(
          'mx-auto w-full overflow-hidden border border-stone-300 bg-stone-50 shadow-sm',
          isMobile ? 'h-[100dvh] max-w-none rounded-none border-0' : 'max-w-6xl rounded-2xl'
        )}
      >
        <div
          className={cn(
            'grid',
            isMobile ? 'h-full overflow-hidden' : 'lg:min-h-[620px] lg:grid-cols-[minmax(360px,1fr)_minmax(420px,1fr)]'
          )}
        >
          <section className="hidden border-r border-stone-300 bg-[#f1ece2] p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{appLabel}</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-stone-900">{intro.heading}</h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600">{intro.description}</p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <svg
                viewBox="0 0 220 130"
                className="mx-auto h-32 w-56 text-stone-400"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="18" y="14" width="184" height="102" rx="16" className="stroke-[1.5] text-stone-300" />
                <rect x="72" y="8" width="76" height="16" rx="8" className="stroke-[1.5] text-stone-400" />
                <circle cx="56" cy="52" r="11" />
                <path d="M42 76c4-7 10-10 14-10s10 3 14 10" className="text-stone-500" />
                <rect x="90" y="40" width="76" height="10" rx="5" />
                <rect x="90" y="58" width="62" height="10" rx="5" className="text-stone-500" />
                <rect x="90" y="76" width="48" height="10" rx="5" className="text-stone-500" />
                <circle cx="170" cy="84" r="12" />
                <path d="M163 84l5 5 9-10" className="text-stone-500" />
                <rect x="40" y="90" width="28" height="16" rx="4" className="text-stone-500" />
                <circle cx="54" cy="98" r="3" />
              </svg>
            </div>

            <div className="rounded-xl border border-stone-300 bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Daily Focus</p>
              <p className="mt-2 text-sm text-stone-700">Manage work clearly today, and scale smoothly as your team grows.</p>
            </div>
          </section>

          <section
            className={cn(
              'flex items-center justify-center',
              isMobile ? 'h-full overflow-hidden p-5' : 'p-4 sm:p-6 lg:p-8'
            )}
          >
            {isMobile && showIntro ? (
              <div className="flex h-full w-full max-w-md flex-col text-center">
                <div className="flex flex-1 flex-col rounded-2xl border border-stone-200 bg-[#f1ece2] px-4 py-5 text-left shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{appLabel}</p>
                  <h2 className="mt-3 text-2xl font-bold leading-tight text-stone-900">{intro.heading}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">{intro.description}</p>

                  <div className="mt-5 flex items-center justify-center">
                    <svg
                      viewBox="0 0 220 130"
                      className="mx-auto h-24 w-44 text-stone-400"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <rect x="18" y="14" width="184" height="102" rx="16" className="stroke-[1.5] text-stone-300" />
                      <rect x="72" y="8" width="76" height="16" rx="8" className="stroke-[1.5] text-stone-400" />
                      <circle cx="56" cy="52" r="11" />
                      <path d="M42 76c4-7 10-10 14-10s10 3 14 10" className="text-stone-500" />
                      <rect x="90" y="40" width="76" height="10" rx="5" />
                      <rect x="90" y="58" width="62" height="10" rx="5" className="text-stone-500" />
                      <rect x="90" y="76" width="48" height="10" rx="5" className="text-stone-500" />
                      <circle cx="170" cy="84" r="12" />
                      <path d="M163 84l5 5 9-10" className="text-stone-500" />
                      <rect x="40" y="90" width="28" height="16" rx="4" className="text-stone-500" />
                      <circle cx="54" cy="98" r="3" />
                    </svg>
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Daily Focus</p>
                      <p className="mt-1 text-sm text-stone-700">Manage work clearly today, and scale smoothly as your team grows.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                    <Button className="w-full" onClick={() => setShowIntro(false)}>
                      Next
                    </Button>
                </div>
              </div>
            ) : (
              <div className={cn('w-full space-y-4 text-center', isMobile ? 'max-w-full px-4' : 'max-w-md')}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{appLabel}</p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
                  <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
                </div>

                {children}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
