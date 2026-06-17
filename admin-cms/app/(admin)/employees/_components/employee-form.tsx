'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { saveEmployeeAction } from '@/app/(admin)/employees/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { saveEmployeeSchema, type SaveEmployeeInput } from '@/lib/validations/employee';

type EmployeeFormProps = {
  mode: 'create' | 'edit';
  initialValues?: SaveEmployeeInput;
  roles: Array<{
    id: string;
    code: string;
    name: string;
  }>;
};

export function EmployeeForm({ mode, initialValues, roles }: EmployeeFormProps) {
  const router = useRouter();
  const hasRoles = roles.length > 0;
  const form = useForm<SaveEmployeeInput>({
    resolver: zodResolver(saveEmployeeSchema),
    defaultValues: {
      id: initialValues?.id,
      email: initialValues?.email ?? '',
      fullName: initialValues?.fullName ?? '',
      authUserId: initialValues?.authUserId ?? '',
      isActive: initialValues?.isActive ?? true,
      roleId: initialValues?.roleId ?? roles[0]?.id ?? ''
    }
  });

  const mutation = useMutation({
    mutationFn: (input: SaveEmployeeInput) => saveEmployeeAction(input),
    onSuccess: (result) => {
      if (result.success) {
        router.push('/employees');
        router.refresh();
      }
    }
  });

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card p-4"
      onSubmit={form.handleSubmit(async (values) => {
        const payload: SaveEmployeeInput = {
          id: initialValues?.id,
          email: values.email,
          fullName: values.fullName,
          authUserId: values.authUserId ?? '',
          isActive: values.isActive,
          roleId: values.roleId
        };

        await mutation.mutateAsync(payload);
      })}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" aria-label="Employee full name" {...form.register('fullName')} />
          {form.formState.errors.fullName ? (
            <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" aria-label="Employee email" {...form.register('email')} />
          {form.formState.errors.email ? (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="authUserId">Auth User ID (optional)</Label>
          <Input
            id="authUserId"
            aria-label="Employee auth user id"
            placeholder="auth_user_id"
            {...form.register('authUserId')}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="roleId">Role</Label>
          <select
            id="roleId"
            aria-label="Employee role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...form.register('roleId')}
            disabled={!hasRoles}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.code})
              </option>
            ))}
          </select>
          {!hasRoles ? <p className="text-sm text-destructive">No roles available. Create role first.</p> : null}
          {form.formState.errors.roleId ? <p className="text-sm text-destructive">{form.formState.errors.roleId.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => {
            const isActive = Boolean(field.value);

            return (
              <div className="grid gap-2">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Employee
                </Label>

                <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Enable presence submission for this employee.</p>

                  <button
                    id="isActive"
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    aria-label="Employee active status"
                    onClick={() => field.onChange(!isActive)}
                    className={cn(
                      'relative h-7 w-12 rounded-full border border-stone-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive ? 'bg-stone-800' : 'bg-stone-300'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>
            );
          }}
        />
      </div>

      {mutation.data?.message ? (
        <p className={`text-sm ${mutation.data.success ? 'text-green-700' : 'text-destructive'}`}>
          {mutation.data.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Link href="/employees">
          <Button type="button" variant="outline" aria-label="Cancel employee form">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={mutation.isPending || !hasRoles} aria-label="Save employee data">
          {mutation.isPending ? 'Saving...' : mode === 'create' ? 'Create Employee' : 'Update Employee'}
        </Button>
      </div>
    </form>
  );
}
