"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  capacity: number;
  driverName: string;
  status: string;
}

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: "veh-1", model: "تویوتا ون هایس ۱۴ نفره", plate: "۷۷ ب ۹۴۱ ایران ۴۴", capacity: 14, driverName: "علی رضایی", status: "ACTIVE" },
    { id: "veh-2", model: "مینی‌بوس هیوندای کروس", plate: "۲۲ ج ۳۳۳ ایران ۳۳", capacity: 18, driverName: "حسین حسینی", status: "ACTIVE" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    model: "",
    plate: "",
    capacity: 14,
    driverName: "علی رضایی",
  });

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setFormData({
      model: "ون تویوتا هایس",
      plate: "۳۴ د ۵۶۷ ایران ۲۲",
      capacity: 14,
      driverName: "علی رضایی",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      model: v.model,
      plate: v.plate,
      capacity: v.capacity,
      driverName: v.driverName,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این خودرو از سامانه اطمینان دارید؟")) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model || !formData.plate) return;

    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...formData, capacity: Number(formData.capacity) } : v));
    } else {
      const newVeh: Vehicle = {
        id: `veh-${Date.now()}`,
        model: formData.model,
        plate: formData.plate,
        capacity: Number(formData.capacity),
        driverName: formData.driverName,
        status: "ACTIVE"
      };
      setVehicles(prev => [newVeh, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filtered = vehicles.filter(v => !search || v.model.includes(search) || v.plate.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🚐 ناوگان خودرویی واحد آموزشی</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت اطلاعات وسایل نقلیه، ظرفیت مجاز و وضعیت معاینه فنی</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با پلاک یا مدل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
          />
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <span>+ ثبت خودرو جدید</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(vehicles.length)} دستگاه</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نوع و مدل خودرو</th>
              <th className="p-3.5">پلاک انتظامی</th>
              <th className="p-3.5">ظرفیت مسافر</th>
              <th className="p-3.5">راننده تحویل‌گیرنده</th>
              <th className="p-3.5">وضعیت بهره‌برداری</th>
              <th className="p-3.5">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{v.model}</td>
                <td className="p-3.5 font-mono text-emerald-400">{v.plate}</td>
                <td className="p-3.5 font-mono text-slate-300">{toPersianDigits(v.capacity)} صندلی</td>
                <td className="p-3.5 text-slate-300">{v.driverName}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    آماده به کار
                  </span>
                </td>
                <td className="p-3.5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
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
              {editingVehicle ? "ویرایش مشخصات خودرو" : "افزودن وسیله نقلیه به ناوگان"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">نوع و مدل خودرو</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  placeholder="مثال: ون فیات دوکاتو"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">پلاک انتظامی</label>
                  <input
                    type="text"
                    required
                    value={formData.plate}
                    onChange={e => setFormData({ ...formData, plate: e.target.value })}
                    placeholder="۱۲ ب ۳۴۵ ایران ۱۱"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ظرفیت مسافر</label>
                  <input
                    type="number"
                    min="4"
                    max="50"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">راننده پیش‌فرض</label>
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
                  {editingVehicle ? "ذخیره تغییرات" : "افزودن به ناوگان"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
