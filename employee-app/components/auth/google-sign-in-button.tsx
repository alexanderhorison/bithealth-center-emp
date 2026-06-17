'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type GoogleSignInButtonProps = {
  redirectPath: string;
};

export function GoogleSignInButton({ redirectPath }: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSignIn = async () => {
    setIsPending(true);
    setErrorMessage(null);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      setErrorMessage(error.message);
      setIsPending(false);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setErrorMessage('Failed to start Google sign in.');
    setIsPending(false);
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="h-12 w-full rounded-full bg-stone-800 text-base font-semibold text-stone-50 hover:bg-stone-700"
        onClick={onSignIn}
        disabled={isPending}
        aria-label="Continue with Google"
      >
        {isPending ? 'Redirecting...' : 'Continue with Google'}
      </Button>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
