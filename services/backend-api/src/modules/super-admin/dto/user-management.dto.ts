import { z } from 'zod';

export const CreateUserSchema = z.object({
  id: z.string().min(2),
  tenant_id: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT'])
});

export const ChangeUserRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT'])
});

export const ChangeUserStatusSchema = z.object({
  is_active: z.enum(['true', 'false'])
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type ChangeUserRoleDto = z.infer<typeof ChangeUserRoleSchema>;
export type ChangeUserStatusDto = z.infer<typeof ChangeUserStatusSchema>;
