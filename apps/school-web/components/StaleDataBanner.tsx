"use client";

import React from "react";
import { toPersianDigits } from "../utils/i18n";

interface Props {
  isStale: boolean;
  generatedAt: string;
  onRefresh: () => void;
}

export function StaleDataBanner({ isStale, generatedAt, onRefresh }: Props) {
  if (!isStale) return null;

  const timeStr = new Date(generatedAt).toLocaleTimeString("fa-IR");

  return (
    <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-950/40 backdrop-blur-sm animate-pulse">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h4 className="text-sm font-bold text-amber-300">
            داده‌های نمایش داده شده ممکن است بروز نباشند (بیش از ۳۰ ثانیه تاخیر)
          </h4>
          <p className="text-xs text-amber-400/80 mt-0.5">
            آخرین همگام‌سازی موفق در ساعت: <span className="font-mono font-bold text-amber-200">{timeStr}</span>
          </p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
      >
        <span>تلاش مجدد</span>
        <span>🔄</span>
      </button>
    </div>
  );
}
