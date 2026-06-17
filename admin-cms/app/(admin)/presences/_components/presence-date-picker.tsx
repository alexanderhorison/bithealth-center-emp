'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PresenceDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

type CalendarDay = {
  isoDate: string;
  day: number;
  inCurrentMonth: boolean;
};

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parseIsoDate(value: string): Date | null {
  const parts = value.split('-').map((item) => Number(item));

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const firstGridDay = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);

    return {
      isoDate: formatIsoDate(date),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month
    };
  });
}

export function PresenceDatePicker({ value, onChange }: PresenceDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = useMemo(() => parseIsoDate(value) ?? new Date(), [value]);
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const today = useMemo(() => new Date(), []);
  const todayIso = formatIsoDate(today);

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(viewDate);

  const calendarDays = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());

  const moveMonth = (delta: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between rounded-xl border border-stone-300 bg-stone-50 px-4 text-left font-medium text-stone-900 shadow-sm transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Choose presence date"
        aria-expanded={isOpen}
      >
        <span className="truncate text-base leading-none">{formatDisplayDate(value)}</span>
        <Calendar className="h-5 w-5 shrink-0 text-stone-600" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 z-20 mt-2 w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-300 bg-stone-50 shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <p className="text-lg font-medium text-stone-900">{monthLabel}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => moveMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-3 grid grid-cols-7 gap-2">
              {weekdayLabels.map((label) => (
                <div key={label} className="text-center text-sm text-stone-500">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const isSelected = day.isoDate === value;
                const isToday = day.isoDate === todayIso;

                return (
                  <button
                    key={day.isoDate}
                    type="button"
                    className={cn(
                      'h-10 rounded-xl text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      day.inCurrentMonth ? 'text-stone-800' : 'text-stone-400',
                      isSelected ? 'bg-stone-700 font-medium text-stone-50' : 'hover:bg-stone-200',
                      isToday && !isSelected && 'border border-stone-400'
                    )}
                    onClick={() => {
                      onChange(day.isoDate);
                      setIsOpen(false);
                    }}
                    aria-label={`Select ${day.isoDate}`}
                  >
                    {day.day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
            <button
              type="button"
              className="text-sm font-medium text-stone-700 transition hover:text-stone-900"
              onClick={() => {
                onChange(todayIso);
                setIsOpen(false);
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="text-sm font-medium text-stone-700 transition hover:text-stone-900"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onChange(formatIsoDate(tomorrow));
                setIsOpen(false);
              }}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className="text-sm font-medium text-stone-700 transition hover:text-stone-900"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                onChange(formatIsoDate(nextWeek));
                setIsOpen(false);
              }}
            >
              Next Week
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
