"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { toPersianDigits } from "../../../../utils/i18n";

export default function TenantManagePage() {
  const params = useParams();
  const tenantId = (params?.id as string) || "tenant-school-mehr";

  const [activeTab, setActiveTab] = useState<"students" | "drivers" | "vehicles" | "routes">("students");

  // Sample data for tenant
  const [students, setStudents] = useState([
    { id: "std-1", name: "امیرعلی رضایی", grade: "پایه ششم", route: "مسیر ۱ - ونک", parent: "علی رضایی (۰۹۱۲۱۱۱۲۲۳۳)" },
    { id: "std-2", name: "سارا محمدی", grade: "پایه چهارم", route: "مسیر ۱ - ونک", parent: "حسن محمدی (۰۹۱۲۲۲۲۳۳۴۴)" },
    { id: "std-3", name: "کیان تهرانی", grade: "پایه سوم", route: "مسیر ۱ - ونک", parent: "محمد تهرانی (۰۹۱۲۵۵۵۶۶۷۷)" },
  ]);

  const [drivers, setDrivers] = useState([
    { id: "drv-1", name: "علی رضایی", phone: "۰۹۱۲۱۱۱۲۲۳۳", vehicle: "ون هایس", route: "مسیر ۱ - ونک" },
    { id: "drv-2", name: "حسین حسینی", phone: "۰۹۱۲۳۳۳۴۴۵۵", vehicle: "مینی‌بوس هیوندای", route: "مسیر ۲ - پاسداران" },
  ]);

  // Confirm Modal state for destructive operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    targetId: string;
    type: string;
    reason: string;
  }>({
    isOpen: false,
    title: "",
    targetId: "",
    type: "",
    reason: "",
  });

  const [auditSuccessBanner, setAuditSuccessBanner] = useState<string | null>(null);

  const handleOpenConfirm = (title: string, targetId: string, type: string) => {
    setConfirmModal({
      isOpen: true,
      title,
      targetId,
      type,
      reason: "",
    });
  };

  const handleExecuteDestructive = () => {
    if (!confirmModal.reason) {
      alert("لطفاً دلیل اقدام مدیریتی را برای ثبت در Audit Log وارد کنید.");
      return;
    }

    if (confirmModal.type === "DELETE_STUDENT") {
      setStudents(prev => prev.filter(s => s.id !== confirmModal.targetId));
      setAuditSuccessBanner(`دانش‌آموز با شناسه ${confirmModal.targetId} توسط مدیر کل حذف شد. دلیل: "${confirmModal.reason}" در Audit Log مرکزی ثبت گردید.`);
    } else if (confirmModal.type === "DELETE_DRIVER") {
      setDrivers(prev => prev.filter(d => d.id !== confirmModal.targetId));
      setAuditSuccessBanner(`راننده با شناسه ${confirmModal.targetId} توسط مدیر کل حذف شد. دلیل: "${confirmModal.reason}" در Audit Log ثبت گردید.`);
    }

    setConfirmModal({ isOpen: false, title: "", targetId: "", type: "", reason: "" });
  };

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Super Admin Full Control Purple Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-purple-900/60 to-slate-900 border border-purple-500/40 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-extrabold uppercase tracking-wider">
              حالت راهبری کل (Super Admin Override)
            </span>
            <span className="text-xs font-mono text-purple-400">{tenantId}</span>
          </div>
          <h1 className="text-lg font-bold text-white mt-1">
            دسترسی و مدیریت جامع داده‌های واحد آموزشی
          </h1>
          <p className="text-xs text-purple-200/70 mt-0.5">
            تمامی عملیات‌های ایجاد، ویرایش و حذف در این بخش با شناسه Super Admin و اسنپ‌شات تغییرات در Audit Log ثبت می‌گردد.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/tenants"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            ← بازگشت به فهرست مدارس
          </a>
        </div>
      </div>

      {auditSuccessBanner && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
          <span>✓ {auditSuccessBanner}</span>
          <button onClick={() => setAuditSuccessBanner(null)} className="text-emerald-400 font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "students" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          👨‍🎓 مدیریت دانش‌آموزان ({toPersianDigits(students.length)})
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "drivers" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "bg-slate-900 text-slate-400 hover:text-white"
          }`}
        >
          🚗 مدیریت رانندگان ({toPersianDigits(drivers.length)})
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {activeTab === "students" && (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">نام دانش‌آموز</th>
                <th className="p-3.5">پایه</th>
                <th className="p-3.5">مسیر</th>
                <th className="p-3.5">ولی مرتبط</th>
                <th className="p-3.5">عملیات راهبری (Super Admin Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-white">{s.name}</td>
                  <td className="p-3.5 text-slate-300">{s.grade}</td>
                  <td className="p-3.5 text-purple-400">{s.route}</td>
                  <td className="p-3.5 text-slate-400">{s.parent}</td>
                  <td className="p-3.5 flex items-center gap-2">
                    <button
                      onClick={() => alert(`ویرایش دانش‌آموز ${s.name} توسط مدیر کل`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                    >
                      ✏️ ویرایش مستقیم
                    </button>
                    <button
                      onClick={() => handleOpenConfirm(`حذف دانش‌آموز «${s.name}» از مدرسه ${tenantId}`, s.id, "DELETE_STUDENT")}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-lg text-xs"
                    >
                      🗑 حذف با ثبت دلیل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "drivers" && (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">نام راننده</th>
                <th className="p-3.5">تلفن همراه</th>
                <th className="p-3.5">خودرو</th>
                <th className="p-3.5">مسیر</th>
                <th className="p-3.5">عملیات راهبری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {drivers.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-white">{d.name}</td>
                  <td className="p-3.5 font-mono text-slate-300">{d.phone}</td>
                  <td className="p-3.5 text-slate-300">{d.vehicle}</td>
                  <td className="p-3.5 text-purple-400">{d.route}</td>
                  <td className="p-3.5 flex items-center gap-2">
                    <button
                      onClick={() => alert(`ویرایش راننده ${d.name}`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                    >
                      ✏️ ویرایش مستقیم
                    </button>
                    <button
                      onClick={() => handleOpenConfirm(`حذف راننده «${d.name}» از ناوگان ${tenantId}`, d.id, "DELETE_DRIVER")}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-lg text-xs"
                    >
                      🗑 حذف با ثبت دلیل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Modal with Reason for Destructive Actions */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-red-900/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <span className="text-lg">⚠️</span>
              <h2 className="text-base font-bold text-white">تأیید اقدام حساس توسط مدیر کل</h2>
            </div>
            <p className="text-xs text-slate-300">
              {confirmModal.title}
            </p>
            <div>
              <label className="block text-slate-400 text-xs mb-1">
                علت اقدام مدیریتی (جهت ثبت در Audit Log سراسری): <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={confirmModal.reason}
                onChange={e => setConfirmModal({ ...confirmModal, reason: e.target.value })}
                placeholder="مثال: درخواست کتبی اولیا مبنی بر جابجایی محل سکونت..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, title: "", targetId: "", type: "", reason: "" })}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleExecuteDestructive}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-900/40"
              >
                تأیید و اجرای قطعی اقدام
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
