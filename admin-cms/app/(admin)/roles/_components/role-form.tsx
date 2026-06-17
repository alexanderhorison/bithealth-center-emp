'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { saveRoleAction } from '@/app/(admin)/roles/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveRoleSchema, type SaveRoleInput } from '@/lib/validations/role';

type RoleFormProps = {
  mode: 'create' | 'edit';
  initialValues?: SaveRoleInput;
  isSystem?: boolean;
};

export function RoleForm({ mode, initialValues, isSystem = false }: RoleFormProps) {
  const router = useRouter();
  const form = useForm<SaveRoleInput>({
    resolver: zodResolver(saveRoleSchema),
    defaultValues: {
      id: initialValues?.id,
      code: initialValues?.code ?? '',
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? ''
    }
  });

  const mutation = useMutation({
    mutationFn: (payload: SaveRoleInput) => saveRoleAction(payload),
    onSuccess: (result) => {
      if (result.success) {
        router.push('/roles');
        router.refresh();
      }
    }
  });

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card p-4"
      onSubmit={form.handleSubmit(async (values) => {
        await mutation.mutateAsync({
          id: initialValues?.id,
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          description: values.description?.trim() ?? ''
        });
      })}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="code">Role Code</Label>
          <Input
            id="code"
            aria-label="Role code"
            placeholder="ADMIN"
            disabled={isSystem}
            {...form.register('code')}
          />
          {form.formState.errors.code ? <p className="text-sm text-destructive">{form.formState.errors.code.message}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Role Name</Label>
          <Input id="name" aria-label="Role name" placeholder="Admin" {...form.register('name')} />
          {form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          aria-label="Role description"
          placeholder="Role permission summary"
          className="min-h-28"
          {...form.register('description')}
        />
        {form.formState.errors.description ? (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        ) : null}
      </div>

      {mutation.data?.message ? (
        <p className={`text-sm ${mutation.data.success ? 'text-green-700' : 'text-destructive'}`}>{mutation.data.message}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Link href="/roles">
          <Button type="button" variant="outline" aria-label="Cancel role form">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={mutation.isPending} aria-label="Save role">
          {mutation.isPending ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Update Role'}
        </Button>
      </div>
    </form>
  );
}
