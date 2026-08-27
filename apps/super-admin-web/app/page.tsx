"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCard, StatusBadge } from "@school-platform/ui";
import { fa, toPersianDigits } from "@school-platform/i18n";
import { SuperAdminTenant, SuperAdminAuditLog } from "@school-platform/api-client";

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([
    {
      id: "tenant-mehr",
      name: "مدرسه مهر آفرین",
      code: "sch_mehr",
      is_active: true,
      created_at: "2026-01-15T00:00:00.000Z",
    },
    {
      id: "tenant-alborz",
      name: "مجموعه آموزشی البرز",
      code: "sch_alborz",
      is_active: true,
      created_at: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "tenant-razi",
      name: "دبیرستان رازی",
      code: "sch_razi",
      is_active: false,
      created_at: "2025-11-20T00:00:00.000Z",
    },
  ]);

  const [auditLogs] = useState<SuperAdminAuditLog[]>([
    {
      id: "log-1",
      tenant_id: "tenant-mehr",
      user_id: "usr-admin-1",
      action: "CORRECTED_ATTENDANCE",
      created_at: "2026-08-27T08:15:00.000Z",
    },
    {
      id: "log-2",
      tenant_id: "tenant-alborz",
      user_id: "usr-super-admin",
      action: "PROVISION_TENANT",
      created_at: "2026-08-26T14:30:00.000Z",
    },
  ]);

  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantCode, setNewTenantCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantCode) return;

    const newTenant: SuperAdminTenant = {
      id: `tenant-${Date.now()}`,
      name: newTenantName,
      code: newTenantCode,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setTenants([newTenant, ...tenants]);
    setNewTenantName("");
    setNewTenantCode("");
    setIsModalOpen(false);
  };

  const handleSoftDelete = (id: string) => {
    if (confirm(fa.superAdmin.softDeleteWarning)) {
      setTenants(tenants.map((t) => (t.id === id ? { ...t, is_active: false } : t)));
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {fa.common.superAdminTitle}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            راهبری مرکزی معماری چندمستأجری • پایگاه امنیتی Zero-Trust
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2"
          >
            <span>{fa.superAdmin.newTenant}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 font-semibold text-sm transition-all border border-red-800/40 flex items-center gap-2"
          >
            <span>خروج از حساب</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="مدارس فعال"
          value={tenants.filter((t) => t.is_active).length}
          variant="success"
          subtitle="تایید شده در پلتفرم"
        />
        <KpiCard
          title="کل کاربران فعال"
          value={1850}
          variant="info"
          subtitle="رانندگان، اولیا و کادر مدارس"
        />
        <KpiCard
          title="کل رویدادهای امروز"
          value={4920}
          variant="default"
          subtitle="سوار و پیاده شدن ثبت‌شده"
        />
        <KpiCard
          title="آپ‌تایم پلتفرم"
          value="99.99%"
          variant="success"
          subtitle="SLA تضمین شده"
        />
      </div>

      {/* Tenant Management Table */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {fa.superAdmin.tenants}
          </h2>
          <span className="text-xs text-slate-400">
            {toPersianDigits(tenants.length)} مدرسه ثبت شده
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-3 px-4 font-semibold">{fa.superAdmin.tenantName}</th>
                <th className="pb-3 px-4 font-semibold">{fa.superAdmin.tenantCode}</th>
                <th className="pb-3 px-4 font-semibold">تاریخ ایجاد</th>
                <th className="pb-3 px-4 font-semibold">{fa.common.status}</th>
                <th className="pb-3 px-4 font-semibold">{fa.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-200">{t.name}</td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-400">{t.code}</td>
                  <td className="py-4 px-4 text-slate-400">
                    {t.created_at.substring(0, 10)}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={t.is_active ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="py-4 px-4">
                    {t.is_active ? (
                      <button
                        onClick={() => handleSoftDelete(t.id)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                      >
                        غیرفعال‌سازی (Soft Delete)
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">بایگانی شده</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Log Viewer */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">
          {fa.superAdmin.auditLogs}
        </h2>
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 font-mono font-bold">
                  {log.action}
                </span>
                <span className="text-slate-300 font-mono">مستأجر: {log.tenant_id}</span>
                <span className="text-slate-400">کاربر: {log.user_id}</span>
              </div>
              <span className="text-slate-500 font-mono">{log.created_at}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Modal for Creating Tenant */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">{fa.superAdmin.newTenant}</h3>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {fa.superAdmin.tenantName}
                </label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="مثال: مدرسه علامه حلی"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {fa.superAdmin.tenantCode}
                </label>
                <input
                  type="text"
                  value={newTenantCode}
                  onChange={(e) => setNewTenantCode(e.target.value)}
                  placeholder="مثال: sch_helli"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  {fa.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30"
                >
                  {fa.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
