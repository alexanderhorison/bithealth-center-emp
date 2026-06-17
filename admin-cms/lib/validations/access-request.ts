import { z } from 'zod';

export const accessRequestProviderSchema = z.enum(['GITHUB', 'FIGMA']);
export const accessRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'DENIED']);
export const accessRequestTypeSchema = z.enum(['REPO_ACCESS', 'NEW_REPO', 'FIGMA_FILE', 'FIGMA_PROJECT']);

export const adminUpdateAccessRequestSchema = z.object({
  id: z.string().uuid(),
  status: accessRequestStatusSchema,
  adminNote: z.string().max(500).optional().or(z.literal(''))
});

export const accessRequestSearchParamsSchema = z.object({
  page: z
    .string()
    .regex(/^\\d+$/)
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1))
    .optional(),
  pageSize: z.enum(['10', '20', '50']).transform(Number).optional(),
  q: z.string().max(120).optional(),
  provider: accessRequestProviderSchema.optional(),
  status: accessRequestStatusSchema.optional(),
  sortBy: z.enum(['created_at', 'status', 'provider']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional()
});

export type AdminUpdateAccessRequestInput = z.infer<typeof adminUpdateAccessRequestSchema>;
