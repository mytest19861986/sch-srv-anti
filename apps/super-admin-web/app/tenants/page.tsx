"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function TenantsPage() {
  const [tenants, setTenants] = useState([
    { id: "tenant-school-mehr", name: "مجتمع آموزشی مهر آفرین", code: "SCH-MEHR-01", city: "تهران", studentsCount: 145, driversCount: 8, isActive: true },
    { id: "tenant-school-alborz", name: "دبستان هوشمند البرز", code: "SCH-ALB-02", city: "کرج", studentsCount: 320, driversCount: 16, isActive: true },
    { id: "tenant-school-razavi", name: "مجموعه مدارس رضوی", code: "SCH-RZV-03", city: "مشهد", studentsCount: 480, driversCount: 24, isActive: true },
    { id: "tenant-school-tabriz", name: "دبیرستان علامه طباطبایی", code: "SCH-TBZ-04", city: "تبریز", studentsCount: 210, driversCount: 12, isActive: true },
  ]);

  const toggleStatus = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🏢 مدیریت مدارس و شعب (Tenants Management)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">ایجاد، تعلیق و مدیریت اطلاعات مدارس عضو پلتفرم کشوری</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-3.5 py-2 rounded-xl">
          تعداد مدارس فعال: <span className="text-purple-400 font-bold">{toPersianDigits(tenants.length)} واحد</span>
        </span>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام واحد آموزشی</th>
              <th className="p-3.5">کد شناسایی</th>
              <th className="p-3.5">شهر / منطقه</th>
              <th className="p-3.5">دانش‌آموزان</th>
              <th className="p-3.5">ناوگان خودرویی</th>
              <th className="p-3.5">وضعیت سرویس</th>
              <th className="p-3.5">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{t.name}</td>
                <td className="p-3.5 font-mono text-purple-400">{t.code}</td>
                <td className="p-3.5 text-slate-300">{t.city}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(t.studentsCount)} نفر</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(t.driversCount)} خودرو</td>
                <td className="p-3.5">
                  {t.isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      فعال
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-900/40 font-medium">
                      غیرفعال / تعلیق
                    </span>
                  )}
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => toggleStatus(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      t.isActive
                        ? "bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/60"
                        : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60"
                    }`}
                  >
                    {t.isActive ? "تعلیق موقت" : "فعال‌سازی مجدد"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
