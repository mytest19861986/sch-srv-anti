"use client";

import React from "react";
import { toPersianDigits } from "../../../utils/i18n";

export default function ReportsOverviewPage() {
  const metrics = [
    { label: "مجموع رویدادهای ثبت‌شده", value: "۴,۴۰۰,۰۰۰", change: "+۱۵٪ نسبت به ماه قبل" },
    { label: "نرخ تحویل موفق نوتیفیکیشن", value: "۹۹.۹۵٪", change: "بدون تاخیر صف" },
    { label: "میانگین زمان واکنش راننده", value: "۱.۲ ثانیه", change: "استاندارد عالی" },
    { label: "مدارس تحت پوشش پایلوت", value: "۱۲ واحد", change: "تهران، کرج، مشهد" },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <span>📊 شاخص‌های کلان پلتفرم (Platform KPI Overview)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">خلاصه آماری عملکرد تجمیعی، ترافیک و کیفیت خدمات در سطح کشور</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 font-medium">{m.label}</div>
            <div className="text-2xl font-black text-purple-400">{m.value}</div>
            <div className="text-[11px] text-emerald-400 font-medium">{m.change}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
