export type AccessRequestProvider = 'GITHUB' | 'FIGMA';
export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';
export type AccessRequestType = 'REPO_ACCESS' | 'NEW_REPO' | 'FIGMA_FILE' | 'FIGMA_PROJECT';
export type AccessRequestSortBy = 'created_at' | 'status' | 'provider';
export type AccessRequestSortDir = 'asc' | 'desc';

export type AccessRequestEmployee = {
  full_name: string | null;
  email: string;
};

export type AccessRequestDbRow = {
  id: string;
  provider: AccessRequestProvider;
  request_type: AccessRequestType;
  target_url: string;
  display_name: string;
  justification: string;
  extra_info: string | null;
  status: AccessRequestStatus;
  admin_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  employees: AccessRequestEmployee | AccessRequestEmployee[] | null;
};

export type AccessRequestRecord = Omit<AccessRequestDbRow, 'employees'> & {
  employee: AccessRequestEmployee | null;
};

export type AccessRequestListFilters = {
  page: number;
  pageSize: number;
  q: string;
  provider?: AccessRequestProvider;
  status?: AccessRequestStatus;
  sortBy: AccessRequestSortBy;
  sortDir: AccessRequestSortDir;
};

export type AccessRequestListResult = {
  rows: AccessRequestRecord[];
  totalCount: number;
  filters: AccessRequestListFilters;
};
