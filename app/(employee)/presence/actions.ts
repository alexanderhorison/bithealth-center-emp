'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentEmployeeUser } from '@/lib/auth/server';
import { syncEmployee } from '@/lib/employee/sync';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { submitPresenceSchema, type SubmitPresenceInput } from '@/lib/validations/presence';
import { HISTORY_PAGE_SIZE, type HistoryPresenceRow } from './_shared';

export type { HistoryPresenceRow };

type EmployeeRow = {
  id: string;
};

type ActionResult = {
  success: boolean;
  message: string;
};

type UploadSelfieResult =
  | { success: true; message: string; url: string }
  | { success: false; message: string };

const selfieBucketName = 'presence-selfies';
const maxSelfieSizeInBytes = 5 * 1024 * 1024;
const allowedSelfieMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

function getSelfieExtension(file: File): string {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

// Extracts the Supabase Storage object path from a public URL.
// Returns null if the URL doesn't reference this bucket.
function extractStoragePath(url: string): string | null {
  const marker = `/${selfieBucketName}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function ensureEmployee(): Promise<EmployeeRow> {
  const user = await getCurrentEmployeeUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const employee = await syncEmployee({
    userId: user.id,
    primaryEmail: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl
  });

  return { id: employee.id };
}

export async function submitPresenceAction(input: SubmitPresenceInput): Promise<ActionResult> {
  try {
    const validatedInput = submitPresenceSchema.parse(input);
    const employee = await ensureEmployee();

    const supabase = createSupabaseAdminClient();
    const date = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .schema('presence')
      .from('presences')
      .upsert(
        {
          employee_id: employee.id,
          presence_date: date,
          status: validatedInput.status,
          selfie_url: validatedInput.selfieUrl || null,
          note: validatedInput.note || null
        },
        { onConflict: 'employee_id,presence_date' }
      );

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath('/presence');

    return { success: true, message: 'Presence updated successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update presence';
    return { success: false, message };
  }
}

export async function uploadSelfieAction(formData: FormData): Promise<UploadSelfieResult> {
  try {
    const user = await getCurrentEmployeeUser();

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const selfieFile = formData.get('file');

    if (!(selfieFile instanceof File)) {
      return { success: false, message: 'Image file is required' };
    }

    if (!allowedSelfieMimeTypes.includes(selfieFile.type as (typeof allowedSelfieMimeTypes)[number])) {
      return { success: false, message: 'Only JPG, PNG, or WEBP images are allowed' };
    }

    if (selfieFile.size > maxSelfieSizeInBytes) {
      return { success: false, message: 'Image is too large. Max size is 5MB' };
    }

    const supabase = createSupabaseAdminClient();

    // GAP-PRES-01: Delete the previous selfie on re-upload to prevent storage orphans.
    const previousSelfieUrl = formData.get('previousSelfieUrl');
    if (typeof previousSelfieUrl === 'string' && previousSelfieUrl) {
      const oldPath = extractStoragePath(previousSelfieUrl);
      if (oldPath) {
        await supabase.storage.from(selfieBucketName).remove([oldPath]);
      }
    }

    const ext = getSelfieExtension(selfieFile);
    const datePath = new Date().toISOString().slice(0, 10);
    const filePath = `${user.id}/${datePath}/${crypto.randomUUID()}.${ext}`;
    const fileBuffer = Buffer.from(await selfieFile.arrayBuffer());

    const { error } = await supabase.storage.from(selfieBucketName).upload(filePath, fileBuffer, {
      contentType: selfieFile.type,
      upsert: false
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const { data } = supabase.storage.from(selfieBucketName).getPublicUrl(filePath);

    return { success: true, message: 'Selfie uploaded', url: data.publicUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload selfie';
    return { success: false, message };
  }
}

// GAP-PRES-04: Paginated history fetch — used by PresenceHistory "Load more" button.
export async function fetchPresenceHistoryAction(offset: number): Promise<HistoryPresenceRow[]> {
  try {
    const employee = await ensureEmployee();
    const supabase = createSupabaseAdminClient();

    const { data } = await supabase
      .schema('presence')
      .from('presences')
      .select('status, presence_date, updated_at')
      .eq('employee_id', employee.id)
      .order('presence_date', { ascending: false })
      .range(offset, offset + HISTORY_PAGE_SIZE - 1);

    return (data ?? []) as HistoryPresenceRow[];
  } catch {
    return [];
  }
}
