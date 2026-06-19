'use client';

import { useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

type UserMenuProps = {
  fullName: string | null;
  email: string;
  avatarUrl?: string | null;
};

function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    const parts = fullName
      .split(' ')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .slice(0, 2);

    if (parts.length) {
      return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
    }
  }

  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({ fullName, email }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initials = useMemo(() => getInitials(fullName, email), [email, fullName]);

  const onSignOut = async () => {
    setIsSigningOut(true);

    await fetch('/api/auth/sign-out', {
      method: 'POST'
    });

    router.replace('/');
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-navy-200 bg-navy-600 text-sm font-semibold text-white"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open user menu"
      >
        {initials}
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-label="Close user menu"
          />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border-subtle bg-white p-3 shadow-md">
            <div className="mb-3 border-b border-border-subtle pb-3">
              <p className="text-sm font-semibold text-text-primary">{fullName ?? email}</p>
              <p className="text-xs text-text-secondary">{email}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onSignOut}
              disabled={isSigningOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
