"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ورود ناموفق بود.");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("super-admin@platform.ir");
    setPassword("Demo@1234");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-500 selection:text-white" dir="rtl">
      {/* Background glowing effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-inner">
            🛡️
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            ورود راهبر کل پلتفرم
          </h1>
          <p className="text-xs text-slate-400">
            سامانه مرکزی مدیریت چندمستأجری مدارس و زیرساخت
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              پست الکترونیک راهبر (Super Admin Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="super-admin@platform.ir"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              کلمه عبور (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-left"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] font-bold text-sm text-white transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>در حال اعتبارسنجی امنیتی...</span>
            ) : (
              <span>ورود به پنل مرکزی</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between">
            <div className="space-y-0.5 text-right">
              <div className="text-xs font-bold text-slate-300">
                حساب کاربری دمو (Super Admin)
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                super-admin@platform.ir
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-colors"
            >
              تکمیل خودکار
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
