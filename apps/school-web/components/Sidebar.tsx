"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRANDING } from "../config/branding";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  };

  const navGroups = [
    {
      title: "اصلی",
      items: [
        { label: "نمای کلی", href: "/", icon: "📊" },
      ],
    },
    {
      title: "موجودیت‌ها",
      items: [
        { label: "دانش‌آموزان", href: "/students", icon: "👨‍🎓" },
        { label: "اولیا و سرپرستان", href: "/parents", icon: "👨‍👩‍👧" },
        { label: "رانندگان", href: "/drivers", icon: "🚐" },
        { label: "ناوگان خودروها", href: "/vehicles", icon: "🚗" },
        { label: "مسیرهای سرویس", href: "/routes", icon: "🗺️" },
        { label: "سرویس‌های امروز", href: "/services", icon: "🚌" },
      ],
    },
    {
      title: "گزارش‌ها و لاگ‌ها",
      items: [
        { label: "گزارش رویدادها", href: "/reports/events", icon: "📋" },
        { label: "لاگ حسابرسی", href: "/reports/audit-logs", icon: "🛡️" },
        { label: "تاریخچه اعلان‌ها", href: "/reports/notifications", icon: "🔔" },
      ],
    },
    {
      title: "اپ‌های متصل",
      items: [
        { label: "کنسول راننده", href: "http://localhost:3000/driver", icon: "📱", external: true },
        { label: "پورتال والدین", href: "http://localhost:3000/parent", icon: "👨‍👩‍👦", external: true },
        { label: "مدیریت پلتفرم", href: "http://localhost:3002", icon: "🏢", external: true },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-l border-slate-800 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md z-30 select-none" dir="rtl">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl shadow-inner">
            🚌
          </div>
          <div>
            <div className="font-extrabold text-sm text-white tracking-tight">{BRANDING.productName}</div>
            <div className="text-[11px] text-blue-400 font-medium">{BRANDING.schoolPanelName}</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-5 text-sm">
          {navGroups.map((grp) => (
            <div key={grp.title} className="space-y-1.5">
              <div className="px-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {grp.title}
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.external && (
                        <span className="text-[10px] text-slate-600">↗</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-200">مدیر مدرسه</div>
            <div className="text-[10px] text-slate-500 font-mono">school-admin@demo.ir</div>
          </div>
          <button
            onClick={handleLogout}
            title="خروج از حساب کاربری"
            className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/40 text-xs transition-colors"
          >
            خروج
          </button>
        </div>
      </div>
    </aside>
  );
}
