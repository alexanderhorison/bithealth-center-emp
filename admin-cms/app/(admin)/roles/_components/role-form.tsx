'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { saveRoleAction } from '@/app/(admin)/roles/actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ALL_CMS_ROUTES, ALL_EMP_ROUTES, saveRoleSchema, type SaveRoleInput } from '@/lib/validations/role';

const APP_LABELS: Record<string, string> = {
  cms: 'Admin CMS',
  emp: 'Employee App'
};

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  roles: 'Role Management',
  presences: 'Presences',
  'access-requests': 'Access Requests',
  presence: 'Presence',
  'account-request': 'Account Request',
  modules: 'Modules'
};

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
      description: initialValues?.description ?? '',
      app: initialValues?.app ?? 'emp',
      routes: initialValues?.routes ?? []
    }
  });

  const selectedApp = useWatch({ control: form.control, name: 'app' });
  const selectedRoutes = useWatch({ control: form.control, name: 'routes' });
  const availableRoutes = selectedApp === 'cms' ? ALL_CMS_ROUTES : ALL_EMP_ROUTES;

  const mutation = useMutation({
    mutationFn: (payload: SaveRoleInput) => saveRoleAction(payload),
    onSuccess: (result) => {
      if (result.success) {
        router.push('/roles');
        router.refresh();
      }
    }
  });

  function toggleRoute(route: string, checked: boolean) {
    const current = form.getValues('routes');
    form.setValue('routes', checked ? [...current, route] : current.filter((r) => r !== route), {
      shouldValidate: true
    });
  }

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card p-4"
      onSubmit={form.handleSubmit(async (values) => {
        await mutation.mutateAsync({
          ...values,
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
            placeholder="MANAGER"
            disabled={isSystem}
            {...form.register('code')}
          />
          {form.formState.errors.code && (
            <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Role Name</Label>
          <Input id="name" aria-label="Role name" placeholder="Manager" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          aria-label="Role description"
          placeholder="Role permission summary"
          className="min-h-20"
          {...form.register('description')}
        />
      </div>

      {/* App selector */}
      <div className="grid gap-2">
        <Label>App</Label>
        {isSystem ? (
          <p className="text-sm text-muted-foreground">{APP_LABELS[selectedApp] ?? selectedApp}</p>
        ) : (
          <div className="flex gap-6">
            {(['cms', 'emp'] as const).map((appValue) => (
              <label key={appValue} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  value={appValue}
                  checked={selectedApp === appValue}
                  onChange={() => {
                    form.setValue('app', appValue);
                    form.setValue('routes', [], { shouldValidate: true });
                  }}
                />
                {APP_LABELS[appValue]}
              </label>
            ))}
          </div>
        )}
        {form.formState.errors.app && (
          <p className="text-sm text-destructive">{form.formState.errors.app.message}</p>
        )}
      </div>

      {/* Route permissions */}
      <div className="grid gap-2">
        <Label>Page Access</Label>
        {isSystem ? (
          <p className="text-sm text-muted-foreground">System role permissions are managed by the system.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableRoutes.map((route) => (
              <label key={route} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedRoutes.includes(route)}
                  onCheckedChange={(checked) => toggleRoute(route, !!checked)}
                />
                {ROUTE_LABELS[route] ?? route}
              </label>
            ))}
          </div>
        )}
        {form.formState.errors.routes && (
          <p className="text-sm text-destructive">{form.formState.errors.routes.message}</p>
        )}
      </div>

      {mutation.data && !mutation.data.success && (
        <p className="text-sm text-destructive">{mutation.data.message}</p>
      )}

      <div className="flex justify-end gap-2">
        <Link href="/roles">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : mode === 'create' ? 'Create Role' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
