import React from "react";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";

export const metadata = {
  title: "سرویس یار | پنل مدیریت مدرسه",
  description: "سامانه هوشمند مانیتورینگ و مدیریت تردد دانش‌آموزی مدارس (ServiceYar)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-emerald-500 selection:text-white flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
