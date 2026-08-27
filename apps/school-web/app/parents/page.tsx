"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function ParentsPage() {
  const [search, setSearch] = useState("");

  const parents = [
    { id: "par-1", fullName: "محمد تهرانی", phone: "۰۹۱۲۵۵۵۶۶۷۷", email: "parent@demo.ir", childrenCount: 1, childrenNames: "کیان تهرانی", status: "ACTIVE" },
    { id: "par-2", fullName: "علی رضایی", phone: "۰۹۱۲۱۱۱۲۲۳۳", email: "parent.rezaei@demo.ir", childrenCount: 1, childrenNames: "امیرعلی رضایی", status: "ACTIVE" },
    { id: "par-3", fullName: "حسن محمدی", phone: "۰۹۱۲۲۲۲۳۳۴۴", email: "parent.mohammadi@demo.ir", childrenCount: 2, childrenNames: "سارا محمدی، سینا محمدی", status: "ACTIVE" },
    { id: "par-4", fullName: "مهدی کاظمی", phone: "۰۹۱۲۴۴۴۵۵۶۶", email: "parent.kazemi@demo.ir", childrenCount: 1, childrenNames: "زهرا کاظمی", status: "ACTIVE" },
  ];

  const filtered = parents.filter(p => !search || p.fullName.includes(search) || p.phone.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>👨‍👩‍👧 اولیا و سرپرستان دانش‌آموزان</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت حساب‌های کاربری والدین، شماره‌های تماس و فرزندان منتسب</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با نام یا تلفن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(130)} سرپرست</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام سرپرست</th>
              <th className="p-3.5">شماره همراه</th>
              <th className="p-3.5">ایمیل</th>
              <th className="p-3.5">تعداد فرزندان</th>
              <th className="p-3.5">اسامی فرزندان</th>
              <th className="p-3.5">وضعیت حساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{p.fullName}</td>
                <td className="p-3.5 font-mono text-slate-400">{p.phone}</td>
                <td className="p-3.5 font-mono text-slate-400">{p.email}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(p.childrenCount)} فرزند</td>
                <td className="p-3.5 text-emerald-400 font-medium">{p.childrenNames}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    فعال
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
