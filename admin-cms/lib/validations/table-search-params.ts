import { z } from 'zod';

export const tableSortDirectionSchema = z.enum(['asc', 'desc']);

const pageSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value))
  .pipe(z.number().int().min(1))
  .optional();

const pageSizeSchema = z.enum(['10', '20', '50']).transform(Number).optional();

export const baseTableSearchParamsSchema = z.object({
  page: pageSchema,
  pageSize: pageSizeSchema,
  q: z.string().trim().max(120).optional(),
  sortDir: tableSortDirectionSchema.optional()
});

export const employeeSortFieldSchema = z.enum(['full_name', 'email', 'created_at', 'is_active']);
export const roleSortFieldSchema = z.enum(['code', 'name', 'description', 'is_system']);
export const presenceSortFieldSchema = z.enum(['presence_date', 'employee', 'status', 'note']);

export const employeeTableSearchParamsSchema = baseTableSearchParamsSchema.extend({
  sortBy: employeeSortFieldSchema.optional()
});

export const roleTableSearchParamsSchema = baseTableSearchParamsSchema.extend({
  sortBy: roleSortFieldSchema.optional()
});

export const presenceTableSearchParamsSchema = baseTableSearchParamsSchema.extend({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD')
    .optional(),
  sortBy: presenceSortFieldSchema.optional()
});

export type EmployeeSortField = z.infer<typeof employeeSortFieldSchema>;
export type RoleSortField = z.infer<typeof roleSortFieldSchema>;
export type PresenceSortField = z.infer<typeof presenceSortFieldSchema>;
export type TableSortDirection = z.infer<typeof tableSortDirectionSchema>;
