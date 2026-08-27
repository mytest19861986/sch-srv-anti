import React from "react";
import { toPersianDigits } from "@school-platform/i18n";

export interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "info" | "danger";
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  variant = "default",
  icon,
}) => {
  const colorMap = {
    default: "border-slate-800 bg-slate-900/60 text-slate-100",
    success: "border-emerald-500/30 bg-emerald-950/20 text-emerald-300",
    info: "border-blue-500/30 bg-blue-950/20 text-blue-300",
    warning: "border-amber-500/30 bg-amber-950/20 text-amber-300",
    danger: "border-red-500/30 bg-red-950/20 text-red-300",
  };

  return (
    <div
      dir="rtl"
      className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between ${colorMap[variant]} shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {icon && <div className="p-2 rounded-xl bg-slate-800/50">{icon}</div>}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-extrabold tracking-tight">
          {typeof value === "number" ? toPersianDigits(value) : value}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};
