"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  childrenCount: number;
  status: string;
}

export default function ParentsPage() {
  const [search, setSearch] = useState("");
  const [parents, setParents] = useState<Parent[]>([
    { id: "par-1", fullName: "محمد تهرانی", phone: "۰۹۱۲۵۵۵۶۶۷۷", email: "parent@demo.ir", childrenCount: 1, status: "ACTIVE" },
    { id: "par-2", fullName: "علی رضایی", phone: "۰۹۱۲۱۱۱۲۲۳۳", email: "parent.rezaei@demo.ir", childrenCount: 1, status: "ACTIVE" },
    { id: "par-3", fullName: "حسن محمدی", phone: "۰۹۱۲۲۲۲۳۳۴۴", email: "parent.mohammadi@demo.ir", childrenCount: 2, status: "ACTIVE" },
    { id: "par-4", fullName: "مهدی کاظمی", phone: "۰۹۱۲۴۴۴۵۵۶۶", email: "parent.kazemi@demo.ir", childrenCount: 1, status: "ACTIVE" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [tempPasswordBanner, setTempPasswordBanner] = useState<{ email: string; pass: string } | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    childrenCount: 1,
  });

  const handleOpenCreate = () => {
    setEditingParent(null);
    setFormData({
      fullName: "",
      phone: "0912",
      email: "",
      childrenCount: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Parent) => {
    setEditingParent(p);
    setFormData({
      fullName: p.fullName,
      phone: p.phone,
      email: p.email,
      childrenCount: p.childrenCount,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این ولی از سیستم مدرسه اطمینان دارید؟")) {
      setParents(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) return;

    if (editingParent) {
      setParents(prev => prev.map(p => p.id === editingParent.id ? { ...p, ...formData } : p));
    } else {
      const generatedPass = `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
      const userEmail = formData.email || `parent.${formData.phone.slice(-4)}@mehr.serviceyar.ir`;
      const newParent: Parent = {
        id: `par-${Date.now()}`,
        fullName: formData.fullName,
        phone: formData.phone,
        email: userEmail,
        childrenCount: Number(formData.childrenCount),
        status: "ACTIVE"
      };
      setParents(prev => [newParent, ...prev]);
      setTempPasswordBanner({ email: userEmail, pass: generatedPass });
    }
    setIsModalOpen(false);
  };

  const filtered = parents.filter(p => !search || p.fullName.includes(search) || p.phone.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>👨‍👩‍👧 فهرست و مدیریت اولیای دانش‌آموزان</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مشاهده حساب‌های کاربری، صدور رمزهای ورود موقت و ارتباط با اپلیکیشن اولیا</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با نام یا شماره تلفن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
          />
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <span>+ ثبت ولی جدید</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(parents.length)} نفر</span>
          </span>
        </div>
      </div>

      {tempPasswordBanner && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
          <div>
            <span className="text-xs font-bold text-emerald-300 block">✓ حساب کاربری ولی با موفقیت ایجاد و رمز موقت صادر شد:</span>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-4">
              <span>نام کاربری: <strong className="text-white font-mono">{tempPasswordBanner.email}</strong></span>
              <span>رمز موقت یک‌باره: <strong className="text-emerald-400 font-mono bg-black/40 px-2 py-0.5 rounded">{tempPasswordBanner.pass}</strong></span>
            </div>
          </div>
          <button
            onClick={() => setTempPasswordBanner(null)}
            className="px-3 py-1 bg-emerald-900/40 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs"
          >
            بستن
          </button>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام ولی</th>
              <th className="p-3.5">شماره همراه</th>
              <th className="p-3.5">پست الکترونیک (نام کاربری)</th>
              <th className="p-3.5">تعداد فرزندان</th>
              <th className="p-3.5">وضعیت حساب</th>
              <th className="p-3.5">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{p.fullName}</td>
                <td className="p-3.5 font-mono text-slate-300">{p.phone}</td>
                <td className="p-3.5 font-mono text-slate-400">{p.email}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(p.childrenCount)} فرزند</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    فعال
                  </span>
                </td>
                <td className="p-3.5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs border border-red-800/40 transition-colors"
                  >
                    🗑 حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-white">
              {editingParent ? "ویرایش اطلاعات ولی دانش‌آموز" : "ثبت پرونده و ایجاد حساب اولیا"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">نام و نام خانوادگی ولی</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: دکتر علیرضا نادری"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">شماره تلفن همراه</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="۰۹۱۲..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">پست الکترونیک (اختیاری)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="parent@domain.ir"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">تعداد فرزندان تحت تکفل در این مدرسه</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.childrenCount}
                  onChange={e => setFormData({ ...formData, childrenCount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                >
                  {editingParent ? "ذخیره تغییرات" : "ایجاد پرونده و صدور رمز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
