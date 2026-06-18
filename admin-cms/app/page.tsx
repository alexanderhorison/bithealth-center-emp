import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { getCurrentAdminUser } from '@/lib/auth/server';
import { isAuthorizedAdmin } from '@/lib/auth/shared';

type HomePageProps = {
  searchParams?: {
    error?: string;
  };
};

function getErrorMessage(code: string | undefined): string | null {
  if (code === 'admin') {
    return 'Your account is signed in, but admin access is not enabled.';
  }

  if (code === 'signin') {
    return 'Sign in failed. Please try again.';
  }

  return null;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentAdminUser();

  if (user && isAuthorizedAdmin(user)) {
    redirect('/dashboard');
  }

  if (user && !isAuthorizedAdmin(user)) {
    redirect('/not-authorized');
  }

  const errorMessage = getErrorMessage(searchParams?.error);

  return (
    <AuthShell
      appLabel="Bithealth Center CMS"
      title="Sign in to CMS"
      subtitle="Manage employees and presence records from one admin workspace."
      defaultShowIntro={errorMessage === null}
    >
      <div className="space-y-2">
        <GoogleSignInButton redirectPath="/dashboard" />
        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
      </div>
    </AuthShell>
  );
}
