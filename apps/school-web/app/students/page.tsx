"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

interface Student {
  id: string;
  fullName: string;
  nationalCode: string;
  grade: string;
  routeName: string;
  parentName: string;
  parentPhone: string;
  status: string;
}

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([
    { id: "std-1", fullName: "امیرعلی رضایی", nationalCode: "۰۰۱۲۳۴۵۶۷۸", grade: "پایه ششم", routeName: "مسیر ۱ - ونک", status: "PICKED_UP", parentName: "علی رضایی", parentPhone: "۰۹۱۲۱۱۱۲۲۳۳" },
    { id: "std-2", fullName: "سارا محمدی", nationalCode: "۰۰۲۳۴۵۶۷۸۹", grade: "پایه چهارم", routeName: "مسیر ۱ - ونک", status: "DROPPED_OFF", parentName: "حسن محمدی", parentPhone: "۰۹۱۲۲۲۲۳۳۴۴" },
    { id: "std-3", fullName: "محمدحسین حسینی", nationalCode: "۰۰۳۴۵۶۷۸۹۰", grade: "پایه پنجم", routeName: "مسیر ۲ - پاسداران", status: "PENDING", parentName: "حسین حسینی", parentPhone: "۰۹۱۲۳۳۳۴۴۵۵" },
    { id: "std-4", fullName: "زهرا کاظمی", nationalCode: "۰۰۴۵۶۷۸۹۰۱", grade: "پایه اول", routeName: "مسیر ۲ - پاسداران", status: "ABSENT", parentName: "مهدی کاظمی", parentPhone: "۰۹۱۲۴۴۴۵۵۶۶" },
    { id: "std-5", fullName: "کیان تهرانی", nationalCode: "۰۰۵۶۷۸۹۰۱۲", grade: "پایه سوم", routeName: "مسیر ۱ - ونک", status: "PICKED_UP", parentName: "محمد تهرانی", parentPhone: "۰۹۱۲۵۵۵۶۶۷۷" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    nationalCode: "",
    grade: "پایه اول",
    routeName: "مسیر ۱ - ونک",
    parentName: "",
    parentPhone: "",
  });

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormData({
      fullName: "",
      nationalCode: `00${Date.now().toString().slice(-8)}`,
      grade: "پایه اول",
      routeName: "مسیر ۱ - ونک",
      parentName: "",
      parentPhone: "0912",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      fullName: s.fullName,
      nationalCode: s.nationalCode,
      grade: s.grade,
      routeName: s.routeName,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این دانش‌آموز از سامانه مدرسه اطمینان دارید؟")) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) return;

    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...formData } : s));
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        fullName: formData.fullName,
        nationalCode: formData.nationalCode,
        grade: formData.grade,
        routeName: formData.routeName,
        parentName: formData.parentName || "ولی دانش‌آموز",
        parentPhone: formData.parentPhone || "۰۹۱۲۰۰۰۰۰۰۰",
        status: "PENDING"
      };
      setStudents(prev => [newStudent, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filtered = students.filter(s => !search || s.fullName.includes(search) || s.nationalCode.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>👨‍🎓 فهرست و مدیریت دانش‌آموزان</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت ثبت‌نام، مسیرهای تخصیص‌یافته و اولیای دانش‌آموزان</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با نام یا کدملی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
          />
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <span>+ ثبت دانش‌آموز جدید</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(students.length)} نفر</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام و نام خانوادگی</th>
              <th className="p-3.5">کد ملی</th>
              <th className="p-3.5">پایه تحصیلی</th>
              <th className="p-3.5">مسیر سرویس</th>
              <th className="p-3.5">نام ولی</th>
              <th className="p-3.5">تلفن ولی</th>
              <th className="p-3.5">وضعیت امروز</th>
              <th className="p-3.5">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{s.fullName}</td>
                <td className="p-3.5 font-mono text-slate-400">{s.nationalCode}</td>
                <td className="p-3.5 text-slate-300">{s.grade}</td>
                <td className="p-3.5 text-emerald-400 font-medium">{s.routeName}</td>
                <td className="p-3.5 text-slate-300">{s.parentName}</td>
                <td className="p-3.5 font-mono text-slate-400">{s.parentPhone}</td>
                <td className="p-3.5">
                  {s.status === "PICKED_UP" && <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">سوار شده</span>}
                  {s.status === "DROPPED_OFF" && <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">رسیده به مدرسه</span>}
                  {s.status === "PENDING" && <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">در انتظار</span>}
                  {s.status === "ABSENT" && <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-900/40 font-medium">غایب</span>}
                </td>
                <td className="p-3.5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
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
              {editingStudent ? "ویرایش پرونده دانش‌آموز" : "ثبت‌نام دانش‌آموز جدید در سرویس"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">نام و نام خانوادگی دانش‌آموز</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: پارسا کمالی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">کد ملی</label>
                  <input
                    type="text"
                    required
                    value={formData.nationalCode}
                    onChange={e => setFormData({ ...formData, nationalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">پایه تحصیلی</label>
                  <select
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="پایه اول">پایه اول</option>
                    <option value="پایه دوم">پایه دوم</option>
                    <option value="پایه سوم">پایه سوم</option>
                    <option value="پایه چهارم">پایه چهارم</option>
                    <option value="پایه پنجم">پایه پنجم</option>
                    <option value="پایه ششم">پایه ششم</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">مسیر سرویس</label>
                <select
                  value={formData.routeName}
                  onChange={e => setFormData({ ...formData, routeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 outline-none"
                >
                  <option value="مسیر ۱ - ونک">مسیر ۱ - ونک</option>
                  <option value="مسیر ۲ - پاسداران">مسیر ۲ - پاسداران</option>
                  <option value="مسیر ۳ - سعادت‌آباد">مسیر ۳ - سعادت‌آباد</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نام ولی</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="مثال: رضا کمالی"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">شماره همراه ولی</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="۰۹۱۲..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
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
                  {editingStudent ? "ذخیره تغییرات" : "ثبت‌نام دانش‌آموز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
