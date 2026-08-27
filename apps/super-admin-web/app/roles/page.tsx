"use client";

import React from "react";

export default function RolesPage() {
  const roles = [
    { role: "SUPER_ADMIN", title: "راهبر ارشد کل پلتفرم", scope: "سراسری (System)", permissions: "مدیریت تننت‌ها، انتساب نقش‌ها، لاگ‌های امنیتی، تنظیمات پلتفرم", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
    { role: "SCHOOL_ADMIN", title: "مدیر ارشد واحد آموزشی", scope: "مدرسه (Tenant)", permissions: "مدیریت دانش‌آموزان، اولیا، رانندگان، مسیرها، سرویس‌ها و گزارش‌های مدرسه", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
    { role: "SCHOOL_OPERATOR", title: "اپراتور مانیتورینگ مدرسه", scope: "مدرسه (Tenant)", permissions: "مشاهده زنده تردد، ثبت رخدادهای دستی، اطلاع‌رسانی به والدین", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { role: "DRIVER", title: "راننده و متصدی خودرو", scope: "شیفت / خودرو", permissions: "دریافت مانیفست مسافران، ثبت سوار/پیاده شدن، ارسال موقعیت زنده", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { role: "PARENT", title: "ولی و سرپرست دانش‌آموز", scope: "فرزندان مستقیم", permissions: "مشاهده زنده موقعیت سرویس فرزند، دریافت نوتیفیکیشن‌ها، تاریخچه تردد", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🔑 ماتریس نقش‌ها و سطوح دسترسی (RBAC Matrix)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">تعریف سطوح مجوزها، اسکوپ‌های امنیتی و تفکیک وظایف Zero-Trust</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.role} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${r.color}`}>
                {r.role}
              </span>
              <span className="text-xs text-slate-400">اسکوپ: <strong className="text-white">{r.scope}</strong></span>
            </div>
            <h3 className="text-sm font-bold text-white">{r.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{r.permissions}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
