"use client";

import React from "react";
import { toPersianDigits } from "../../../utils/i18n";

export default function PlatformGrowthPage() {
  const cities = [
    { city: "تهران و حومه", schools: 6, students: 650, fleet: 54, growth: "+۲۲٪" },
    { city: "استان البرز (کرج)", schools: 3, students: 420, fleet: 35, growth: "+۱۸٪" },
    { city: "مشهد مقدس", schools: 2, students: 280, fleet: 22, growth: "+۱۴٪" },
    { city: "تبریز", schools: 1, students: 100, fleet: 9, growth: "+۱۰٪" },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <span>📈 آمار رشد و توسعه ناوگان کشوری (Growth Metrics)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">تفکیک استانی و منطقه‌ای تعداد مدارس، ناوگان خودروها و نرخ رشد دانش‌آموزان</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">استان / منطقه</th>
              <th className="p-3.5">مدارس فعال</th>
              <th className="p-3.5">دانش‌آموزان تحت پوشش</th>
              <th className="p-3.5">ناوگان خودرویی</th>
              <th className="p-3.5">نرخ رشد ماهانه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {cities.map((c) => (
              <tr key={c.city} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{c.city}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(c.schools)} مدرسه</td>
                <td className="p-3.5 font-mono text-purple-400 font-bold">{toPersianDigits(c.students)} نفر</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(c.fleet)} دستگاه</td>
                <td className="p-3.5 font-mono text-emerald-400 font-bold">{c.growth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
