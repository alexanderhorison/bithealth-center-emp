'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type EmployeeFilterProps = {
  query: string;
};

export function EmployeeFilter({ query }: EmployeeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(query);

  useEffect(() => {
    setSearchValue(query);
  }, [query]);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();

        const params = new URLSearchParams(searchParams.toString());
        const normalizedValue = searchValue.trim();

        if (normalizedValue) {
          params.set('q', normalizedValue);
        } else {
          params.delete('q');
        }

        params.set('page', '1');
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search name, email, or Auth User ID"
          aria-label="Search employees"
          className="sm:flex-1"
        />
        <Button type="submit" className="sm:shrink-0">
          Apply
        </Button>
        <Button
          type="button"
          variant="outline"
          className="sm:shrink-0"
          onClick={() => {
            setSearchValue('');
            const params = new URLSearchParams(searchParams.toString());
            params.delete('q');
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
