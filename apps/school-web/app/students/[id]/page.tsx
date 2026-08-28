"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toPersianDigits } from "../../../utils/i18n";

export default function StudentDetailPage() {
  const params = useParams();
  const id = params?.id as string || "std-1";
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Student mock data
  const student = {
    id,
    fullName: id === "std-3" ? "پارسا حسینی" : "امیرعلی محمدی",
    nationalCode: "۰۰۱۲۳۴۵۶۷۸",
    grade: "پایه سوم دبستان",
    routeName: "مسیر ۱ - ونک به سعادت‌آباد",
    busDriver: "علی رضایی (۰۹۱۲۱۱۱۲۲۳۳)",
    status: "PICKED_UP",
    stationName: "ایستگاه میدان ونک - پلاک ۲۴",
    parents: id === "std-3" ? [
      { id: "par-2", fullName: "رضا حسینی", phone: "۰۹۱۲۹۸۷۶۵۴۳", relationship: "پدر", email: "reza.hosseini@mehr.serviceyar.ir" },
      { id: "par-3", fullName: "زهرا کاظمی", phone: "۰۹۳۵۱۱۱۲۲۳۳", relationship: "مادر", email: "zahra.kazemi@mehr.serviceyar.ir" }
    ] : [
      { id: "par-1", fullName: "فاطمه محمدی", phone: "۰۹۱۲۳۴۵۶۷۸۹", relationship: "مادر", email: "fatemeh.mohammadi@mehr.serviceyar.ir" }
    ]
  };

  const handleBroadcastMessage = () => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button & title */}
      <div className="flex justify-between items-center bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/students"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>← بازگشت به فهرست</span>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>👨‍🎓 پرونده تحصیلی و ارتباطات: {student.fullName}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">شناسه سیستمی: {student.id}</p>
          </div>
        </div>

        <button
          onClick={handleBroadcastMessage}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
        >
          <span>📢 ارسال پیام به همه والدین ({toPersianDigits(student.parents.length)})</span>
        </button>
      </div>

      {broadcastSent && (
        <div className="bg-emerald-950/70 border border-emerald-500/50 p-4 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
          <span>✓ پیام اطلاع‌رسانی از طریق سامانه نوتیفیکیشن و پیامک به تمامی اولیای دانش‌آموز با موفقیت ارسال گردید.</span>
        </div>
      )}

      {/* Student Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <span>📋 مشخصات دانش‌آموز</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">کد ملی:</span>
              <span className="text-white font-mono text-sm font-bold">{toPersianDigits(student.nationalCode)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">پایه تحصیلی:</span>
              <span className="text-emerald-400 font-bold">{student.grade}</span>
            </div>
            <div>
              <span className="text-slate-400 block">مسیر سرویس:</span>
              <span className="text-white">{student.routeName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">راننده سرویس:</span>
              <span className="text-slate-300">{student.busDriver}</span>
            </div>
            <div>
              <span className="text-slate-400 block">وضعیت لحظه‌ای سرویس:</span>
              <span className="inline-block mt-1 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-bold">
                ● سوار سرویس شده (در مسیر مدرسه)
              </span>
            </div>
          </div>
        </div>

        {/* Parents Relationship Cards */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>👨‍👩‍👧 اولیا و سرپرستان قانونی مرتبط ({toPersianDigits(student.parents.length)})</span>
            </h2>
            <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
              ایزولاسیون Zero-Trust فعال
            </span>
          </div>

          <div className="space-y-3">
            {student.parents.map((p) => (
              <div
                key={p.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold text-sm">{p.fullName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {p.relationship}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-4">
                    <span>تلفن: <strong className="text-slate-200 font-mono">{toPersianDigits(p.phone)}</strong></span>
                    <span>ایمیل: <span className="text-slate-400 font-mono">{p.email}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${p.phone}`}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1"
                  >
                    <span>📞 تماس تلفنی</span>
                  </a>
                  <a
                    href={`sms:${p.phone}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
                  >
                    💬 پیامک
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
