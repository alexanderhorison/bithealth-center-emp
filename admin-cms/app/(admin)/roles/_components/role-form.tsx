'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Check, LayoutDashboard, Monitor } from 'lucide-react';

import { saveRoleAction } from '@/app/(admin)/roles/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ALL_CMS_ROUTES, ALL_EMP_ROUTES, saveRoleSchema, type SaveRoleInput } from '@/lib/validations/role';

const ROUTE_META: Record<string, { label: string; description: string }> = {
  dashboard:        { label: 'Dashboard',        description: 'Home dashboard with stats overview' },
  employees:        { label: 'Employees',        description: 'Manage employee records' },
  roles:            { label: 'Role Management',  description: 'Create and edit role permissions' },
  presences:        { label: 'Presences',        description: 'View and manage presence logs' },
  'access-requests':{ label: 'Access Requests',  description: 'Handle account access requests' },
  presence:         { label: 'Presence',         description: 'Submit daily presence check-in' },
  'account-request':{ label: 'Account Request',  description: 'Request GitHub or Figma access' },
  modules:          { label: 'Modules',          description: 'Browse available app modules' }
};

const APP_OPTIONS = [
  {
    value: 'cms' as const,
    label: 'Admin CMS',
    description: 'Back-office management portal',
    icon: LayoutDashboard
  },
  {
    value: 'emp' as const,
    label: 'Employee App',
    description: 'Self-service employee portal',
    icon: Monitor
  }
];

type RoleFormProps = {
  mode: 'create' | 'edit';
  initialValues?: SaveRoleInput;
};

export function RoleForm({ mode, initialValues }: RoleFormProps) {
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

  const allSelected = availableRoutes.every((r) => selectedRoutes.includes(r));

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
    form.setValue(
      'routes',
      checked ? [...current, route] : current.filter((r) => r !== route),
      { shouldValidate: true }
    );
  }

  function toggleAll() {
    form.setValue('routes', allSelected ? [] : [...availableRoutes], { shouldValidate: true });
  }

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        await mutation.mutateAsync({
          ...values,
          id: initialValues?.id,
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          description: values.description?.trim() ?? ''
        });
      })}
      className="space-y-6"
    >
      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Details</CardTitle>
          <CardDescription>Name and identify this role.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="code">Role Code</Label>
              <Input
                id="code"
                placeholder="MANAGER"
                {...form.register('code')}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="name">Role Name</Label>
              <Input id="name" placeholder="Manager" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this role can do…"
              className="min-h-[72px] resize-none"
              {...form.register('description')}
            />
          </div>
        </CardContent>
      </Card>

      {/* App selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target App</CardTitle>
          <CardDescription>Which application does this role apply to?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
              {APP_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = selectedApp === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      form.setValue('app', opt.value);
                      form.setValue('routes', [], { shouldValidate: true });
                    }}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                      active
                        ? 'border-stone-800 bg-stone-50 ring-1 ring-stone-800'
                        : 'border-border hover:border-stone-400 hover:bg-stone-50/50'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                      active ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-200 bg-stone-100 text-stone-500'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="grid gap-0.5">
                      <span className="text-sm font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                    {active && (
                      <Check className="ml-auto h-4 w-4 shrink-0 text-stone-800" />
                    )}
                  </button>
                );
              })}
            </div>
          {form.formState.errors.app && (
            <p className="mt-2 text-xs text-destructive">{form.formState.errors.app.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Route permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Page Access</CardTitle>
              <CardDescription>Choose which pages this role can access.</CardDescription>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-medium text-stone-600 underline-offset-2 hover:underline"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-0 divide-y">
          {availableRoutes.map((route, i) => {
            const meta = ROUTE_META[route] ?? { label: route, description: '' };
            const checked = selectedRoutes.includes(route);
            return (
              <label
                key={route}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-1 py-3 transition-colors hover:bg-stone-50',
                  i === 0 && 'rounded-t-sm',
                  i === availableRoutes.length - 1 && 'rounded-b-sm'
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(val) => toggleRoute(route, !!val)}
                />
                <div className="grid flex-1 gap-0.5">
                  <span className="text-sm font-medium leading-none">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </div>
                {checked && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-stone-600" />
                )}
              </label>
            );
          })}
        </CardContent>
        {form.formState.errors.routes && (
          <div className="px-6 pb-4">
            <p className="text-xs text-destructive">{form.formState.errors.routes.message}</p>
          </div>
        )}
      </Card>

      {/* Error */}
      {mutation.data && !mutation.data.success && (
        <p className="text-sm text-destructive">{mutation.data.message}</p>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Link href="/roles" prefetch={false}>
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : mode === 'create' ? 'Create Role' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
