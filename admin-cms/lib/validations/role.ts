import { z } from 'zod';

const CMS_ROUTES = ['dashboard', 'employees', 'roles', 'presences', 'access-requests'] as const;
const EMP_ROUTES = ['dashboard', 'presence', 'account-request', 'modules'] as const;

export const ALL_CMS_ROUTES: string[] = [...CMS_ROUTES];
export const ALL_EMP_ROUTES: string[] = [...EMP_ROUTES];

export const saveRoleSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Code must be uppercase letters, numbers, or underscores'),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional().or(z.literal('')),
  app: z.enum(['cms', 'emp'], { required_error: 'Select an app' }),
  routes: z.array(z.string()).min(1, 'Select at least one route')
});

export const deleteRoleSchema = z.object({
  id: z.string().uuid()
});

export type SaveRoleInput = z.infer<typeof saveRoleSchema>;
export type DeleteRoleInput = z.infer<typeof deleteRoleSchema>;
