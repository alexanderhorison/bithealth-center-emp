import { z } from 'zod';

export const presenceFilterSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD')
    .optional(),
  q: z.string().max(120).optional()
});

export type PresenceFilterInput = z.infer<typeof presenceFilterSchema>;
