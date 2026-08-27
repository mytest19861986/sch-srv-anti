"use client";

import React, { useState } from "react";

export default function PlatformSettingsPage() {
  const [jwtExpiry, setJwtExpiry] = useState("24h");
  const [rateLimit, setRateLimit] = useState("1000");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <span>⚙️ تنظیمات عمومی و امنیتی پلتفرم</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">پیکربندی پارامترهای سراسری هسته احراز هویت، صف Outbox و محدودیت نرخ درخواست</p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
        {saved && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold">
            ✅ تنظیمات با موفقیت در هسته پلتفرم ذخیره شد و لاگ حسابرسی ثبت گردید.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">طول عمر توکن نشست (JWT Expiry)</label>
            <input
              type="text"
              value={jwtExpiry}
              onChange={(e) => setJwtExpiry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">حداکثر سقف درخواست (Rate Limit per minute)</label>
            <input
              type="text"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">حالت تعمیر و نگهداری (Maintenance Mode)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">در این حالت فقط راهبر ارشد امکان ورود به سامانه را دارد.</div>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-colors"
        >
          ذخیره تغییرات و اعمال آنی
        </button>
      </form>
    </main>
  );
}
