import React from "react";

export interface StatusBadgeProps {
  status: "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED" | "PICKED_UP" | "DROPPED_OFF" | "ABSENT" | "ACTIVE" | "INACTIVE";
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const map = {
    IN_PROGRESS: { text: "در حال حرکت", class: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    COMPLETED: { text: "پایان سرویس", class: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    NOT_STARTED: { text: "شروع نشده", class: "bg-slate-700/30 text-slate-400 border-slate-700" },
    PICKED_UP: { text: "سوار شد", class: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    DROPPED_OFF: { text: "پیاده شد", class: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    ABSENT: { text: "غایب", class: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    ACTIVE: { text: "فعال", class: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    INACTIVE: { text: "غیرفعال (آرشیو)", class: "bg-red-500/15 text-red-300 border-red-500/30" },
  };

  const current = map[status] || { text: status, class: "bg-slate-800 text-slate-300 border-slate-700" };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${current.class}`}
      dir="rtl"
    >
      {label || current.text}
    </span>
  );
};
