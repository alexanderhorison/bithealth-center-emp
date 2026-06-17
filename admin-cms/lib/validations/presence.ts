import { z } from 'zod';

export const deletePresenceSchema = z.object({
  id: z.string().uuid()
});

export type DeletePresenceInput = z.infer<typeof deletePresenceSchema>;
