"use client";

import React from "react";
import { toPersianDigits } from "../../../utils/i18n";

export default function AuditLogsPage() {
  const auditLogs = [
    { id: "aud-1", action: "CORRECT_STUDENT_STATUS", actor: "school-admin@demo.ir", ip: "۱۹۲.۱۶۸.۱.۴۵", details: "اصلاح دستی وضعیت دانش‌آموز سارا محمدی به پیاده شده در مدرسه", timestamp: "۱۴۰۵/۰۶/۰۶ ۰۸:۱۵:۰۰", status: "SUCCESS" },
    { id: "aud-2", action: "REASSIGN_DRIVER_SHIFT", actor: "school-admin@demo.ir", ip: "۱۹۲.۱۶۸.۱.۴۵", details: "تخصیص خودروی ون هایس شماره ۱ به مسیر ونک به سعادت‌آباد", timestamp: "۱۴۰۵/۰۶/۰۶ ۰۶:۳۰:۰۰", status: "SUCCESS" },
    { id: "aud-3", action: "USER_LOGIN", actor: "school-admin@demo.ir", ip: "۱۹۲.۱۶۸.۱.۴۵", details: "ورود موفق به پنل مدیریت مدرسه مهر آفرین با نقش مدیر مدرسه", timestamp: "۱۴۰۵/۰۶/۰۶ ۰۶:۱۵:۱۲", status: "SUCCESS" },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🛡️ لاگ‌های حسابرسی و امنیت (School Audit Logs)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">ردیابی کلیه تغییرات مدیریتی، تخصیص شیفت‌ها و رویدادهای امنیتی اسکوپ مدرسه</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
          تعداد رخدادها: <span className="text-emerald-400 font-bold">{toPersianDigits(auditLogs.length)} مورد</span>
        </span>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">زمان رخداد</th>
              <th className="p-3.5">کاربر مجری</th>
              <th className="p-3.5">نوع عملیات</th>
              <th className="p-3.5">آدرس IP</th>
              <th className="p-3.5">شرح جزییات تغییرات</th>
              <th className="p-3.5">نتیجه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-mono text-slate-400">{log.timestamp}</td>
                <td className="p-3.5 font-bold text-white">{log.actor}</td>
                <td className="p-3.5 font-mono text-emerald-400">{log.action}</td>
                <td className="p-3.5 font-mono text-slate-400">{log.ip}</td>
                <td className="p-3.5 text-slate-300">{log.details}</td>
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
