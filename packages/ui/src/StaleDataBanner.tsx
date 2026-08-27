import React, { useEffect, useState } from "react";
import { formatTimeAgo } from "@school-platform/i18n";

export interface StaleDataBannerProps {
  isStale: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const StaleDataBanner: React.FC<StaleDataBannerProps> = ({
  isStale,
  lastUpdated,
  onRefresh,
  isLoading = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const calculate = () => {
      const diffMs = Date.now() - new Date(lastUpdated).getTime();
      setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (!isStale && elapsedSeconds < 30) {
    return null;
  }

  return (
    <div
      data-testid="stale-data-banner"
      className="flex items-center justify-between p-3.5 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm animate-pulse"
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-amber-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>
          توجه: داده‌ها ممکن است کاملاً به‌روز نباشند. آخرین به‌روزرسانی:{" "}
          <strong className="font-bold">{formatTimeAgo(elapsedSeconds)}</strong>
        </span>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-colors"
        >
          {isLoading ? "در حال دریافت..." : "به‌روزرسانی اکنون"}
        </button>
      )}
    </div>
  );
};
