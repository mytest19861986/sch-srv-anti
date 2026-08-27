import React from "react";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";

export const metadata = {
  title: "پنل راهبری مرکزی پلتفرم (Super Admin)",
  description: "مدیریت سراسری مدارس، کاربران، و لاگ‌های امنیتی پلتفرم حمل و نقل هوشمند دانش‌آموزی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-purple-500 selection:text-white flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
