import type {
  AccessRequestDbRow,
  AccessRequestEmployee,
  AccessRequestRecord
} from '@/lib/access-requests/types';

function normalizeEmployeeRelation(
  employee: AccessRequestDbRow['employees']
): AccessRequestEmployee | null {
  if (!employee) {
    return null;
  }

  if (Array.isArray(employee)) {
    return employee[0] ?? null;
  }

  return employee;
}

export function mapAccessRequestRecord(row: AccessRequestDbRow): AccessRequestRecord {
  return {
    id: row.id,
    provider: row.provider,
    request_type: row.request_type,
    target_url: row.target_url,
    display_name: row.display_name,
    justification: row.justification,
    extra_info: row.extra_info,
    status: row.status,
    admin_note: row.admin_note,
    resolved_by: row.resolved_by,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
    employee: normalizeEmployeeRelation(row.employees)
  };
}
