'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AccessRequestProvider, AccessRequestStatus } from '@/lib/access-requests/types';

type AccessRequestFilterProps = {
  query: string;
  provider?: AccessRequestProvider;
  status?: AccessRequestStatus;
};

export function AccessRequestFilter({ query, provider, status }: AccessRequestFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query);
  const [providerValue, setProviderValue] = useState(provider ?? 'ALL');
  const [statusValue, setStatusValue] = useState(status ?? 'ALL');

  useEffect(() => setSearchValue(query), [query]);
  useEffect(() => setProviderValue(provider ?? 'ALL'), [provider]);
  useEffect(() => setStatusValue(status ?? 'ALL'), [status]);

  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]"
      onSubmit={(event) => {
        event.preventDefault();

        const params = new URLSearchParams(searchParams.toString());
        const normalizedValue = searchValue.trim();

        if (normalizedValue) {
          params.set('q', normalizedValue);
        } else {
          params.delete('q');
        }

        if (providerValue === 'ALL') {
          params.delete('provider');
        } else {
          params.set('provider', providerValue);
        }

        if (statusValue === 'ALL') {
          params.delete('status');
        } else {
          params.set('status', statusValue);
        }

        params.set('page', '1');
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
    >
      <Input
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search name, target, or employee email"
        aria-label="Search requests"
      />
      <select
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={providerValue}
        onChange={(event) => setProviderValue(event.target.value)}
        aria-label="Filter by provider"
      >
        <option value="ALL">All providers</option>
        <option value="GITHUB">GitHub</option>
        <option value="FIGMA">Figma</option>
      </select>
      <select
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={statusValue}
        onChange={(event) => setStatusValue(event.target.value)}
        aria-label="Filter by status"
      >
        <option value="ALL">All status</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="DENIED">Denied</option>
      </select>
      <div className="flex gap-2">
        <Button type="submit" className="w-full md:w-auto">
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full md:w-auto"
          onClick={() => {
            setSearchValue('');
            setProviderValue('ALL');
            setStatusValue('ALL');
            const params = new URLSearchParams(searchParams.toString());
            params.delete('q');
            params.delete('provider');
            params.delete('status');
            params.set('page', '1');
            const qs = params.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname);
          }}
        >
          Reset Search
        </Button>
      </div>
    </form>
  );
}
