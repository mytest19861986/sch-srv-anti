"use client";

import React, { useEffect, useState } from "react";
import { StaleDataBanner, KpiCard, StatusBadge } from "@school-platform/ui";
import { fa, toPersianDigits } from "@school-platform/i18n";
import { DashboardOverviewSummary, LiveServiceItem } from "@school-platform/api-client";

export default function SchoolDashboardPage() {
  const [summary, setSummary] = useState<DashboardOverviewSummary>({
    date: "2026-08-27",
    total_students: 145,
    picked_up_count: 110,
    dropped_off_count: 95,
    pending_count: 30,
    absent_count: 5,
    is_stale: false,
    last_updated: new Date().toISOString(),
  });

  const [services, setServices] = useState<LiveServiceItem[]>([
    {
      service_id: "srv-101",
      route_name: "مسیر ۱ - ونک به سعادت‌آباد",
      driver_name: "علی رضایی",
      driver_phone: "09121112233",
      total_students: 18,
      picked_up_count: 18,
      dropped_off_count: 16,
      status: "IN_PROGRESS",
    },
    {
      service_id: "srv-102",
      route_name: "مسیر ۲ - پاسداران به نیاوران",
      driver_name: "حسین حسینی",
      driver_phone: "09123334455",
      total_students: 15,
      picked_up_count: 15,
      dropped_off_count: 15,
      status: "COMPLETED",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setSummary((prev) => ({
        ...prev,
        is_stale: false,
        last_updated: new Date().toISOString(),
      }));
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {fa.common.schoolDashboardTitle}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            دبستان و دبیرستان مهر آفرین • سال تحصیلی ۱۴۰۵-۱۴۰۴
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
        >
          <span>{fa.common.refresh}</span>
        </button>
      </header>

      {/* Freshness Banner */}
      <StaleDataBanner
        isStale={summary.is_stale}
        lastUpdated={summary.last_updated}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title={fa.dashboard.totalStudents}
          value={summary.total_students}
          subtitle="تخصیص‌یافته به سرویس‌ها"
        />
        <KpiCard
          title={fa.dashboard.pickedUp}
          value={summary.picked_up_count}
          variant="info"
          subtitle="در حال سفر"
        />
        <KpiCard
          title={fa.dashboard.droppedOff}
          value={summary.dropped_off_count}
          variant="success"
          subtitle="رسیده به مقصد"
        />
        <KpiCard
          title={fa.dashboard.pending}
          value={summary.pending_count}
          subtitle="در انتظار سوار شدن"
        />
        <KpiCard
          title={fa.dashboard.absent}
          value={summary.absent_count}
          variant="warning"
          subtitle="عدم حضور تایید شده"
        />
      </div>

      {/* Live Services Table */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {fa.dashboard.liveServices}
          </h2>
          <span className="text-xs text-slate-400">
            {toPersianDigits(services.length)} سرویس در مسیر
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-3 px-4 font-semibold">{fa.dashboard.routeName}</th>
                <th className="pb-3 px-4 font-semibold">{fa.dashboard.driverName}</th>
                <th className="pb-3 px-4 font-semibold">تعداد دانش‌آموز</th>
                <th className="pb-3 px-4 font-semibold">{fa.dashboard.completionRate}</th>
                <th className="pb-3 px-4 font-semibold">{fa.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {services.map((srv) => {
                const percent = Math.round((srv.dropped_off_count / srv.total_students) * 100);
                return (
                  <tr key={srv.service_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-200">{srv.route_name}</td>
                    <td className="py-4 px-4 text-slate-300">
                      <div>{srv.driver_name}</div>
                      <div className="text-xs text-slate-500">{srv.driver_phone}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{toPersianDigits(srv.total_students)} نفر</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{toPersianDigits(percent)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={srv.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
