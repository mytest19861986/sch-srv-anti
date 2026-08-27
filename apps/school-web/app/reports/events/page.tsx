"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../../utils/i18n";

export default function EventsReportPage() {
  const [date, setDate] = useState("۱۴۰۵/۰۶/۰۶");

  const events = [
    { id: "evt-1", studentName: "امیرعلی رضایی", nationalCode: "۰۰۱۲۳۴۵۶۷۸", eventType: "BOARDED", time: "۰۷:۱۵:۲۲", route: "مسیر ۱ - ونک", driver: "علی رضایی", location: "ایستگاه میدان ونک", status: "VERIFIED" },
    { id: "evt-2", studentName: "کیان تهرانی", nationalCode: "۰۰۵۶۷۸۹۰۱۲", eventType: "BOARDED", time: "۰۷:۲۰:۰۵", route: "مسیر ۱ - ونک", driver: "علی رضایی", location: "ایستگاه ملاصدرا", status: "VERIFIED" },
    { id: "evt-3", studentName: "سارا محمدی", nationalCode: "۰۰۲۳۴۵۶۷۸۹", eventType: "BOARDED", time: "۰۷:۲۵:۴۰", route: "مسیر ۱ - ونک", driver: "علی رضایی", location: "ایستگاه شیخ بهایی", status: "VERIFIED" },
    { id: "evt-4", studentName: "امیرعلی رضایی", nationalCode: "۰۰۱۲۳۴۵۶۷۸", eventType: "DROPPED_OFF", time: "۰۷:۴۲:۱۰", route: "مسیر ۱ - ونک", driver: "علی رضایی", location: "درب اصلی مجتمع آموزشی", status: "VERIFIED" },
    { id: "evt-5", studentName: "سارا محمدی", nationalCode: "۰۰۲۳۴۵۶۷۸۹", eventType: "DROPPED_OFF", time: "۰۷:۴۵:۰۰", route: "مسیر ۱ - ونک", driver: "علی رضایی", location: "درب اصلی مجتمع آموزشی", status: "VERIFIED" },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>📋 گزارش جامع رویدادهای تردد (Events Log)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">لاگ ثانیه‌ای و تفصیلی کلیه رخدادهای سوار/پیاده شدن با ثبت موقعیت و زمان</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            تاریخ گزارش: <span className="text-white font-mono">{date}</span>
          </span>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع رویدادها: <span className="text-emerald-400 font-bold">{toPersianDigits(440)} رخداد</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">زمان ثبت</th>
              <th className="p-3.5">نام دانش‌آموز</th>
              <th className="p-3.5">کد ملی</th>
              <th className="p-3.5">نوع رویداد</th>
              <th className="p-3.5">مسیر سرویس</th>
              <th className="p-3.5">راننده متصدی</th>
              <th className="p-3.5">محل ثبت رویداد</th>
              <th className="p-3.5">وضعیت اعتبارسنجی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-mono text-slate-400">{e.time}</td>
                <td className="p-3.5 font-bold text-white">{e.studentName}</td>
                <td className="p-3.5 font-mono text-slate-400">{e.nationalCode}</td>
                <td className="p-3.5">
                  {e.eventType === "BOARDED" ? (
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      سوار شد
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      پیاده شد
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-slate-300">{e.route}</td>
                <td className="p-3.5 text-slate-200">{e.driver}</td>
                <td className="p-3.5 text-slate-400">{e.location}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    تایید سیستمی
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
