'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Camera, CircleOff, CircleCheckBig, CheckCircle2, AlertCircle, House, Building2 } from 'lucide-react';

import { submitPresenceAction, uploadSelfieAction } from '@/app/(employee)/presence/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitPresenceSchema, type SubmitPresenceInput } from '@/lib/validations/presence';

type PresenceStatus = 'PRESENT' | 'WFH' | 'NOT_PRESENT' | 'GO_TO_CLIENT';

type PresenceFormProps = {
  initialStatus: PresenceStatus;
  initialSelfieUrl?: string | null;
  initialNote?: string | null;
  // GAP-PRES-03: signals that the employee has already submitted today
  hasExistingSubmission?: boolean;
};

export function PresenceForm({
  initialStatus,
  initialSelfieUrl,
  initialNote,
  hasExistingSubmission = false
}: PresenceFormProps) {
  const router = useRouter();

  const form = useForm<SubmitPresenceInput>({
    resolver: zodResolver(submitPresenceSchema),
    defaultValues: {
      status: initialStatus,
      selfieUrl: initialSelfieUrl ?? '',
      note: initialNote ?? ''
    }
  });

  // GAP-PRES-02: Single source of truth — RHF watch replaces the Zustand store.
  const status = form.watch('status');

  const mutation = useMutation({
    mutationFn: (input: SubmitPresenceInput) => submitPresenceAction(input),
    onSuccess: (result) => {
      if (result.success) {
        router.refresh();
      }
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.set('file', file);
      // GAP-PRES-01: Pass the current selfie URL so the server can delete the old file.
      const currentSelfieUrl = form.getValues('selfieUrl');
      if (currentSelfieUrl) {
        formData.set('previousSelfieUrl', currentSelfieUrl);
      }
      return uploadSelfieAction(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        form.setValue('selfieUrl', result.url, { shouldValidate: true, shouldDirty: true });
      }
    }
  });

  const selfiePreview = form.watch('selfieUrl');
  const canPreviewSelfie = useMemo(() => {
    if (!selfiePreview) return false;
    try {
      new URL(selfiePreview);
      return true;
    } catch {
      return false;
    }
  }, [selfiePreview]);

  const onSelfieChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadMutation.mutateAsync(file);
    event.target.value = '';
  };

  const statusOptions = useMemo(
    () => [
      {
        label: 'Present',
        value: 'PRESENT' as const,
        icon: CircleCheckBig,
        description: 'I am working today.'
      },
      {
        label: 'WFH',
        value: 'WFH' as const,
        icon: House,
        description: 'I am working from home today.'
      },
      {
        label: 'Not Present',
        value: 'NOT_PRESENT' as const,
        icon: CircleOff,
        description: 'I am not available today.'
      },
      {
        label: 'Go to Client',
        value: 'GO_TO_CLIENT' as const,
        icon: Building2,
        description: 'I am working from a client site today.'
      }
    ],
    []
  );

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        const payload: SubmitPresenceInput = {
          status: values.status,
          selfieUrl: values.selfieUrl ?? '',
          note: values.note ?? ''
        };
        await mutation.mutateAsync(payload);
      })}
    >
      <div className="grid grid-cols-2 gap-3">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive = status === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive ? 'border-primary bg-primary/10' : 'border-border bg-background'
              }`}
              onClick={() => {
                form.setValue('status', option.value, { shouldValidate: true });
              }}
              aria-label={`Set status as ${option.label}`}
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {option.label}
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <input type="hidden" {...form.register('selfieUrl')} />
        <Label htmlFor="selfieFile">Selfie (optional)</Label>
        <Input
          id="selfieFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          aria-label="Upload selfie image"
          onChange={(event) => {
            void onSelfieChange(event);
          }}
          disabled={uploadMutation.isPending}
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WEBP. Max 5MB. On mobile, this will open your front camera.
        </p>
        {uploadMutation.data?.message ? (
          <p className={`text-sm ${uploadMutation.data.success ? 'text-green-700' : 'text-destructive'}`}>
            {uploadMutation.data.message}
          </p>
        ) : null}
        {form.formState.errors.selfieUrl ? (
          <p className="text-sm text-destructive">{form.formState.errors.selfieUrl.message}</p>
        ) : null}
      </div>

      {canPreviewSelfie ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Selfie preview
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => {
                form.setValue('selfieUrl', '', { shouldValidate: true, shouldDirty: true });
              }}
              aria-label="Remove uploaded selfie"
            >
              Remove
            </Button>
          </div>
          <div className="relative h-52 w-full overflow-hidden rounded-lg border bg-muted sm:h-64">
            <Image
              src={selfiePreview || ''}
              alt="Employee selfie preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          aria-label="Note"
          maxLength={250}
          placeholder="Add context for today"
          {...form.register('note')}
        />
      </div>

      {mutation.data?.message ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm ${
            mutation.data.success
              ? 'border-green-300 bg-green-50 text-green-900'
              : 'border-red-300 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-start gap-2">
            {mutation.data.success ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold">{mutation.data.success ? 'Success' : 'Failed to save'}</p>
              <p>{mutation.data.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* GAP-PRES-03: Warn the employee before overwriting an existing submission. */}
      {hasExistingSubmission && !mutation.data ? (
        <p className="text-xs text-muted-foreground">
          You&apos;ve already submitted for today. Saving will update your existing record.
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={mutation.isPending || uploadMutation.isPending}
        aria-label="Submit daily presence"
        className="w-full"
      >
        {mutation.isPending ? 'Saving...' : hasExistingSubmission ? 'Update Presence' : 'Save Presence'}
      </Button>
    </form>
  );
}
