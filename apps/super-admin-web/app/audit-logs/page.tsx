"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function GlobalAuditLogsPage() {
  const [filterAction, setFilterAction] = useState("ALL");

  const logs = [
    { id: "aud-g1", timestamp: "۱۴۰۵/۰۶/۰۶ ۰۸:۲۰:۱۴", actor: "super-admin@platform.ir", action: "UPDATE_PLATFORM_SETTING", tenant: "مرکزی (System)", details: "تغییر نرخ مجاز Rate Limit به ۱۰۰۰ req/min", status: "SUCCESS" },
    { id: "aud-g2", timestamp: "۱۴۰۵/۰۶/۰۶ ۰۷:۳۵:۰۰", actor: "super-admin@platform.ir", action: "CREATE_TENANT", tenant: "دبستان البرز", details: "ایجاد تننت جدید برای مدرسه البرز کرج", status: "SUCCESS" },
    { id: "aud-g3", timestamp: "۱۴۰۵/۰۶/۰۶ ۰۶:۱۵:۱۲", actor: "school-admin@demo.ir", action: "USER_LOGIN", tenant: "مجتمع مهر آفرین", details: "ورود موفق مدیر مدرسه به پنل وب", status: "SUCCESS" },
    { id: "aud-g4", timestamp: "۱۴۰۵/۰۶/۰۶ ۰۵:۵۰:۰۰", actor: "system", action: "OUTBOX_BATCH_FLUSH", tenant: "مرکزی (System)", details: "ارسال موفق ۴۴۰ رویداد صف خروجی به FCM", status: "SUCCESS" },
  ];

  const filtered = logs.filter(l => filterAction === "ALL" || l.action.includes(filterAction));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🛡️ لاگ‌های حسابرسی و امنیتی پلتفرم (Audit Trail)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">ردیابی غیرقابل تغییر (Immutable) کلیه فعالیت‌ها، تغییرات ساختاری و رویدادهای سیستمی</p>
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white focus:outline-none focus:border-purple-500"
        >
          <option value="ALL">همه عملیات‌ها</option>
          <option value="TENANT">مدیریت مدارس</option>
          <option value="SETTING">تنظیمات</option>
          <option value="LOGIN">ورود کاربران</option>
        </select>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">زمان رخداد</th>
              <th className="p-3.5">کاربر مجری</th>
              <th className="p-3.5">نوع عملیات</th>
              <th className="p-3.5">تننت مربوطه</th>
              <th className="p-3.5">شرح تغییرات</th>
              <th className="p-3.5">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-mono text-slate-400">{l.timestamp}</td>
                <td className="p-3.5 font-bold text-white">{l.actor}</td>
                <td className="p-3.5 font-mono text-purple-400">{l.action}</td>
                <td className="p-3.5 text-slate-300">{l.tenant}</td>
                <td className="p-3.5 text-slate-300">{l.details}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    موفق
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
