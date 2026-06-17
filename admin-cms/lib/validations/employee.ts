import { z } from 'zod';

export const saveEmployeeSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  authUserId: z.string().min(1).optional().or(z.literal('')),
  isActive: z.boolean(),
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role is required')
});

export const toggleEmployeeSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean()
});

export type SaveEmployeeInput = z.infer<typeof saveEmployeeSchema>;
export type ToggleEmployeeInput = z.infer<typeof toggleEmployeeSchema>;
