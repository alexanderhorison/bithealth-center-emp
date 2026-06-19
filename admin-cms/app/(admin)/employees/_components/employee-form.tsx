'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { saveEmployeeAction } from '@/app/(admin)/employees/actions';
import { Badge } from '@/components/ui/badge';
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
    app: string;
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
      roleIds: initialValues?.roleIds ?? []
    }
  });

  const mutation = useMutation({
    mutationFn: (input: SaveEmployeeInput) => saveEmployeeAction(input),
    onSuccess: (result) => {
      alert(result.message);
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
          roleIds: values.roleIds
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

                <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 h-10">
                  <p className="text-xs text-muted-foreground">Enable presence submission</p>

                  <button
                    id="isActive"
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    aria-label="Employee active status"
                    onClick={() => field.onChange(!isActive)}
                    className={cn(
                      'relative h-6 w-10 rounded-full border border-border transition-colors focus-visible:outline-none',
                      isActive ? 'bg-brand-500 border-brand-600' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform',
                        isActive ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Role assignment */}
      <div className="grid gap-2">
        <Label>Roles</Label>
        {!hasRoles ? (
          <p className="text-sm text-destructive">No roles available. Create role first.</p>
        ) : (
          <Controller
            control={form.control}
            name="roleIds"
            render={({ field }) => {
              const selected: string[] = field.value ?? [];
              const toggle = (id: string) => {
                field.onChange(
                  selected.includes(id) ? selected.filter((r) => r !== id) : [...selected, id]
                );
              };

              return (
                <div className="flex flex-wrap gap-3 mt-1">
                  {roles.map((role) => {
                    const isSelected = selected.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggle(role.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all min-w-[200px]',
                          isSelected
                            ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                            : 'border-border bg-background hover:border-brand-200 hover:bg-brand-25'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                          )}
                        >
                          {isSelected && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="grid gap-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{role.name}</span>
                            <Badge variant={role.app === 'cms' ? 'cms' : 'emp'} className="text-[10px] px-1 py-0 font-normal">
                              {role.app === 'cms' ? 'CMS' : 'Emp'}
                            </Badge>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">{role.code}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            }}
          />
        )}
        {form.formState.errors.roleIds ? (
          <p className="text-sm text-destructive">{form.formState.errors.roleIds.message}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link href="/employees" prefetch={false}>
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
