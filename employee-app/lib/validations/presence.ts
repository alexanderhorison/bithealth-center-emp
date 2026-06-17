import { z } from 'zod';

export const presenceStatusSchema = z.enum(['PRESENT', 'WFH', 'NOT_PRESENT', 'GO_TO_CLIENT']);

export const submitPresenceSchema = z.object({
  status: presenceStatusSchema,
  selfieUrl: z.string().url().optional().or(z.literal('')),
  note: z.string().max(250).optional().or(z.literal(''))
});

export type SubmitPresenceInput = z.infer<typeof submitPresenceSchema>;
