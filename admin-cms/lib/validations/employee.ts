import { z } from 'zod';

export const saveEmployeeSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  authUserId: z.string().min(1).optional().or(z.literal('')),
  isActive: z.boolean(),
  roleId: z.string().uuid()
});

export const toggleEmployeeSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean()
});

export type SaveEmployeeInput = z.infer<typeof saveEmployeeSchema>;
export type ToggleEmployeeInput = z.infer<typeof toggleEmployeeSchema>;
