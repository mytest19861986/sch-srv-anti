"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toPersianDigits } from "../../../utils/i18n";

export default function ParentDetailPage() {
  const params = useParams();
  const id = params?.id as string || "par-1";
  const [resetPassBanner, setResetPassBanner] = useState<string | null>(null);

  const parent = {
    id,
    fullName: id === "par-2" ? "رضا حسینی" : "فاطمه محمدی",
    phone: id === "par-2" ? "۰۹۱۲۹۸۷۶۵۴۳" : "۰۹۱۲۳۴۵۶۷۸۹",
    email: id === "par-2" ? "reza.hosseini@mehr.serviceyar.ir" : "fatemeh.mohammadi@mehr.serviceyar.ir",
    relationship: id === "par-2" ? "پدر" : "مادر",
    status: "ACTIVE",
    children: id === "par-2" ? [
      { id: "std-3", fullName: "پارسا حسینی", grade: "پایه پنجم", routeName: "مسیر ۲ - پاسداران", status: "PICKED_UP", driver: "حسین حسینی (۰۹۱۲۳۳۳۴۴۵۵)" }
    ] : [
      { id: "std-1", fullName: "امیرعلی محمدی", grade: "پایه سوم", routeName: "مسیر ۱ - ونک", status: "PICKED_UP", driver: "علی رضایی (۰۹۱۲۱۱۱۲۲۳۳)" },
      { id: "std-2", fullName: "سارا محمدی", grade: "پایه اول", routeName: "مسیر ۱ - ونک", status: "DROPPED_OFF", driver: "علی رضایی (۰۹۱۲۱۱۱۲۲۳۳)" }
    ]
  };

  const handleResetPassword = () => {
    const newPass = `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
    setResetPassBanner(newPass);
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Back button & title */}
      <div className="flex justify-between items-center bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/parents"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>← بازگشت به فهرست اولیا</span>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>👨‍👩‍👧 پرونده سرپرست: {parent.fullName} ({parent.relationship})</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">شناسه سیستمی: {parent.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${parent.phone}`}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
          >
            <span>📞 تماس با ولی</span>
          </a>
          <button
            onClick={handleResetPassword}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            🔑 صدور مجدد رمز موقت
          </button>
        </div>
      </div>

      {resetPassBanner && (
        <div className="bg-emerald-950/70 border border-emerald-500/50 p-4 rounded-2xl text-xs flex items-center justify-between gap-4 animate-fade-in shadow-lg">
          <div>
            <span className="text-emerald-300 font-bold block">✓ رمز عبور موقت جدید با موفقیت صادر گردید:</span>
            <span className="text-white mt-1 block">
              رمز موقت جدید: <strong className="font-mono text-emerald-300 bg-black/60 px-2 py-0.5 rounded">{resetPassBanner}</strong> (از طریق پیامک برای ولی ارسال شد)
            </span>
          </div>
          <button
            onClick={() => setResetPassBanner(null)}
            className="px-3 py-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs"
          >
            بستن
          </button>
        </div>
      )}

      {/* Parent Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Parent Profile */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <span>👤 مشخصات سرپرست</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">نام کامل:</span>
              <span className="text-white font-bold text-sm">{parent.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">نسبت قانونی:</span>
              <span className="text-emerald-400 font-bold">{parent.relationship}</span>
            </div>
            <div>
              <span className="text-slate-400 block">شماره همراه (شناسه):</span>
              <span className="text-white font-mono">{toPersianDigits(parent.phone)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">ایمیل سازمانی:</span>
              <span className="text-slate-300 font-mono text-[11px]">{parent.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">وضعیت حساب:</span>
              <span className="inline-block mt-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold">
                ● حساب فعال اپلیکیشن
              </span>
            </div>
          </div>
        </div>

        {/* Children Status Section */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🎒 وضعیت لحظه‌ای فرزندان ({toPersianDigits(parent.children.length)} دانش‌آموز)</span>
            </h2>
            <Link
              href="/students"
              className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-lg"
            >
              مشاهده وضعیت همه فرزندان →
            </Link>
          </div>

          <div className="space-y-3">
            {parent.children.map((child) => (
              <div
                key={child.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold text-sm">{child.fullName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {child.grade}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-4">
                    <span>مسیر: <strong className="text-slate-200">{child.routeName}</strong></span>
                    <span>راننده: <span className="text-slate-300">{child.driver}</span></span>
                  </div>
                </div>

                <div>
                  {child.status === "PICKED_UP" && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                      <span>سوار سرویس شده</span>
                    </span>
                  )}
                  {child.status === "DROPPED_OFF" && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>رسیده به مدرسه</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
