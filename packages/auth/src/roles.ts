export type UserRole =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "SCHOOL_OPERATOR"
  | "DRIVER"
  | "PARENT";

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  token: string;
}

export function canAccessSchoolDashboard(role: UserRole): boolean {
  return role === "SCHOOL_ADMIN" || role === "SCHOOL_OPERATOR" || role === "SUPER_ADMIN";
}

export function canAccessSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}
