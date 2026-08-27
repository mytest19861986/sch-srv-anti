"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

interface Tenant {
  id: string;
  name: string;
  code: string;
  city: string;
  studentsCount: number;
  driversCount: number;
  isActive: boolean;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: "tenant-school-mehr", name: "مجتمع آموزشی مهر آفرین", code: "SCH-MEHR-01", city: "تهران", studentsCount: 145, driversCount: 8, isActive: true },
    { id: "tenant-school-alborz", name: "دبستان هوشمند البرز", code: "SCH-ALB-02", city: "کرج", studentsCount: 320, driversCount: 16, isActive: true },
    { id: "tenant-school-razavi", name: "مجموعه مدارس رضوی", code: "SCH-RZV-03", city: "مشهد", studentsCount: 480, driversCount: 24, isActive: true },
    { id: "tenant-school-tabriz", name: "دبیرستان علامه طباطبایی", code: "SCH-TBZ-04", city: "تبریز", studentsCount: 210, driversCount: 12, isActive: true },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    city: "تهران",
    studentsCount: 100,
    driversCount: 5,
  });

  const toggleStatus = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormData({ name: "", code: `SCH-${Date.now().toString().slice(-4)}`, city: "تهران", studentsCount: 100, driversCount: 5 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({ name: t.name, code: t.code, city: t.city, studentsCount: t.studentsCount, driversCount: t.driversCount });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingTenant) {
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...formData } : t));
    } else {
      const newTenant: Tenant = {
        id: `tenant-${Date.now()}`,
        name: formData.name,
        code: formData.code,
        city: formData.city,
        studentsCount: Number(formData.studentsCount),
        driversCount: Number(formData.driversCount),
        isActive: true
      };
      setTenants(prev => [newTenant, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🏢 مدیریت مدارس و شعب (Tenants Management)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">ایجاد، تعلیق و مدیریت اطلاعات مدارس عضو پلتفرم کشوری</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2"
          >
            <span>+ ثبت مدرسه جدید</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800 px-3.5 py-2 rounded-xl">
            تعداد کل مدارس: <span className="text-purple-400 font-bold">{toPersianDigits(tenants.length)} واحد</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام واحد آموزشی</th>
              <th className="p-3.5">کد شناسایی</th>
              <th className="p-3.5">شهر / منطقه</th>
              <th className="p-3.5">دانش‌آموزان</th>
              <th className="p-3.5">ناوگان خودرویی</th>
              <th className="p-3.5">وضعیت سرویس</th>
              <th className="p-3.5">عملیات مدیریتی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{t.name}</td>
                <td className="p-3.5 font-mono text-purple-400">{t.code}</td>
                <td className="p-3.5 text-slate-300">{t.city}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(t.studentsCount)} نفر</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(t.driversCount)} خودرو</td>
                <td className="p-3.5">
                  {t.isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      فعال
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-900/40 font-medium">
                      غیرفعال / تعلیق
                    </span>
                  )}
                </td>
                <td className="p-3.5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => toggleStatus(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      t.isActive
                        ? "bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/60"
                        : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60"
                    }`}
                  >
                    {t.isActive ? "تعلیق موقت" : "فعال‌سازی مجدد"}
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
              {editingTenant ? "ویرایش اطلاعات واحد آموزشی" : "ثبت و افتتاح واحد آموزشی جدید"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">نام مدرسه / مجتمع</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مجتمع آموزشی رازی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">کد شناسایی تننت</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-purple-400 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">شهر / منطقه</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">ظرفیت دانش‌آموز</label>
                  <input
                    type="number"
                    value={formData.studentsCount}
                    onChange={e => setFormData({ ...formData, studentsCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">تعداد ناوگان</label>
                  <input
                    type="number"
                    value={formData.driversCount}
                    onChange={e => setFormData({ ...formData, driversCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
                >
                  {editingTenant ? "ذخیره تغییرات" : "ثبت و ایجاد مدرسه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
