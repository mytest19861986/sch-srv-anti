/**
 * Automated UI Snapshot Capture Script (Protocol v3)
 * Captures key views across School Dashboard and Super Admin Panel
 */
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

const SCREENSHOT_DIR = resolve(process.cwd(), "docs/screenshots");

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

export const SNAPSHOT_CONFIGS = [
  { name: "school-web-login.png", url: "http://localhost:3001/login", description: "School Web Login Screen" },
  { name: "school-web-dashboard.png", url: "http://localhost:3001/", description: "School Web Main KPI Dashboard" },
  { name: "school-web-stale-banner.png", url: "http://localhost:3001/", description: "School Web Stale Data Alert Banner" },
  { name: "super-admin-login.png", url: "http://localhost:3002/login", description: "Super Admin Login Screen" },
  { name: "super-admin-overview.png", url: "http://localhost:3002/", description: "Super Admin Platform Overview" },
  { name: "super-admin-tenants.png", url: "http://localhost:3002/", description: "Super Admin Tenant Management Table" },
];

console.log("📸 UI Snapshot script configured for 6 target captures:", SNAPSHOT_CONFIGS.map(c => c.name));
