"use client";

import React, { useState } from "react";

export default function GlobalUsersPage() {
  const [selectedTenant, setSelectedTenant] = useState("ALL");

  const users = [
    { id: "usr-sa-1", fullName: "راهبر ارشد پلتفرم", email: "super-admin@platform.ir", role: "SUPER_ADMIN", tenant: "مرکزی (Platform)", status: "ACTIVE" },
    { id: "usr-sch-1", fullName: "مدیر مدرسه مهر آفرین", email: "school-admin@demo.ir", role: "SCHOOL_ADMIN", tenant: "مجتمع مهر آفرین", status: "ACTIVE" },
    { id: "usr-drv-1", fullName: "علی رضایی (راننده)", email: "driver@demo.ir", role: "DRIVER", tenant: "مجتمع مهر آفرین", status: "ACTIVE" },
    { id: "usr-par-1", fullName: "محمد تهرانی (ولی)", email: "parent@demo.ir", role: "PARENT", tenant: "مجتمع مهر آفرین", status: "ACTIVE" },
    { id: "usr-sch-2", fullName: "مدیر مدرسه البرز", email: "admin.alborz@demo.ir", role: "SCHOOL_ADMIN", tenant: "دبستان البرز", status: "ACTIVE" },
  ];

  const filtered = users.filter(u => selectedTenant === "ALL" || u.tenant.includes(selectedTenant));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>👥 کاربران سراسری پلتفرم (Global Users)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت هویت، نقش‌های سازمانی و فیلتر کاربران بر اساس مدرسه</p>
        </div>
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">نمایش همه مدارس</option>
          <option value="مهر آفرین">مدرسه مهر آفرین</option>
          <option value="البرز">مدرسه البرز</option>
        </select>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام و نام خانوادگی</th>
              <th className="p-3.5">پست الکترونیکی</th>
              <th className="p-3.5">مدرسه / سازمان</th>
              <th className="p-3.5">نقش سیستمی</th>
              <th className="p-3.5">وضعیت حساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{u.fullName}</td>
                <td className="p-3.5 font-mono text-slate-400">{u.email}</td>
                <td className="p-3.5 text-slate-300">{u.tenant}</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                    u.role === "SUPER_ADMIN"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                      : u.role === "SCHOOL_ADMIN"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    فعال
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
