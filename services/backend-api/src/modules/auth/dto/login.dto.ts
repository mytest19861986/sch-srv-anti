import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type LoginDto = z.infer<typeof LoginSchema>;

export interface AuthTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT';
}

export interface LoginResponseDto {
  success: boolean;
  access_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    tenant_id: string;
  };
}
