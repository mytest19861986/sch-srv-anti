"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
        { label: "نمای کلی پلتفرم", href: "/", icon: "🌐" },
      ],
    },
    {
      title: "مدیریت",
      items: [
        { label: "مدارس و شعب", href: "/tenants", icon: "🏢" },
        { label: "کاربران سراسری", href: "/users", icon: "👥" },
        { label: "نقش‌ها و دسترسی‌ها", href: "/roles", icon: "🔑" },
      ],
    },
    {
      title: "حسابرسی و تنظیمات",
      items: [
        { label: "لاگ حسابرسی کل", href: "/audit-logs", icon: "🛡️" },
        { label: "تنظیمات پلتفرم", href: "/settings", icon: "⚙️" },
      ],
    },
    {
      title: "گزارش‌ها و شاخص‌ها",
      items: [
        { label: "شاخص‌های پلتفرم", href: "/reports/overview", icon: "📊" },
        { label: "آمار رشد و ناوگان", href: "/reports/growth", icon: "📈" },
      ],
    },
    {
      title: "سامانه‌ها",
      items: [
        { label: "پنل مدرسه دمو", href: "http://localhost:3001", icon: "🏫", external: true },
        { label: "کنسول بک‌اند API", href: "http://localhost:3000/health/ready", icon: "⚡", external: true },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-l border-slate-800 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md z-30 select-none" dir="rtl">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl shadow-inner">
            🛡️
          </div>
          <div>
            <div className="font-extrabold text-sm text-white tracking-tight">راهبری کل پلتفرم</div>
            <div className="text-[11px] text-purple-400 font-medium">Super Admin Console</div>
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
                          ? "bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm"
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
            <div className="text-xs font-bold text-purple-300">راهبر کل پلتفرم</div>
            <div className="text-[10px] text-slate-500 font-mono">super-admin@platform.ir</div>
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
