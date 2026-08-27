"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function ServicesPage() {
  const [search, setSearch] = useState("");

  const services = [
    { id: "srv-101", routeName: "مسیر ۱ - ونک به سعادت‌آباد", driverName: "علی رضایی", driverPhone: "۰۹۱۲۱۱۱۲۲۳۳", totalStudents: 18, pickedUp: 18, droppedOff: 16, inTransit: 2, status: "IN_PROGRESS" },
    { id: "srv-102", routeName: "مسیر ۲ - پاسداران به نیاوران", driverName: "حسین حسینی", driverPhone: "۰۹۱۲۳۳۳۴۴۵۵", totalStudents: 15, pickedUp: 15, droppedOff: 15, inTransit: 0, status: "COMPLETED" },
    { id: "srv-103", routeName: "مسیر ۳ - شهرک غرب به بلوار دریا", driverName: "رضا محمدی", driverPhone: "۰۹۱۲۶۶۶۷۷۸۸", totalStudents: 14, pickedUp: 14, droppedOff: 14, inTransit: 0, status: "COMPLETED" },
  ];

  const filtered = services.filter(s => !search || s.routeName.includes(search) || s.driverName.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🚌 سرویس‌های فعال امروز (شیفت جاری)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">پایش لحظه‌ای عملکرد رانندگان، نسبت سوار/پیاده شدن و پیشرفت سفر</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو در سرویس‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            سرویس‌های در حال اجرا: <span className="text-amber-400 font-bold">{toPersianDigits(1)} مسیر</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">مسیر و شیفت</th>
              <th className="p-3.5">راننده متصدی</th>
              <th className="p-3.5">تماس راننده</th>
              <th className="p-3.5">تعداد کل دانش‌آموزان</th>
              <th className="p-3.5">سوار شده</th>
              <th className="p-3.5">در خودرو</th>
              <th className="p-3.5">پیاده شده</th>
              <th className="p-3.5">وضعیت سرویس</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((srv) => (
              <tr key={srv.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{srv.routeName}</td>
                <td className="p-3.5 text-slate-200">{srv.driverName}</td>
                <td className="p-3.5 font-mono text-slate-400">{srv.driverPhone}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(srv.totalStudents)} نفر</td>
                <td className="p-3.5 font-mono text-blue-400">{toPersianDigits(srv.pickedUp)}</td>
                <td className="p-3.5 font-mono text-amber-400">{toPersianDigits(srv.inTransit)}</td>
                <td className="p-3.5 font-mono text-emerald-400">{toPersianDigits(srv.droppedOff)}</td>
                <td className="p-3.5">
                  {srv.status === "IN_PROGRESS" ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      در حال تردد
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      پایان یافته
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
