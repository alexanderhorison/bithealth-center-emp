import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { getCurrentEmployeeUser } from '@/lib/auth/server';

type HomePageProps = {
  searchParams?: {
    error?: string;
  };
};

function getErrorMessage(code: string | undefined): string | null {
  if (code === 'domain') {
    return 'Your email domain is not allowed for this workspace.';
  }

  if (code === 'signin') {
    return 'Sign in failed. Please try again.';
  }

  return null;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentEmployeeUser();

  if (user) {
    redirect('/modules');
  }

  const errorMessage = getErrorMessage(searchParams?.error);

  return (
    <AuthShell
      appLabel="Bithealth Center"
      title="Sign in to Bithealth Center"
      subtitle="Your company's command center for daily operations."
    >
      <div className="space-y-2">
        <GoogleSignInButton redirectPath="/modules" />
        {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
      </div>
    </AuthShell>
  );
}
