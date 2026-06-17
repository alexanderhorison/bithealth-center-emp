import type {
  AccessRequestProvider,
  AccessRequestSortBy,
  AccessRequestSortDir,
  AccessRequestStatus,
  AccessRequestType
} from '@/lib/access-requests/types';

export const ACCESS_REQUEST_DEFAULT_PAGE = 1;
export const ACCESS_REQUEST_DEFAULT_PAGE_SIZE = 10;
export const ACCESS_REQUEST_DEFAULT_SORT_BY: AccessRequestSortBy = 'created_at';
export const ACCESS_REQUEST_DEFAULT_SORT_DIR: AccessRequestSortDir = 'desc';

export const ACCESS_REQUEST_TYPE_LABELS: Record<AccessRequestType, string> = {
  REPO_ACCESS: 'Repo Access',
  NEW_REPO: 'New Repo',
  FIGMA_FILE: 'Figma File',
  FIGMA_PROJECT: 'Figma Project'
};

export const ACCESS_REQUEST_PROVIDER_LABELS: Record<AccessRequestProvider, string> = {
  GITHUB: 'GitHub',
  FIGMA: 'Figma'
};

export const ACCESS_REQUEST_STATUS_BADGE_CLASSES: Record<AccessRequestStatus, string> = {
  PENDING: 'bg-zinc-200 text-zinc-700',
  APPROVED: 'bg-emerald-200 text-emerald-800',
  DENIED: 'bg-red-200 text-red-800'
};

export const ACCESS_REQUEST_PROVIDER_BADGE_CLASSES: Record<AccessRequestProvider, string> = {
  GITHUB: 'bg-black text-white',
  FIGMA: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white'
};
