import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { mapAccessRequestRecord } from '@/lib/access-requests/mapper';
import type {
  AccessRequestDbRow,
  AccessRequestListFilters,
  AccessRequestRecord,
  AccessRequestStatus
} from '@/lib/access-requests/types';

const ACCESS_REQUEST_SELECT_COLUMNS =
  'id, provider, request_type, target_url, display_name, justification, extra_info, status, admin_note, resolved_by, resolved_at, created_at, employees(full_name, email)';

type UpdateStatusInput = {
  id: string;
  status: AccessRequestStatus;
  adminNote?: string;
  adminEmail: string;
};

export class AccessRequestRepository {
  private readonly supabase = createSupabaseAdminClient();

  async findPaginated(filters: AccessRequestListFilters): Promise<{ rows: AccessRequestRecord[]; totalCount: number }> {
    const from = (filters.page - 1) * filters.pageSize;
    const to = from + filters.pageSize - 1;

    let query = this.supabase
      .schema('presence')
      .from('access_requests')
      .select(ACCESS_REQUEST_SELECT_COLUMNS, { count: 'exact' });

    if (filters.provider) {
      query = query.eq('provider', filters.provider);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const term = this.normalizeSearchQuery(filters.q);
    if (term) {
      query = query.or(
        `display_name.ilike.%${term}%,target_url.ilike.%${term}%,justification.ilike.%${term}%,employees.email.ilike.%${term}%`,
        { foreignTable: undefined }
      );
    }

    const ascending = filters.sortDir === 'asc';
    if (filters.sortBy === 'status') {
      query = query.order('status', { ascending });
    } else if (filters.sortBy === 'provider') {
      query = query.order('provider', { ascending });
    } else {
      query = query.order('created_at', { ascending });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const rows = ((data ?? []) as AccessRequestDbRow[]).map(mapAccessRequestRecord);
    return {
      rows,
      totalCount: count ?? 0
    };
  }

  async findById(id: string): Promise<AccessRequestRecord | null> {
    const { data, error } = await this.supabase
      .schema('presence')
      .from('access_requests')
      .select(ACCESS_REQUEST_SELECT_COLUMNS)
      .eq('id', id)
      .maybeSingle<AccessRequestDbRow>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return mapAccessRequestRecord(data);
  }

  async updateStatus({ id, status, adminNote, adminEmail }: UpdateStatusInput): Promise<void> {
    const now = new Date().toISOString();
    const isResolved = status !== 'PENDING';

    const { error } = await this.supabase
      .schema('presence')
      .from('access_requests')
      .update({
        status,
        admin_note: adminNote || null,
        resolved_by: isResolved ? adminEmail : null,
        resolved_at: isResolved ? now : null
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private normalizeSearchQuery(value: string): string {
    return value.replace(/[%_]/g, '').replace(/,/g, ' ').trim();
  }
}
