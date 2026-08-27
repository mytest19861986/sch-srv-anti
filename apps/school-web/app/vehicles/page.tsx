"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function VehiclesPage() {
  const [search, setSearch] = useState("");

  const vehicles = [
    { id: "veh-1", model: "تویوتا ون هایس ۱۴ نفره", plate: "۷۷ ب ۹۴۱ ایران ۴۴", capacity: 14, driverName: "علی رضایی", driverPhone: "۰۹۱۲۱۱۱۲۲۳۳", status: "ACTIVE" },
    { id: "veh-2", model: "مینی‌بوس هیوندای کروس", plate: "۲۲ ج ۳۳۳ ایران ۳۳", capacity: 18, driverName: "حسین حسینی", driverPhone: "۰۹۱۲۳۳۳۴۴۵۵", status: "ACTIVE" },
    { id: "veh-3", model: "پژو پارس سفید", plate: "۱۱ د ۵۵۵ ایران ۱۱", capacity: 4, driverName: "رضا محمدی", driverPhone: "۰۹۱۲۶۶۶۷۷۸۸", status: "ACTIVE" },
  ];

  const filtered = vehicles.filter(v => !search || v.model.includes(search) || v.plate.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🚗 ناوگان خودروها و استانداردهای فنی</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مشخصات پلاک، ظرفیت سرنشین و رانندگان متصدی خودروها</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو بر اساس مدل یا پلاک..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            تعداد خودروها: <span className="text-emerald-400 font-bold">{toPersianDigits(8)} دستگاه</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نوع و مدل خودرو</th>
              <th className="p-3.5">پلاک انتظامی</th>
              <th className="p-3.5">ظرفیت مسافر</th>
              <th className="p-3.5">راننده متصدی</th>
              <th className="p-3.5">تماس راننده</th>
              <th className="p-3.5">وضعیت معاینه فنی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{v.model}</td>
                <td className="p-3.5 font-mono text-amber-400">{v.plate}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(v.capacity)} نفر</td>
                <td className="p-3.5 text-slate-200">{v.driverName}</td>
                <td className="p-3.5 font-mono text-slate-400">{v.driverPhone}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    معتبر
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
