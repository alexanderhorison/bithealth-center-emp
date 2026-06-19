'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, Figma, Github } from 'lucide-react';

import { createAccessRequestAction } from '@/app/(employee)/account-request/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  accessRequestProviderSchema,
  accessRequestTypeSchema,
  createAccessRequestSchema,
  type CreateAccessRequestInput
} from '@/lib/validations/access-request';

type AccountRequestFormProps = {
  defaults?: Partial<CreateAccessRequestInput>;
};

const providerOptions = [
  {
    value: 'GITHUB',
    label: 'GitHub',
    description: 'Repository and organization access.',
    icon: Github
  },
  {
    value: 'FIGMA',
    label: 'Figma',
    description: 'File and project collaboration access.',
    icon: Figma
  }
] as const;

const requestTypeOptions = {
  GITHUB: [
    { value: 'REPO_ACCESS', label: 'Repo Access' },
    { value: 'NEW_REPO', label: 'New Repo' }
  ],
  FIGMA: [
    { value: 'FIGMA_FILE', label: 'Figma File' },
    { value: 'FIGMA_PROJECT', label: 'Figma Project' }
  ]
} as const;

export function AccountRequestForm({ defaults }: AccountRequestFormProps) {
  const router = useRouter();
  const form = useForm<CreateAccessRequestInput>({
    resolver: zodResolver(createAccessRequestSchema),
    defaultValues: {
      provider: defaults?.provider ?? 'GITHUB',
      requestType: defaults?.requestType ?? 'REPO_ACCESS',
      targetUrl: defaults?.targetUrl ?? '',
      displayName: defaults?.displayName ?? '',
      justification: defaults?.justification ?? '',
      additionalInfo: defaults?.additionalInfo ?? ''
    }
  });

  const selectedProvider = form.watch('provider');
  const selectedRequestType = form.watch('requestType');
  const typeOptions = useMemo(() => requestTypeOptions[selectedProvider], [selectedProvider]);
  const isTargetUrlOptional =
    selectedRequestType === 'NEW_REPO' || selectedRequestType === 'FIGMA_PROJECT';

  useEffect(() => {
    void form.trigger('targetUrl');
  }, [form, selectedRequestType]);

  const mutation = useMutation({
    mutationFn: (input: CreateAccessRequestInput) => createAccessRequestAction(input),
    onSuccess: (result) => {
      alert(result.message);
      if (result.success) {
        form.reset({
          provider: 'GITHUB',
          requestType: 'REPO_ACCESS',
          targetUrl: '',
          displayName: '',
          justification: '',
          additionalInfo: ''
        });
        router.refresh();
      }
    }
  });

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        const payload: CreateAccessRequestInput = {
          provider: accessRequestProviderSchema.parse(values.provider),
          requestType: accessRequestTypeSchema.parse(values.requestType),
          targetUrl: values.targetUrl,
          displayName: values.displayName,
          justification: values.justification,
          additionalInfo: values.additionalInfo ?? ''
        };
        await mutation.mutateAsync(payload);
      })}
    >
      <div className="space-y-2">
        <Label>Provider</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {providerOptions.map((option) => {
            const Icon = option.icon;
            const isActive = selectedProvider === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                    : 'border-border bg-background hover:border-brand-200 hover:bg-brand-25'
                )}
                onClick={() => {
                  form.setValue('provider', option.value, { shouldValidate: true, shouldDirty: true });
                  form.setValue('requestType', requestTypeOptions[option.value][0].value, {
                    shouldValidate: true,
                    shouldDirty: true
                  });
                }}
                aria-label={`Set provider to ${option.label}`}
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="requestType">Request Type</Label>
          <div className="relative">
            <select
              id="requestType"
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm"
              {...form.register('requestType')}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Name</Label>
          <Input id="displayName" placeholder="Short name for this request" {...form.register('displayName')} />
          {form.formState.errors.displayName ? (
            <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetUrl">Target URL {isTargetUrlOptional ? '(optional)' : ''}</Label>
        <Input
          id="targetUrl"
          placeholder={
            isTargetUrlOptional
              ? 'Leave blank for new repo/project request'
              : 'https://github.com/org/repo or https://www.figma.com/file/...'
          }
          {...form.register('targetUrl')}
        />
        {form.formState.errors.targetUrl ? (
          <p className="text-sm text-destructive">{form.formState.errors.targetUrl.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Required for Repo Access and Figma File. Optional for New Repo and Figma Project.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="justification">Justification</Label>
          <Textarea
            id="justification"
            rows={4}
            placeholder="Why do you need this access?"
            {...form.register('justification')}
          />
          {form.formState.errors.justification ? (
            <p className="text-sm text-destructive">{form.formState.errors.justification.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Additional Info (optional)</Label>
          <Textarea
            id="additionalInfo"
            rows={4}
            placeholder="Issue link, team name, branch permissions, etc."
            {...form.register('additionalInfo')}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        aria-label="Submit account request"
        className="w-full"
      >
        Submit Request
      </Button>
    </form>
  );
}
