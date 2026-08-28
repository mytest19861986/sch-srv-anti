"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toPersianDigits } from "../../utils/i18n";

export interface ParentInfo {
  id: string;
  fullName: string;
  phone: string;
  relationship: string; // مادر / پدر / سرپرست
}

export interface Student {
  id: string;
  fullName: string;
  nationalCode: string;
  grade: string;
  routeName: string;
  parents: ParentInfo[];
  status: "PICKED_UP" | "DROPPED_OFF" | "PENDING" | "ABSENT";
}

export const INITIAL_PARENTS_STORE: ParentInfo[] = [
  { id: "par-1", fullName: "فاطمه محمدی", phone: "۰۹۱۲۳۴۵۶۷۸۹", relationship: "مادر" },
  { id: "par-2", fullName: "رضا حسینی", phone: "۰۹۱۲۹۸۷۶۵۴۳", relationship: "پدر" },
  { id: "par-3", fullName: "زهرا کاظمی", phone: "۰۹۳۵۱۱۱2233", relationship: "مادر" },
  { id: "par-4", fullName: "محمد تهرانی", phone: "۰۹۱۲۵۵۵۶۶۷۷", relationship: "پدر" },
  { id: "par-5", fullName: "حسن رضایی", phone: "۰۹۱۲۱۱۱۲۲۳۳", relationship: "پدر" },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [availableParents, setAvailableParents] = useState<ParentInfo[]>(INITIAL_PARENTS_STORE);

  const [students, setStudents] = useState<Student[]>([
    {
      id: "std-1",
      fullName: "امیرعلی محمدی",
      nationalCode: "۰۰۱۲۳۴۵۶۷۸",
      grade: "پایه سوم",
      routeName: "مسیر ۱ - ونک",
      status: "PICKED_UP",
      parents: [
        { id: "par-1", fullName: "فاطمه محمدی", phone: "۰۹۱۲۳۴۵۶۷۸۹", relationship: "مادر" }
      ]
    },
    {
      id: "std-2",
      fullName: "سارا محمدی",
      nationalCode: "۰۰۱۲۳۴۵۶۷۹",
      grade: "پایه اول",
      routeName: "مسیر ۱ - ونک",
      status: "DROPPED_OFF",
      parents: [
        { id: "par-1", fullName: "فاطمه محمدی", phone: "۰۹۱۲۳۴۵۶۷۸۹", relationship: "مادر" }
      ]
    },
    {
      id: "std-3",
      fullName: "پارسا حسینی",
      nationalCode: "۰۰۲۳۴۵۶۷۸۹",
      grade: "پایه پنجم",
      routeName: "مسیر ۲ - پاسداران",
      status: "PICKED_UP",
      parents: [
        { id: "par-2", fullName: "رضا حسینی", phone: "۰۹۱۲۹۸۷۶۵۴۳", relationship: "پدر" },
        { id: "par-3", fullName: "زهرا کاظمی", phone: "۰۹۳۵۱۱۱۲۲۳۳", relationship: "مادر" }
      ]
    },
    {
      id: "std-4",
      fullName: "نیما کاظمی",
      nationalCode: "۰۰۳۴۵۶۷۸۹۰",
      grade: "پایه ششم",
      routeName: "مسیر ۲ - پاسداران",
      status: "PENDING",
      parents: [
        { id: "par-3", fullName: "زهرا کاظمی", phone: "۰۹۳۵۱۱۱۲۲۳۳", relationship: "مادر" }
      ]
    },
    {
      id: "std-5",
      fullName: "کیان تهرانی",
      nationalCode: "۰۰۵۶۷۸۹۰۱۲",
      grade: "پایه دوم",
      routeName: "مسیر ۱ - ونک",
      status: "ABSENT",
      parents: [
        { id: "par-4", fullName: "محمد تهرانی", phone: "۰۹۱۲۵۵۵۶۶۷۷", relationship: "پدر" }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    nationalCode: "",
    grade: "پایه اول",
    routeName: "مسیر ۱ - ونک",
    selectedParentIds: [] as string[]
  });

  // Inline Quick Add Parent
  const [showInlineAddParent, setShowInlineAddParent] = useState(false);
  const [newParentName, setNewParentName] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newParentRel, setNewParentRel] = useState("مادر");

  // Selected student for parents popover/drawer
  const [activeParentPopover, setActiveParentPopover] = useState<Student | null>(null);

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setShowInlineAddParent(false);
    setFormData({
      fullName: "",
      nationalCode: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      grade: "پایه اول",
      routeName: "مسیر ۱ - ونک",
      selectedParentIds: [availableParents[0]?.id || "par-1"]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setShowInlineAddParent(false);
    setFormData({
      fullName: s.fullName,
      nationalCode: s.nationalCode,
      grade: s.grade,
      routeName: s.routeName,
      selectedParentIds: s.parents.map(p => p.id)
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این دانش‌آموز از سامانه مدرسه اطمینان دارید؟")) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleParentSelection = (parentId: string) => {
    setFormData(prev => {
      const exists = prev.selectedParentIds.includes(parentId);
      if (exists) {
        return { ...prev, selectedParentIds: prev.selectedParentIds.filter(id => id !== parentId) };
      } else {
        return { ...prev, selectedParentIds: [...prev.selectedParentIds, parentId] };
      }
    });
  };

  const handleQuickAddParent = () => {
    if (!newParentName || !newParentPhone) {
      alert("لطفاً نام و شماره همراه والد را وارد کنید.");
      return;
    }
    const newId = `par-${Date.now()}`;
    const newP: ParentInfo = {
      id: newId,
      fullName: newParentName,
      phone: newParentPhone,
      relationship: newParentRel
    };
    setAvailableParents(prev => [...prev, newP]);
    setFormData(prev => ({
      ...prev,
      selectedParentIds: [...prev.selectedParentIds, newId]
    }));
    setNewParentName("");
    setNewParentPhone("");
    setShowInlineAddParent(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) return;

    const matchedParents = availableParents.filter(p => formData.selectedParentIds.includes(p.id));

    if (editingStudent) {
      setStudents(prev =>
        prev.map(s =>
          s.id === editingStudent.id
            ? {
                ...s,
                fullName: formData.fullName,
                nationalCode: formData.nationalCode,
                grade: formData.grade,
                routeName: formData.routeName,
                parents: matchedParents
              }
            : s
        )
      );
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        fullName: formData.fullName,
        nationalCode: formData.nationalCode,
        grade: formData.grade,
        routeName: formData.routeName,
        status: "PENDING",
        parents: matchedParents
      };
      setStudents(prev => [newStudent, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filtered = students.filter(
    s =>
      !search ||
      s.fullName.includes(search) ||
      s.nationalCode.includes(search) ||
      s.parents.some(p => p.fullName.includes(search) || p.phone.includes(search))
  );

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <span className="text-2xl">👨‍🎓</span>
            <span>مدیریت دانش‌آموزان و ارتباط با والدین</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده پرونده تحصیلی، ایستگاه‌های سرویس و اتصال مستقیم تک‌لمسی با اولیای دانش‌آموزان
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="جستجو با نام، کدملی، یا نام والد..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64 shadow-inner"
          />
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
          >
            <span>+ ثبت دانش‌آموز جدید</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800/90 border border-slate-700/60 px-3.5 py-2.5 rounded-xl font-medium">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(students.length)} دانش‌آموز</span>
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 select-none">
            <tr>
              <th className="p-4">نام و نام خانوادگی</th>
              <th className="p-4">کد ملی</th>
              <th className="p-4">پایه تحصیلی</th>
              <th className="p-4">مسیر سرویس</th>
              <th className="p-4 bg-emerald-950/20 text-emerald-300 font-bold border-x border-emerald-800/30">
                👨‍👩‍👧 والد / سرپرست قانونی
              </th>
              <th className="p-4">وضعیت امروز</th>
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(s => {
              const hasMultiple = s.parents.length > 1;
              const primaryParent = s.parents[0];

              return (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="p-4 font-bold text-white">
                    <Link
                      href={`/students/${s.id}`}
                      className="hover:text-emerald-400 hover:underline flex items-center gap-2"
                    >
                      <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs">
                        {s.fullName.slice(0, 1)}
                      </span>
                      <span>{s.fullName}</span>
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{toPersianDigits(s.nationalCode)}</td>
                  <td className="p-4 text-slate-300 font-medium">{s.grade}</td>
                  <td className="p-4 text-emerald-400 font-medium">{s.routeName}</td>

                  {/* Parents Column (P0 Specification) */}
                  <td className="p-4 bg-emerald-950/10 border-x border-emerald-800/20">
                    {s.parents.length === 0 ? (
                      <span className="text-slate-500 italic">بدون والد متصل</span>
                    ) : hasMultiple ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveParentPopover(s)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          title="مشاهده همه والدین این دانش‌آموز"
                        >
                          <span>👥 {toPersianDigits(s.parents.length)} والد متصل</span>
                          <span className="text-[10px] bg-emerald-400/20 px-1 rounded">مشاهده</span>
                        </button>
                        <span className="text-slate-400 text-[11px] truncate max-w-[130px]">
                          ({s.parents.map(p => p.fullName).join("، ")})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{primaryParent.fullName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                              {primaryParent.relationship}
                            </span>
                          </div>
                          <a
                            href={`tel:${primaryParent.phone}`}
                            className="font-mono text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 mt-0.5"
                            title="تماس تلفنی با والد"
                          >
                            <span>📞</span>
                            <span>{toPersianDigits(primaryParent.phone)}</span>
                          </a>
                        </div>
                        <a
                          href={`tel:${primaryParent.phone}`}
                          className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all text-xs"
                          title="تماس فوری"
                        >
                          📞 تماس
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    {s.status === "PICKED_UP" && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                        <span>سوار شده</span>
                      </span>
                    )}
                    {s.status === "DROPPED_OFF" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>رسیده به مقصد</span>
                      </span>
                    )}
                    {s.status === "PENDING" && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>در انتظار سرویس</span>
                      </span>
                    )}
                    {s.status === "ABSENT" && (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-900/40 font-medium flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        <span>غایب امروز</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/students/${s.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                      >
                        پروفایل
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900 text-red-400 rounded-lg text-xs font-medium transition-all"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Multiple Parents Modal / Viewer */}
      {activeParentPopover && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  👨‍👩‍👧 والدین و سرپرستان: {activeParentPopover.fullName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعداد {toPersianDigits(activeParentPopover.parents.length)} سرپرست قانونی ثبت شده
                </p>
              </div>
              <button
                onClick={() => setActiveParentPopover(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activeParentPopover.parents.map(p => (
                <div
                  key={p.id}
                  className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{p.fullName}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                        {p.relationship}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <span>شماره همراه:</span>
                      <span className="text-slate-200">{toPersianDigits(p.phone)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${p.phone}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-emerald-950"
                    >
                      <span>📞 تماس</span>
                    </a>
                    <a
                      href={`sms:${p.phone}`}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all"
                    >
                      💬 پیام
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveParentPopover(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Student Modal with Parents Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>{editingStudent ? "✏️ ویرایش اطلاعات دانش‌آموز" : "➕ ثبت دانش‌آموز جدید"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: امیرعلی محمدی"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">کد ملی دانش‌آموز *</label>
                  <input
                    type="text"
                    required
                    value={formData.nationalCode}
                    onChange={e => setFormData({ ...formData, nationalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">پایه تحصیلی</label>
                  <select
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="پایه اول">پایه اول</option>
                    <option value="پایه دوم">پایه دوم</option>
                    <option value="پایه سوم">پایه سوم</option>
                    <option value="پایه چهارم">پایه چهارم</option>
                    <option value="پایه پنجم">پایه پنجم</option>
                    <option value="پایه ششم">پایه ششم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">مسیر سرویس</label>
                  <select
                    value={formData.routeName}
                    onChange={e => setFormData({ ...formData, routeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="مسیر ۱ - ونک">مسیر ۱ - ونک</option>
                    <option value="مسیر ۲ - پاسداران">مسیر ۲ - پاسداران</option>
                    <option value="مسیر ۳ - سعادت‌آباد">مسیر ۳ - سعادت‌آباد</option>
                    <option value="مسیر ۴ - صادقیه">مسیر ۴ - صادقیه</option>
                  </select>
                </div>
              </div>

              {/* Parents Selection Section (P0 Specification) */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold block">👨‍👩‍👧 والدین و سرپرستان متصل</span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ این دانش‌آموز به {toPersianDigits(formData.selectedParentIds.length)} والد متصل است
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInlineAddParent(!showInlineAddParent)}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all"
                  >
                    {showInlineAddParent ? "انصراف" : "+ افزودن والد جدید"}
                  </button>
                </div>

                {/* Inline Quick Parent Creator */}
                {showInlineAddParent && (
                  <div className="bg-slate-900 border border-emerald-500/30 p-3 rounded-xl space-y-2.5 animate-fade-in">
                    <span className="text-emerald-300 font-bold block text-[11px]">ایجاد و اتصال سریع والد جدید:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="نام والد (مثلاً فاطمه محمدی)"
                        value={newParentName}
                        onChange={e => setNewParentName(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="شماره همراه (۰۹۱۲...)"
                        value={newParentPhone}
                        onChange={e => setNewParentPhone(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-white font-mono text-xs"
                      />
                      <select
                        value={newParentRel}
                        onChange={e => setNewParentRel(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-white text-xs"
                      >
                        <option value="مادر">مادر</option>
                        <option value="پدر">پدر</option>
                        <option value="سرپرست">سرپرست</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickAddParent}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all"
                    >
                      ثبت والد و اتصال به این دانش‌آموز
                    </button>
                  </div>
                )}

                {/* Parent Checkboxes List */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableParents.map(p => {
                    const isChecked = formData.selectedParentIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all text-xs ${
                          isChecked
                            ? "bg-emerald-950/30 border-emerald-500/50 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleParentSelection(p.id)}
                            className="rounded accent-emerald-500"
                          />
                          <span className="font-bold text-white">{p.fullName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {p.relationship}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">{toPersianDigits(p.phone)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/40"
                >
                  {editingStudent ? "ذخیره تغییرات" : "ثبت نهایی دانش‌آموز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
