"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function RoutesPage() {
  const [search, setSearch] = useState("");

  const routes = [
    { id: "route-1", name: "مسیر ۱ - ونک به سعادت‌آباد", code: "RT-VNK-1", stopsCount: 6, studentsCount: 18, driverName: "علی رضایی", shiftType: "صبح و عصر", status: "ACTIVE" },
    { id: "route-2", name: "مسیر ۲ - پاسداران به نیاوران", code: "RT-PSD-2", stopsCount: 5, studentsCount: 15, driverName: "حسین حسینی", shiftType: "صبح و عصر", status: "ACTIVE" },
    { id: "route-3", name: "مسیر ۳ - شهرک غرب به بلوار دریا", code: "RT-WST-3", stopsCount: 4, studentsCount: 14, driverName: "رضا محمدی", shiftType: "صبح", status: "ACTIVE" },
  ];

  const filtered = routes.filter(r => !search || r.name.includes(search) || r.code.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🗺️ مسیرهای تعریف‌شده سرویس</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت ایستگاه‌ها، تعداد مسافران و رانندگان اختصاص‌یافته به مسیرها</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو در مسیرها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            تعداد کل مسیرها: <span className="text-emerald-400 font-bold">{toPersianDigits(8)} مسیر</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">عنوان مسیر</th>
              <th className="p-3.5">کد شناسایی</th>
              <th className="p-3.5">تعداد ایستگاه</th>
              <th className="p-3.5">تعداد دانش‌آموز</th>
              <th className="p-3.5">راننده متصدی</th>
              <th className="p-3.5">نوع شیفت</th>
              <th className="p-3.5">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{r.name}</td>
                <td className="p-3.5 font-mono text-emerald-400">{r.code}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(r.stopsCount)} ایستگاه</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(r.studentsCount)} نفر</td>
                <td className="p-3.5 text-slate-200">{r.driverName}</td>
                <td className="p-3.5 text-slate-400">{r.shiftType}</td>
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
