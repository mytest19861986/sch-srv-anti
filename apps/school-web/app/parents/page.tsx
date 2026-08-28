"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toPersianDigits } from "../../utils/i18n";

export interface StudentChild {
  id: string;
  fullName: string;
  grade: string;
  nationalCode: string;
  status: "ACTIVE" | "PICKED_UP" | "DROPPED_OFF" | "PENDING";
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  relationship: string; // مادر / پدر / سرپرست
  children: StudentChild[];
  status: "ACTIVE" | "INACTIVE";
}

export const INITIAL_STUDENTS_STORE: StudentChild[] = [
  { id: "std-1", fullName: "امیرعلی محمدی", grade: "پایه سوم", nationalCode: "۰۰۱۲۳۴۵۶۷۸", status: "PICKED_UP" },
  { id: "std-2", fullName: "سارا محمدی", grade: "پایه اول", nationalCode: "۰۰۱۲۳۴۵۶۷۹", status: "DROPPED_OFF" },
  { id: "std-3", fullName: "پارسا حسینی", grade: "پایه پنجم", nationalCode: "۰۰۲۳۴۵۶۷۸۹", status: "PICKED_UP" },
  { id: "std-4", fullName: "نیما کاظمی", grade: "پایه ششم", nationalCode: "۰۰۳۴۵۶۷۸۹۰", status: "PENDING" },
  { id: "std-5", fullName: "کیان تهرانی", grade: "پایه دوم", nationalCode: "۰۰۵۶۷۸۹۰۱۲", status: "ACTIVE" },
];

export default function ParentsPage() {
  const [search, setSearch] = useState("");
  const [availableStudents, setAvailableStudents] = useState<StudentChild[]>(INITIAL_STUDENTS_STORE);

  const [parents, setParents] = useState<Parent[]>([
    {
      id: "par-1",
      fullName: "فاطمه محمدی",
      phone: "۰۹۱۲۳۴۵۶۷۸۹",
      email: "fatemeh.mohammadi@mehr.serviceyar.ir",
      relationship: "مادر",
      status: "ACTIVE",
      children: [
        { id: "std-1", fullName: "امیرعلی محمدی", grade: "پایه سوم", nationalCode: "۰۰۱۲۳۴۵۶۷۸", status: "PICKED_UP" },
        { id: "std-2", fullName: "سارا محمدی", grade: "پایه اول", nationalCode: "۰۰۱۲۳۴۵۶۷۹", status: "DROPPED_OFF" }
      ]
    },
    {
      id: "par-2",
      fullName: "رضا حسینی",
      phone: "۰۹۱۲۹۸۷۶۵۴۳",
      email: "reza.hosseini@mehr.serviceyar.ir",
      relationship: "پدر",
      status: "ACTIVE",
      children: [
        { id: "std-3", fullName: "پارسا حسینی", grade: "پایه پنجم", nationalCode: "۰۰۲۳۴۵۶۷۸۹", status: "PICKED_UP" }
      ]
    },
    {
      id: "par-3",
      fullName: "زهرا کاظمی",
      phone: "۰۹۳۵۱۱۱۲۲۳۳",
      email: "zahra.kazemi@mehr.serviceyar.ir",
      relationship: "مادر",
      status: "ACTIVE",
      children: [
        { id: "std-3", fullName: "پارسا حسینی", grade: "پایه پنجم", nationalCode: "۰۰۲۳۴۵۶۷۸۹", status: "PICKED_UP" },
        { id: "std-4", fullName: "نیما کاظمی", grade: "پایه ششم", nationalCode: "۰۰۳۴۵۶۷۸۹۰", status: "PENDING" }
      ]
    },
    {
      id: "par-4",
      fullName: "محمد تهرانی",
      phone: "۰۹۱۲۵۵۵۶۶۷۷",
      email: "mohammad.tehrani@mehr.serviceyar.ir",
      relationship: "پدر",
      status: "ACTIVE",
      children: [
        { id: "std-5", fullName: "کیان تهرانی", grade: "پایه دوم", nationalCode: "۰۰۵۶۷۸۹۰۱۲", status: "ACTIVE" }
      ]
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [tempPasswordBanner, setTempPasswordBanner] = useState<{ email: string; pass: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    relationship: "مادر",
    selectedStudentIds: [] as string[]
  });

  // Inline Quick Add Student
  const [showInlineAddStudent, setShowInlineAddStudent] = useState(false);
  const [newStudentFirst, setNewStudentFirst] = useState("");
  const [newStudentLast, setNewStudentLast] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("پایه اول");

  // Selected parent for Children Details Modal
  const [activeChildrenModal, setActiveChildrenModal] = useState<Parent | null>(null);

  const handleOpenCreate = () => {
    setEditingParent(null);
    setShowInlineAddStudent(false);
    setFormData({
      fullName: "",
      phone: "0912",
      email: "",
      relationship: "مادر",
      selectedStudentIds: [availableStudents[0]?.id || "std-1"]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Parent) => {
    setEditingParent(p);
    setShowInlineAddStudent(false);
    setFormData({
      fullName: p.fullName,
      phone: p.phone,
      email: p.email,
      relationship: p.relationship || "سرپرست",
      selectedStudentIds: p.children.map(c => c.id)
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این ولی از سامانه مدرسه اطمینان دارید؟")) {
      setParents(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleStudentSelection = (studentId: string) => {
    setFormData(prev => {
      const exists = prev.selectedStudentIds.includes(studentId);
      if (exists) {
        return { ...prev, selectedStudentIds: prev.selectedStudentIds.filter(id => id !== studentId) };
      } else {
        return { ...prev, selectedStudentIds: [...prev.selectedStudentIds, studentId] };
      }
    });
  };

  const handleQuickAddStudent = () => {
    if (!newStudentFirst || !newStudentLast) {
      alert("لطفاً نام و نام خانوادگی دانش‌آموز را وارد کنید.");
      return;
    }
    const newId = `std-${Date.now()}`;
    const newChild: StudentChild = {
      id: newId,
      fullName: `${newStudentFirst} ${newStudentLast}`,
      grade: newStudentGrade,
      nationalCode: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: "PENDING"
    };
    setAvailableStudents(prev => [...prev, newChild]);
    setFormData(prev => ({
      ...prev,
      selectedStudentIds: [...prev.selectedStudentIds, newId]
    }));
    setNewStudentFirst("");
    setNewStudentLast("");
    setShowInlineAddStudent(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) return;

    const matchedChildren = availableStudents.filter(s => formData.selectedStudentIds.includes(s.id));

    if (editingParent) {
      setParents(prev =>
        prev.map(p =>
          p.id === editingParent.id
            ? {
                ...p,
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                relationship: formData.relationship,
                children: matchedChildren
              }
            : p
        )
      );
    } else {
      const generatedPass = `Pass@${Math.floor(100000 + Math.random() * 900000)}`;
      const userEmail = formData.email || `parent.${formData.phone.slice(-4)}@mehr.serviceyar.ir`;
      const newParent: Parent = {
        id: `par-${Date.now()}`,
        fullName: formData.fullName,
        phone: formData.phone,
        email: userEmail,
        relationship: formData.relationship,
        status: "ACTIVE",
        children: matchedChildren
      };
      setParents(prev => [newParent, ...prev]);
      setTempPasswordBanner({ email: userEmail, pass: generatedPass });
    }
    setIsModalOpen(false);
  };

  const filtered = parents.filter(
    p =>
      !search ||
      p.fullName.includes(search) ||
      p.phone.includes(search) ||
      p.children.some(c => c.fullName.includes(search))
  );

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <span className="text-2xl">👨‍👩‍👧</span>
            <span>مدیریت اولیا و فرزندان تحت سرپرستی</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده پرونده والدین، دسترسی اپلیکیشن، صدور رمز موقت و مدیریت پیوندهای چندفرزندی
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="جستجو با نام، شماره همراه، یا نام فرزند..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64 shadow-inner"
          />
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
          >
            <span>+ ثبت ولی جدید</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800/90 border border-slate-700/60 px-3.5 py-2.5 rounded-xl font-medium">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(parents.length)} ولی</span>
          </span>
        </div>
      </div>

      {/* Temp Password Banner */}
      {tempPasswordBanner && (
        <div className="bg-emerald-950/70 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div>
            <span className="text-xs font-bold text-emerald-300 block">
              ✓ حساب کاربری ولی با موفقیت ایجاد و رمز موقت اپلیکیشن صادر شد:
            </span>
            <div className="text-xs text-slate-300 mt-1.5 flex items-center gap-6">
              <span>
                نام کاربری: <strong className="text-white font-mono">{tempPasswordBanner.email}</strong>
              </span>
              <span>
                رمز موقت یک‌باره:{" "}
                <strong className="text-emerald-300 font-mono bg-black/60 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  {tempPasswordBanner.pass}
                </strong>
              </span>
            </div>
          </div>
          <button
            onClick={() => setTempPasswordBanner(null)}
            className="px-3.5 py-1.5 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 rounded-xl text-xs font-bold transition-all"
          >
            بستن پیام
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 select-none">
            <tr>
              <th className="p-4">نام و نسبت ولی</th>
              <th className="p-4">شماره همراه</th>
              <th className="p-4">پست الکترونیک (نام کاربری)</th>
              <th className="p-4 bg-emerald-950/20 text-emerald-300 font-bold border-x border-emerald-800/30">
                🎒 فرزندان تحت سرپرستی
              </th>
              <th className="p-4">وضعیت حساب</th>
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="p-4 font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs">
                      {p.fullName.slice(0, 1)}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/parents/${p.id}`} className="hover:text-emerald-400 hover:underline">
                          {p.fullName}
                        </Link>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                          {p.relationship}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-slate-300">
                  <a href={`tel:${p.phone}`} className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <span>📞</span>
                    <span>{toPersianDigits(p.phone)}</span>
                  </a>
                </td>
                <td className="p-4 font-mono text-slate-400">{p.email}</td>

                {/* Children Column (P0 Specification) */}
                <td className="p-4 bg-emerald-950/10 border-x border-emerald-800/20">
                  {p.children.length === 0 ? (
                    <span className="text-slate-500 italic">بدون فرزند ثبت شده</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveChildrenModal(p)}
                        className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="مشاهده لیست فرزندان"
                      >
                        <span>🎒 {toPersianDigits(p.children.length)} دانش‌آموز</span>
                        <span className="text-[10px] bg-emerald-400/20 px-1 rounded">مشاهده</span>
                      </button>
                      <span className="text-slate-400 text-[11px] truncate max-w-[130px]">
                        ({p.children.map(c => c.fullName).join("، ")})
                      </span>
                    </div>
                  )}
                </td>

                <td className="p-4">
                  {p.status === "ACTIVE" ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>فعال</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                      غیرفعال
                    </span>
                  )}
                </td>

                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveChildrenModal(p)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-medium transition-all"
                    >
                      فرزندان
                    </button>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900 text-red-400 rounded-lg text-xs font-medium transition-all"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Children List Modal (P0 Specification) */}
      {activeChildrenModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  🎒 فرزندان تحت سرپرستی: {activeChildrenModal.fullName} ({activeChildrenModal.relationship})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تعداد {toPersianDigits(activeChildrenModal.children.length)} دانش‌آموز ثبت شده
                </p>
              </div>
              <button
                onClick={() => setActiveChildrenModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activeChildrenModal.children.map(child => (
                <div
                  key={child.id}
                  className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{child.fullName}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700 font-medium">
                        {child.grade}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                      <span>کد ملی:</span>
                      <span className="text-slate-300">{toPersianDigits(child.nationalCode)}</span>
                    </div>
                  </div>
                  <div>
                    {child.status === "PICKED_UP" && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">
                        سوار شده
                      </span>
                    )}
                    {child.status === "DROPPED_OFF" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                        رسیده به مقصد
                      </span>
                    )}
                    {child.status === "PENDING" && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                        در انتظار
                      </span>
                    )}
                    {child.status === "ACTIVE" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                        فعال
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <a
                href={`tel:${activeChildrenModal.phone}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span>📞 تماس تلفنی با والد</span>
              </a>
              <button
                onClick={() => setActiveChildrenModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Parent Modal with Children Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>{editingParent ? "✏️ ویرایش حساب والد" : "➕ ثبت ولی جدید و صدور دسترسی"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نام کامل ولی *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="مثال: فاطمه محمدی"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">شماره همراه (شناسه ورود) *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="09121234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نسبت با دانش‌آموز</label>
                  <select
                    value={formData.relationship}
                    onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="مادر">مادر</option>
                    <option value="پدر">پدر</option>
                    <option value="سرپرست قانونی">سرپرست قانونی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">ایمیل اختصاصی (اختیاری)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="autogenerated@mehr.ir"
                  />
                </div>
              </div>

              {/* Children Selection Section (P0 Specification) */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold block">🎒 فرزندان تحت سرپرستی</span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ این والد سرپرست {toPersianDigits(formData.selectedStudentIds.length)} دانش‌آموز است
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInlineAddStudent(!showInlineAddStudent)}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all"
                  >
                    {showInlineAddStudent ? "انصراف" : "+ افزودن فرزند جدید"}
                  </button>
                </div>

                {/* Inline Quick Student Creator */}
                {showInlineAddStudent && (
                  <div className="bg-slate-900 border border-emerald-500/30 p-3 rounded-xl space-y-2.5 animate-fade-in">
                    <span className="text-emerald-300 font-bold block text-[11px]">ایجاد و اتصال سریع دانش‌آموز جدید:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="نام (مثلاً سارا)"
                        value={newStudentFirst}
                        onChange={e => setNewStudentFirst(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="نام خانوادگی"
                        value={newStudentLast}
                        onChange={e => setNewStudentLast(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-white text-xs"
                      />
                      <select
                        value={newStudentGrade}
                        onChange={e => setNewStudentGrade(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-white text-xs"
                      >
                        <option value="پایه اول">پایه اول</option>
                        <option value="پایه دوم">پایه دوم</option>
                        <option value="پایه سوم">پایه سوم</option>
                        <option value="پایه چهارم">پایه چهارم</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickAddStudent}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all"
                    >
                      ثبت دانش‌آموز و اتصال به این والد
                    </button>
                  </div>
                )}

                {/* Student Checkboxes List */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableStudents.map(s => {
                    const isChecked = formData.selectedStudentIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
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
                            onChange={() => handleToggleStudentSelection(s.id)}
                            className="rounded accent-emerald-500"
                          />
                          <span className="font-bold text-white">{s.fullName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {s.grade}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">
                          کد ملی: {toPersianDigits(s.nationalCode)}
                        </span>
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
                  {editingParent ? "ذخیره تغییرات" : "ثبت نهایی و صدور رمز"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
