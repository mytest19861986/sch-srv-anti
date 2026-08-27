import { z } from 'zod';

export const CreateTenantSchema = z.object({
  id: z.string().min(2, 'Tenant ID must be at least 2 characters'),
  name: z.string().min(2, 'Tenant name is required')
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  is_active: z.enum(['true', 'false']).optional()
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
