"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function DriversPage() {
  const [search, setSearch] = useState("");

  const drivers = [
    { id: "drv-1", fullName: "علی رضایی", phone: "۰۹۱۲۱۱۱۲۲۳۳", email: "driver@demo.ir", licenseNo: "ب-۹۸۷۶۵۴۳۲", vehicleModel: "ون هایس", vehiclePlate: "۷۷ ب ۹۴۱ ایران ۴۴", activeRoute: "مسیر ۱ - ونک", status: "ACTIVE" },
    { id: "drv-2", fullName: "حسین حسینی", phone: "۰۹۱۲۳۳۳۴۴۵۵", email: "driver2@demo.ir", licenseNo: "ب-۱۲۳۴۵۶۷۸", vehicleModel: "مینی‌بوس هیوندای", vehiclePlate: "۲۲ ج ۳۳۳ ایران ۳۳", activeRoute: "مسیر ۲ - پاسداران", status: "ACTIVE" },
  ];

  const filtered = drivers.filter(d => !search || d.fullName.includes(search) || d.phone.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🚐 رانندگان و مجریان سرویس</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">اطلاعات هویتی، گواهینامه، خودرو و مسیرهای تخصیص‌یافته به رانندگان</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با نام یا تلفن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            رانندگان فعال: <span className="text-emerald-400 font-bold">{toPersianDigits(8)} نفر</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام راننده</th>
              <th className="p-3.5">شماره تماس</th>
              <th className="p-3.5">شماره گواهینامه</th>
              <th className="p-3.5">مدل خودرو</th>
              <th className="p-3.5">پلاک انتظامی</th>
              <th className="p-3.5">مسیر فعال</th>
              <th className="p-3.5">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{d.fullName}</td>
                <td className="p-3.5 font-mono text-slate-400">{d.phone}</td>
                <td className="p-3.5 font-mono text-slate-300">{d.licenseNo}</td>
                <td className="p-3.5 text-slate-200">{d.vehicleModel}</td>
                <td className="p-3.5 font-mono text-amber-400">{d.vehiclePlate}</td>
                <td className="p-3.5 text-emerald-400 font-medium">{d.activeRoute}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    آماده خدمت
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
