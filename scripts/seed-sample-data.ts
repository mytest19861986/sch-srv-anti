import { appLogger } from "../services/backend-api/src/shared/observability/logger.service";

export async function seedSampleData() {
  appLogger.info("🌱 Seeding comprehensive sample data for Staging / Demo...");

  const data = {
    tenant: {
      id: "tenant-school-mehr",
      name: "دبیرستان مهر آفرین",
      code: "sch_mehr",
    },
    drivers: [
      { id: "drv-1", name: "علی رضایی", phone: "09121112233", shift: "shift-mehr-1" },
      { id: "drv-2", name: "حسین حسینی", phone: "09123334455", shift: "shift-mehr-2" },
      { id: "drv-3", name: "محمد محمدی", phone: "09125556677", shift: "shift-mehr-3" },
      { id: "drv-4", name: "رضا کریمی", phone: "09127778899", shift: "shift-mehr-4" },
      { id: "drv-5", name: "احمد احمدی", phone: "09129990011", shift: "shift-mehr-5" },
    ],
    totalStudents: 20,
    totalParents: 40,
  };

  appLogger.info(`✅ Seed completed: 1 school (${data.tenant.name}), 5 drivers, 20 students, 40 parents.`);
  return data;
}

if (import.meta.main) {
  seedSampleData();
}
