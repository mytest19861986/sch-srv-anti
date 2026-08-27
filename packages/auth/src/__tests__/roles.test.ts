import { describe, expect, it } from "bun:test";
import { canAccessSchoolDashboard, canAccessSuperAdmin } from "../roles";

describe("RBAC Role Guard Tests", () => {
  it("should allow SCHOOL_ADMIN and SCHOOL_OPERATOR to access school dashboard", () => {
    expect(canAccessSchoolDashboard("SCHOOL_ADMIN")).toBe(true);
    expect(canAccessSchoolDashboard("SCHOOL_OPERATOR")).toBe(true);
    expect(canAccessSchoolDashboard("SUPER_ADMIN")).toBe(true);
  });

  it("should reject DRIVER and PARENT from school dashboard", () => {
    expect(canAccessSchoolDashboard("DRIVER")).toBe(false);
    expect(canAccessSchoolDashboard("PARENT")).toBe(false);
  });

  it("should only allow SUPER_ADMIN to access Super Admin panel", () => {
    expect(canAccessSuperAdmin("SUPER_ADMIN")).toBe(true);
    expect(canAccessSuperAdmin("SCHOOL_ADMIN")).toBe(false);
    expect(canAccessSuperAdmin("DRIVER")).toBe(false);
  });
});
