"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

export default function StudentsPage() {
  const [search, setSearch] = useState("");

  const students = [
    { id: "std-1", fullName: "امیرعلی رضایی", nationalCode: "۰۰۱۲۳۴۵۶۷۸", grade: "پایه ششم", routeName: "مسیر ۱ - ونک", status: "PICKED_UP", parentName: "علی رضایی", parentPhone: "۰۹۱۲۱۱۱۲۲۳۳" },
    { id: "std-2", fullName: "سارا محمدی", nationalCode: "۰۰۲۳۴۵۶۷۸۹", grade: "پایه چهارم", routeName: "مسیر ۱ - ونک", status: "DROPPED_OFF", parentName: "حسن محمدی", parentPhone: "۰۹۱۲۲۲۲۳۳۴۴" },
    { id: "std-3", fullName: "محمدحسین حسینی", nationalCode: "۰۰۳۴۵۶۷۸۹۰", grade: "پایه پنجم", routeName: "مسیر ۲ - پاسداران", status: "PENDING", parentName: "حسین حسینی", parentPhone: "۰۹۱۲۳۳۳۴۴۵۵" },
    { id: "std-4", fullName: "زهرا کاظمی", nationalCode: "۰۰۴۵۶۷۸۹۰۱", grade: "پایه اول", routeName: "مسیر ۲ - پاسداران", status: "ABSENT", parentName: "مهدی کاظمی", parentPhone: "۰۹۱۲۴۴۴۵۵۶۶" },
    { id: "std-5", fullName: "کیان تهرانی", nationalCode: "۰۰۵۶۷۸۹۰۱۲", grade: "پایه سوم", routeName: "مسیر ۱ - ونک", status: "PICKED_UP", parentName: "محمد تهرانی", parentPhone: "۰۹۱۲۵۵۵۶۶۷۷" },
  ];

  const filtered = students.filter(s => !search || s.fullName.includes(search) || s.nationalCode.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>👨‍🎓 فهرست و وضعیت دانش‌آموزان</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت ثبت‌نام، مسیرهای تخصیص‌یافته و اولیای دانش‌آموزان</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با نام یا کدملی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(145)} نفر</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام و نام خانوادگی</th>
              <th className="p-3.5">کد ملی</th>
              <th className="p-3.5">پایه تحصیلی</th>
              <th className="p-3.5">مسیر سرویس</th>
              <th className="p-3.5">نام ولی</th>
              <th className="p-3.5">تلفن ولی</th>
              <th className="p-3.5">وضعیت امروز</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{s.fullName}</td>
                <td className="p-3.5 font-mono text-slate-400">{s.nationalCode}</td>
                <td className="p-3.5 text-slate-300">{s.grade}</td>
                <td className="p-3.5 text-emerald-400 font-medium">{s.routeName}</td>
                <td className="p-3.5 text-slate-300">{s.parentName}</td>
                <td className="p-3.5 font-mono text-slate-400">{s.parentPhone}</td>
                <td className="p-3.5">
                  {s.status === "PICKED_UP" && <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">سوار شده</span>}
                  {s.status === "DROPPED_OFF" && <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">رسیده به مدرسه</span>}
                  {s.status === "PENDING" && <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">در انتظار</span>}
                  {s.status === "ABSENT" && <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-900/40 font-medium">غایب</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
