import { z } from 'zod';

export const saveRoleSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Code must be uppercase letters, numbers, or underscores'),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional().or(z.literal(''))
});

export const deleteRoleSchema = z.object({
  id: z.string().uuid()
});

export type SaveRoleInput = z.infer<typeof saveRoleSchema>;
export type DeleteRoleInput = z.infer<typeof deleteRoleSchema>;
