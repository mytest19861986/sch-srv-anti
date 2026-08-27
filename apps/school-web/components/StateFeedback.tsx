"use client";

import React from "react";

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-800/60 rounded-xl w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "موردی یافت نشد",
  description = "هیچ رکوردی برای نمایش وجود ندارد.",
  actionText,
  onAction,
  icon = "📂"
}: {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 my-4">
      <span className="text-4xl">{icon}</span>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-900/30"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export function ErrorBanner({
  message = "خطایی در برقراری ارتباط رخ داده است.",
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-center justify-between text-xs text-red-300">
      <div className="flex items-center gap-2">
        <span className="text-base">⚠️</span>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white font-bold rounded-lg transition-colors"
        >
          تلاش مجدد 🔄
        </button>
      )}
    </div>
  );
}
