import { z } from 'zod';

import {
  ACCESS_REQUEST_DEFAULT_PAGE,
  ACCESS_REQUEST_DEFAULT_PAGE_SIZE,
  ACCESS_REQUEST_DEFAULT_SORT_BY,
  ACCESS_REQUEST_DEFAULT_SORT_DIR
} from '@/lib/access-requests/constants';
import { AccessRequestRepository } from '@/lib/access-requests/repository';
import type {
  AccessRequestListFilters,
  AccessRequestListResult
} from '@/lib/access-requests/types';
import {
  accessRequestSearchParamsSchema,
  adminUpdateAccessRequestSchema,
  type AdminUpdateAccessRequestInput
} from '@/lib/validations/access-request';

type SearchParams = Record<string, string | string[] | undefined>;

const accessRequestIdSchema = z.string().uuid();

function getSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export class AccessRequestService {
  constructor(private readonly repository: AccessRequestRepository = new AccessRequestRepository()) {}

  async getPaginated(searchParams: SearchParams): Promise<AccessRequestListResult> {
    const filters = this.parseFilters(searchParams);
    const { rows, totalCount } = await this.repository.findPaginated(filters);

    return {
      rows,
      totalCount,
      filters
    };
  }

  async getById(rawId: string): Promise<AccessRequestListResult['rows'][number] | null> {
    const parsed = accessRequestIdSchema.safeParse(rawId);
    if (!parsed.success) {
      return null;
    }

    return this.repository.findById(parsed.data);
  }

  async updateStatus(input: AdminUpdateAccessRequestInput, adminEmail: string): Promise<void> {
    const parsed = adminUpdateAccessRequestSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? 'Invalid payload');
    }

    await this.repository.updateStatus({
      id: parsed.data.id,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
      adminEmail
    });
  }

  private parseFilters(searchParams: SearchParams): AccessRequestListFilters {
    const parsed = accessRequestSearchParamsSchema.safeParse({
      page: getSingle(searchParams.page),
      pageSize: getSingle(searchParams.pageSize),
      q: getSingle(searchParams.q),
      provider: getSingle(searchParams.provider),
      status: getSingle(searchParams.status),
      sortBy: getSingle(searchParams.sortBy),
      sortDir: getSingle(searchParams.sortDir)
    });

    if (!parsed.success) {
      return {
        page: ACCESS_REQUEST_DEFAULT_PAGE,
        pageSize: ACCESS_REQUEST_DEFAULT_PAGE_SIZE,
        q: '',
        sortBy: ACCESS_REQUEST_DEFAULT_SORT_BY,
        sortDir: ACCESS_REQUEST_DEFAULT_SORT_DIR
      };
    }

    return {
      page: parsed.data.page ?? ACCESS_REQUEST_DEFAULT_PAGE,
      pageSize: parsed.data.pageSize ?? ACCESS_REQUEST_DEFAULT_PAGE_SIZE,
      q: parsed.data.q ?? '',
      provider: parsed.data.provider,
      status: parsed.data.status,
      sortBy: parsed.data.sortBy ?? ACCESS_REQUEST_DEFAULT_SORT_BY,
      sortDir: parsed.data.sortDir ?? ACCESS_REQUEST_DEFAULT_SORT_DIR
    };
  }
}
