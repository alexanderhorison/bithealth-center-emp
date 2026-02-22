import { z } from 'zod';

export const accessRequestProviderSchema = z.enum(['GITHUB', 'FIGMA']);
export const accessRequestTypeSchema = z.enum(['REPO_ACCESS', 'NEW_REPO', 'FIGMA_FILE', 'FIGMA_PROJECT']);

const urlSchema = z.string().url();

export const createAccessRequestSchema = z
  .object({
    provider: accessRequestProviderSchema,
    requestType: accessRequestTypeSchema,
    targetUrl: z.string().trim(),
    displayName: z.string().min(2).max(120),
    justification: z.string().min(5).max(500),
    additionalInfo: z.string().max(500).optional().or(z.literal(''))
  })
  .superRefine((value, ctx) => {
    const isGithubType = value.requestType === 'REPO_ACCESS' || value.requestType === 'NEW_REPO';
    const isFigmaType = value.requestType === 'FIGMA_FILE' || value.requestType === 'FIGMA_PROJECT';

    if ((value.provider === 'GITHUB' && !isGithubType) || (value.provider === 'FIGMA' && !isFigmaType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['requestType'],
        message: 'Invalid request type for selected provider'
      });
    }

    const isUrlRequired = value.requestType === 'REPO_ACCESS' || value.requestType === 'FIGMA_FILE';
    const hasUrl = value.targetUrl.length > 0;

    if (isUrlRequired && !hasUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetUrl'],
        message: 'Target URL is required for this request type'
      });
      return;
    }

    if (hasUrl && !urlSchema.safeParse(value.targetUrl).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetUrl'],
        message: 'Please enter a valid URL'
      });
    }
  });

export const accessRequestSearchParamsSchema = z.object({
  page: z
    .string()
    .regex(/^\\d+$/)
    .transform((value) => Number(value))
    .pipe(z.number().int().min(1))
    .optional(),
  pageSize: z.enum(['10', '20']).transform(Number).optional()
});

export type CreateAccessRequestInput = z.infer<typeof createAccessRequestSchema>;
