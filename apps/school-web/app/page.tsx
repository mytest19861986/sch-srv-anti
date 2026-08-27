"use client";

import React, { useState, useEffect } from "react";
import { toPersianDigits } from "../utils/i18n";
import { StaleDataBanner } from "../components/StaleDataBanner";

interface OverviewData {
  totalStudents: number;
  boardedCount: number;
  droppedOffCount: number;
  absentCount: number;
  inTransitCount: number;
  is_stale: boolean;
  generated_at: string;
}

interface ServiceItem {
  id: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  totalStudents: number;
  pickedUp: number;
  droppedOff: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData>({
    totalStudents: 145,
    boardedCount: 18,
    droppedOffCount: 16,
    absentCount: 0,
    inTransitCount: 2,
    is_stale: false,
    generated_at: new Date().toISOString(),
  });

  const [liveServices, setLiveServices] = useState<ServiceItem[]>([
    {
      id: "srv-101",
      routeName: "مسیر ۱ - ونک به سعادت‌آباد",
      driverName: "علی رضایی",
      driverPhone: "09121112233",
      totalStudents: 18,
      pickedUp: 18,
      droppedOff: 16,
      status: "IN_PROGRESS",
    },
    {
      id: "srv-102",
      routeName: "مسیر ۲ - پاسداران به نیاوران",
      driverName: "حسین حسینی",
      driverPhone: "09123334455",
      totalStudents: 15,
      pickedUp: 15,
      droppedOff: 15,
      status: "COMPLETED",
    },
  ]);

  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString("fa-IR"));
    const interval = setInterval(() => {
      // Simulate real-time heartbeat
      setData((prev) => ({
        ...prev,
        generated_at: new Date().toISOString(),
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setData((prev) => ({
      ...prev,
      is_stale: false,
      generated_at: new Date().toISOString(),
    }));
    setLastRefreshed(new Date().toLocaleTimeString("fa-IR"));
  };

  const entityKPIs = [
    { title: "دانش‌آموزان", count: 145, icon: "👨‍🎓", color: "from-blue-600/20 to-blue-500/5", border: "border-blue-500/30", text: "text-blue-400" },
    { title: "اولیا و سرپرستان", count: 130, icon: "👨‍👩‍👧", color: "from-purple-600/20 to-purple-500/5", border: "border-purple-500/30", text: "text-purple-400" },
    { title: "رانندگان مجاز", count: 8, icon: "🚐", color: "from-emerald-600/20 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400" },
    { title: "ناوگان خودروها", count: 8, icon: "🚗", color: "from-amber-600/20 to-amber-500/5", border: "border-amber-500/30", text: "text-amber-400" },
    { title: "سرویس‌های فعال", count: 8, icon: "🚌", color: "from-indigo-600/20 to-indigo-500/5", border: "border-indigo-500/30", text: "text-indigo-400" },
  ];

  // Hourly distribution (05:00 - 21:00)
  const hourlyData = [
    { hour: "۰۶:۰۰", count: 15, pct: 15 },
    { hour: "۰۷:۰۰", count: 120, pct: 90 },
    { hour: "۰۸:۰۰", count: 45, pct: 35 },
    { hour: "۰۹:۰۰", count: 0, pct: 0 },
    { hour: "۱۲:۰۰", count: 20, pct: 18 },
    { hour: "۱۳:۰۰", count: 95, pct: 75 },
    { hour: "۱۴:۰۰", count: 110, pct: 85 },
    { hour: "۱۵:۰۰", count: 30, pct: 25 },
    { hour: "۱۶:۰۰", count: 5, pct: 5 },
  ];

  const totalActiveStudents = 18;
  const pickedPct = Math.round((data.boardedCount / totalActiveStudents) * 100);
  const droppedPct = Math.round((data.droppedOffCount / totalActiveStudents) * 100);
  const inTransitPct = Math.round((data.inTransitCount / totalActiveStudents) * 100);
  const absentPct = Math.round((data.absentCount / totalActiveStudents) * 100);

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Stale Banner */}
      <StaleDataBanner
        isStale={data.is_stale}
        generatedAt={data.generated_at}
        onRefresh={handleRefresh}
      />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <span>داشبورد جامع مانیتورینگ سرویس</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              زنده و برخط
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            پایش لحظه‌ای سوار و پیاده شدن دانش‌آموزان، وضعیت رانندگان و ناوگان مدرسه
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            بروزرسانی: <span className="font-mono text-slate-200">{lastRefreshed}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
          >
            <span>تازه‌سازی داده‌ها</span>
            <span>🔄</span>
          </button>
        </div>
      </div>

      {/* 1. Entity Count KPI Row (5 Icon Cards) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {entityKPIs.map((kpi) => (
          <div
            key={kpi.title}
            className={`bg-gradient-to-b ${kpi.color} bg-slate-900 p-4 rounded-2xl border ${kpi.border} shadow-sm space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{kpi.title}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className={`text-2xl font-black ${kpi.text} tracking-tight`}>
              {toPersianDigits(kpi.count)}
            </div>
          </div>
        ))}
      </section>

      {/* 2. Today Status Panel with Segmented Progress Bar & Legend */}
      <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>وضعیت تردد امروز</span>
              <span className="text-xs text-slate-500 font-normal">(شیفت رفت صبح)</span>
            </h2>
            <p className="text-xs text-slate-400">پیشرفت سوار و پیاده شدن دانش‌آموزان در مسیرهای فعال</p>
          </div>
          <div className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            کل دانش‌آموزان شیفت: <span className="text-emerald-400 font-bold">{toPersianDigits(totalActiveStudents)} نفر</span>
          </div>
        </div>

        {/* 4 Status Counters ("X of Y") */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-blue-900/30">
            <div className="text-xs text-blue-400 font-medium">سوار شده</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {toPersianDigits(data.boardedCount)} <span className="text-xs text-slate-500 font-normal">از {toPersianDigits(totalActiveStudents)} ({toPersianDigits(pickedPct)}٪)</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-900/30">
            <div className="text-xs text-amber-400 font-medium">در حال تردد</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {toPersianDigits(data.inTransitCount)} <span className="text-xs text-slate-500 font-normal">از {toPersianDigits(totalActiveStudents)} ({toPersianDigits(inTransitPct)}٪)</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-emerald-900/30">
            <div className="text-xs text-emerald-400 font-medium">پیاده شده (رسیده)</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {toPersianDigits(data.droppedOffCount)} <span className="text-xs text-slate-500 font-normal">از {toPersianDigits(totalActiveStudents)} ({toPersianDigits(droppedPct)}٪)</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-red-900/30">
            <div className="text-xs text-red-400 font-medium">غایب / لغو شده</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {toPersianDigits(data.absentCount)} <span className="text-xs text-slate-500 font-normal">از {toPersianDigits(totalActiveStudents)} ({toPersianDigits(absentPct)}٪)</span>
            </div>
          </div>
        </div>

        {/* ONE Segmented Horizontal Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 p-0.5">
            <div
              style={{ width: `${droppedPct}%` }}
              className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
              title={`پیاده شده: ${droppedPct}%`}
            />
            <div
              style={{ width: `${inTransitPct}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`در حال تردد: ${inTransitPct}%`}
            />
            <div
              style={{ width: `${absentPct}%` }}
              className="bg-red-500 h-full rounded-l-full transition-all duration-500"
              title={`غایب: ${absentPct}%`}
            />
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                پیاده شده در مدرسه ({toPersianDigits(droppedPct)}٪)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                در حال تردد در خودرو ({toPersianDigits(inTransitPct)}٪)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                غایب ({toPersianDigits(absentPct)}٪)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              تکمیل شیفت: {toPersianDigits(droppedPct)}٪
            </div>
          </div>
        </div>
      </section>

      {/* 3. Lightweight SVG Hourly Distribution Chart (05:00 - 21:00) */}
      <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📊 نمودار توزیع رویدادهای تردد بر اساس ساعت</span>
            </h2>
            <p className="text-xs text-slate-400">حجم سوار و پیاده شدن دانش‌آموزان از ساعت ۰۵:۰۰ الی ۲۱:۰۰</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">امروز</span>
        </div>

        {/* SVG Chart */}
        <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-4 bg-slate-950/70 rounded-xl border border-slate-800/80">
          {hourlyData.map((item) => (
            <div key={item.hour} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {toPersianDigits(item.count)}
              </div>
              <div
                style={{ height: `${Math.max(item.pct, 4)}%` }}
                className={`w-full max-w-[32px] rounded-t-lg transition-all duration-500 ${
                  item.count > 50
                    ? "bg-emerald-500 shadow-md shadow-emerald-900/30"
                    : item.count > 0
                    ? "bg-emerald-600/70"
                    : "bg-slate-800/40"
                }`}
              />
              <div className="text-[10px] font-mono text-slate-400 mt-1 whitespace-nowrap">
                {item.hour}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Live Services Table */}
      <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🚌 سرویس‌های فعال امروز</span>
          </h2>
          <span className="text-xs text-slate-400">
            نمایش {toPersianDigits(liveServices.length)} سرویس
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 rounded-r-xl">مسیر سرویس</th>
                <th className="p-3.5">راننده</th>
                <th className="p-3.5">تلفن تماس</th>
                <th className="p-3.5">ظرفیت</th>
                <th className="p-3.5">سوار / پیاده</th>
                <th className="p-3.5 rounded-l-xl">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {liveServices.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-200">{srv.routeName}</td>
                  <td className="p-3.5 text-slate-300">{srv.driverName}</td>
                  <td className="p-3.5 font-mono text-slate-400">{srv.driverPhone}</td>
                  <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(srv.totalStudents)} نفر</td>
                  <td className="p-3.5 font-mono text-emerald-400">
                    {toPersianDigits(srv.pickedUp)} / {toPersianDigits(srv.droppedOff)}
                  </td>
                  <td className="p-3.5">
                    {srv.status === "IN_PROGRESS" ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        در حال تردد
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        تکمیل شده
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
