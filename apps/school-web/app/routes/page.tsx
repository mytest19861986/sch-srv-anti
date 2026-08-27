"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

interface RouteItem {
  id: string;
  name: string;
  code: string;
  stopsCount: number;
  studentsCount: number;
  driverName: string;
  status: string;
}

export default function RoutesPage() {
  const [search, setSearch] = useState("");
  const [routes, setRoutes] = useState<RouteItem[]>([
    { id: "route-1", name: "مسیر ۱ - ونک به سعادت‌آباد", code: "RT-VNK-1", stopsCount: 6, studentsCount: 18, driverName: "علی رضایی", status: "ACTIVE" },
    { id: "route-2", name: "مسیر ۲ - پاسداران به نیاوران", code: "RT-PSD-2", stopsCount: 5, studentsCount: 15, driverName: "حسین حسینی", status: "ACTIVE" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    stopsCount: 5,
    studentsCount: 15,
    driverName: "علی رضایی",
  });

  const handleOpenCreate = () => {
    setEditingRoute(null);
    setFormData({
      name: "",
      code: `RT-${Math.floor(100 + Math.random()*900)}`,
      stopsCount: 4,
      studentsCount: 12,
      driverName: "علی رضایی",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: RouteItem) => {
    setEditingRoute(r);
    setFormData({
      name: r.name,
      code: r.code,
      stopsCount: r.stopsCount,
      studentsCount: r.studentsCount,
      driverName: r.driverName,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این مسیر اطمینان دارید؟")) {
      setRoutes(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingRoute) {
      setRoutes(prev => prev.map(r => r.id === editingRoute.id ? { ...r, ...formData } : r));
    } else {
      const newRoute: RouteItem = {
        id: `route-${Date.now()}`,
        name: formData.name,
        code: formData.code,
        stopsCount: Number(formData.stopsCount),
        studentsCount: Number(formData.studentsCount),
        driverName: formData.driverName,
        status: "ACTIVE"
      };
      setRoutes(prev => [newRoute, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filtered = routes.filter(r => !search || r.name.includes(search) || r.code.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🗺️ مسیرها و ایستگاه‌های سرویس</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">تعریف خطوط تردد، ایستگاه‌های سوار/پیاده شدن و تخصیص ناوگان</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با نام مسیر یا کد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
          />
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <span>+ تعریف مسیر جدید</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(routes.length)} مسیر</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">عنوان مسیر</th>
              <th className="p-3.5">کد شناسایی</th>
              <th className="p-3.5">تعداد ایستگاه‌ها</th>
              <th className="p-3.5">دانش‌آموزان تحت پوشش</th>
              <th className="p-3.5">راننده مسئول</th>
              <th className="p-3.5">وضعیت خط</th>
              <th className="p-3.5">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{r.name}</td>
                <td className="p-3.5 font-mono text-purple-400">{r.code}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(r.stopsCount)} ایستگاه</td>
                <td className="p-3.5 font-mono text-emerald-400">{toPersianDigits(r.studentsCount)} نفر</td>
                <td className="p-3.5 text-slate-300">{r.driverName}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    فعال
                  </span>
                </td>
                <td className="p-3.5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(r)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
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
              {editingRoute ? "ویرایش خط سرویس" : "تعریف و ثبت مسیر سرویس جدید"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">نام و عنوان مسیر</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مسیر ۳ - سعادت‌آباد به مدرسه"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">کد مسیر</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-purple-400 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">تعداد ایستگاه‌ها</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.stopsCount}
                    onChange={e => setFormData({ ...formData, stopsCount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">راننده مسئول</label>
                <input
                  type="text"
                  value={formData.driverName}
                  onChange={e => setFormData({ ...formData, driverName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
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
                  {editingRoute ? "ذخیره تغییرات" : "ثبت مسیر جدید"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
