'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

function sanitizeNextPath(path: string | null, fallbackPath: string): string {
  if (!path || !path.startsWith('/')) {
    return fallbackPath;
  }

  return path;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;

    const finalizeSignIn = async () => {
      const supabase = createSupabaseBrowserClient();
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          break;
        }

        if (data.session?.access_token && data.session.refresh_token) {
          accessToken = data.session.access_token;
          refreshToken = data.session.refresh_token;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (!active) {
        return;
      }

      if (!accessToken || !refreshToken) {
        router.replace('/?error=signin');
        return;
      }

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          refreshToken
        })
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!active) {
        return;
      }

      if (!response.ok) {
        const reason = payload?.message === 'Email domain is not allowed' ? 'domain' : 'signin';
        router.replace(`/?error=${reason}`);
        return;
      }

      const nextPath = sanitizeNextPath(searchParams.get('next'), '/modules');
      router.replace(nextPath);
    };

    void finalizeSignIn();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
      <p className="text-sm text-stone-600">Signing you in...</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
          <p className="text-sm text-stone-600">Signing you in...</p>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
