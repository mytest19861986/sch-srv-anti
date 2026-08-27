"use client";

import React from "react";
import { toPersianDigits } from "../../../utils/i18n";

export default function NotificationsReportPage() {
  const notifications = [
    { id: "notif-1", recipient: "محمد تهرانی (ولی کیان)", phone: "۰۹۱۲۵۵۵۶۶۷۷", channel: "SMS + PUSH", title: "سوار شدن دانش‌آموز", message: "فرزند شما کیان تهرانی در ساعت ۰۷:۲۰ در ایستگاه ملاصدرا سوار سرویس شد.", time: "۱۴۰۵/۰۶/۰۶ ۰۷:۲۰:۰۶", status: "DELIVERED" },
    { id: "notif-2", recipient: "حسن محمدی (ولی سارا)", phone: "۰۹۱۲۲۲۲۳۳۴۴", channel: "PUSH", title: "رسیدن به مدرسه", message: "فرزند شما سارا محمدی در ساعت ۰۷:۴۵ با موفقیت در مدرسه پیاده شد.", time: "۱۴۰۵/۰۶/۰۶ ۰۷:۴۵:۰۲", status: "DELIVERED" },
    { id: "notif-3", recipient: "علی رضایی (ولی امیرعلی)", phone: "۰۹۱۲۱۱۱۲۲۳۳", channel: "SMS + PUSH", title: "رسیدن به مدرسه", message: "فرزند شما امیرعلی رضایی در ساعت ۰۷:۴۲ در مدرسه پیاده شد.", time: "۱۴۰۵/۰۶/۰۶ ۰۷:۴۲:۱۵", status: "DELIVERED" },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🔔 تاریخچه پیامک‌ها و اعلان‌های ارسالی (Notification Logs)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مانیتورینگ وضعیت تحویل پیامک‌ها و اعلان‌های Push به والدین دانش‌آموزان</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
          اعلان‌های امروز: <span className="text-emerald-400 font-bold">{toPersianDigits(notifications.length)} ارسال</span>
        </span>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">زمان ارسال</th>
              <th className="p-3.5">گیرنده پیام</th>
              <th className="p-3.5">شماره همراه</th>
              <th className="p-3.5">کانال ارسال</th>
              <th className="p-3.5">عنوان اعلان</th>
              <th className="p-3.5">متن پیام ارسالی</th>
              <th className="p-3.5">وضعیت تحویل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {notifications.map((n) => (
              <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-mono text-slate-400">{n.time}</td>
                <td className="p-3.5 font-bold text-white">{n.recipient}</td>
                <td className="p-3.5 font-mono text-slate-400">{n.phone}</td>
                <td className="p-3.5 font-mono text-blue-400">{n.channel}</td>
                <td className="p-3.5 text-slate-200">{n.title}</td>
                <td className="p-3.5 text-slate-300 max-w-xs truncate">{n.message}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    تحویل شده
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
