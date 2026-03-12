// Shared constants and types used by both server actions and client components.
// Must NOT have 'use server' or 'use client' — imported by both sides.

export const HISTORY_PAGE_SIZE = 7;

export type HistoryPresenceRow = {
  status: 'PRESENT' | 'WFH' | 'NOT_PRESENT' | 'GO_TO_CLIENT';
  presence_date: string;
  updated_at: string;
};
