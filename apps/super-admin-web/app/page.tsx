"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../utils/i18n";

export default function SuperAdminOverviewPage() {
  const [lastRefreshed] = useState(new Date().toLocaleTimeString("fa-IR"));

  const kpis = [
    { title: "کل مدارس فعال پلتفرم", value: 12, unit: "مدرسه", icon: "🏢", color: "from-blue-600/20 to-blue-500/5", border: "border-blue-500/30", text: "text-blue-400" },
    { title: "کل دانش‌آموزان تحت پوشش", value: 1450, unit: "نفر", icon: "👨‍🎓", color: "from-purple-600/20 to-purple-500/5", border: "border-purple-500/30", text: "text-purple-400" },
    { title: "ناوگان فعال کشور", value: 120, unit: "خودرو", icon: "🚐", color: "from-emerald-600/20 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400" },
    { title: "رویدادهای تردد ثبت‌شده امروز", value: 4400, unit: "رخداد", icon: "⚡", color: "from-amber-600/20 to-amber-500/5", border: "border-amber-500/30", text: "text-amber-400" },
  ];

  const systemHealth = [
    { name: "سرویس اصلی API (Backend)", status: "HEALTHY", latency: "۱۲ms", uptime: "۹۹.۹۹٪" },
    { name: "پایگاه داده PostgreSQL Primary", status: "HEALTHY", latency: "۲ms", uptime: "۱۰۰٪" },
    { name: "صف Outbox و پیام‌رسان FCM", status: "ACTIVE", latency: "۱۵ms", uptime: "۹۹.۹۵٪" },
    { name: "حافظه موقت و کشینگ Redis", status: "HEALTHY", latency: "۱ms", uptime: "۱۰۰٪" },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <span>پنل راهبری مرکزی پلتفرم (Super Admin)</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
              پلتفرم سراسری
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            پایش کلان وضعیت مدارس، کاربران سراسری، امنیت و شاخص‌های زیرساخت
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          آخرین استعلام سلامت: <span className="font-mono text-slate-200">{lastRefreshed}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className={`bg-gradient-to-b ${kpi.color} bg-slate-900 p-5 rounded-2xl border ${kpi.border} space-y-3 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{kpi.title}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className={`text-2xl font-black ${kpi.text} tracking-tight`}>
              {toPersianDigits(kpi.value)}{" "}
              <span className="text-xs font-normal text-slate-500">{kpi.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* System Infrastructure Health Matrix */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>⚡ وضعیت سلامت زیرساخت و میکروسرویس‌ها</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemHealth.map((s) => (
            <div key={s.name} className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">{s.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  زمان پاسخ: {s.latency} | پایداری: {s.uptime}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                عملیاتی
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
