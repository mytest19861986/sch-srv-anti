import React from "react";
import "./globals.css";

export const metadata = {
  title: "پنل راهبری مرکزی سامانه (Super Admin)",
  description: "مدیریت چندمستأجری مدارس، کاربران و لاگ‌های حسابرسی پلتفرم",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
