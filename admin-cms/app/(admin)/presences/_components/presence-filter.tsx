'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PresenceDatePicker } from '@/app/(admin)/presences/_components/presence-date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PresenceFilterProps = {
  currentDate: string;
  defaultDate: string;
};

export function PresenceFilter({ currentDate, defaultDate }: PresenceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(currentDate);

  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const dateValue = String(formData.get('date') ?? '').trim() || defaultDate;
        const queryValue = String(formData.get('q') ?? '').trim();

        const params = new URLSearchParams(searchParams.toString());
        params.set('date', dateValue);

        if (queryValue) {
          params.set('q', queryValue);
        } else {
          params.delete('q');
        }

        params.set('page', '1');

        router.push(`/presences?${params.toString()}`);
      }}
    >
      <input type="hidden" name="date" value={date} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80 sm:shrink-0">
          <PresenceDatePicker value={date} onChange={setDate} />
        </div>

        <Input
          id="q"
          name="q"
          aria-label="Search by employee name or email"
          defaultValue={searchParams.get('q') ?? ''}
          placeholder="Search name or email"
          className="sm:flex-1"
        />

        <Button type="submit" className="sm:shrink-0" aria-label="Apply filters">
          Apply
        </Button>

        <Button
          type="button"
          variant="outline"
          className="sm:shrink-0"
          onClick={() => {
            setDate(defaultDate);
            const params = new URLSearchParams(searchParams.toString());
            params.set('date', defaultDate);
            params.delete('q');
            params.set('page', '1');
            router.push(`/presences?${params.toString()}`);
          }}
          aria-label="Reset filters"
        >
          Reset Search
        </Button>
      </div>
    </form>
  );
}
