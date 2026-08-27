"use client";

import React, { useState } from "react";
import { toPersianDigits } from "../../utils/i18n";

interface Driver {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  licenseNo: string;
  vehicleModel: string;
  vehiclePlate: string;
  activeRoute: string;
  status: string;
}

export default function DriversPage() {
  const [search, setSearch] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([
    { id: "drv-1", fullName: "علی رضایی", phone: "۰۹۱۲۱۱۱۲۲۳۳", email: "driver@demo.ir", licenseNo: "ب-۹۸۷۶۵۴۳۲", vehicleModel: "ون هایس", vehiclePlate: "۷۷ ب ۹۴۱ ایران ۴۴", activeRoute: "مسیر ۱ - ونک", status: "ACTIVE" },
    { id: "drv-2", fullName: "حسین حسینی", phone: "۰۹۱۲۳۳۳۴۴۵۵", email: "driver2@demo.ir", licenseNo: "ب-۱۲۳۴۵۶۷۸", vehicleModel: "مینی‌بوس هیوندای", vehiclePlate: "۲۲ ج ۳۳۳ ایران ۳۳", activeRoute: "مسیر ۲ - پاسداران", status: "ACTIVE" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    licenseNo: "",
    vehicleModel: "ون تویوتا هایس",
    vehiclePlate: "۱۲ ب ۳۴۵ ایران ۱۱",
    activeRoute: "مسیر ۱ - ونک",
  });

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setFormData({
      fullName: "",
      phone: "0912",
      licenseNo: `پ-${Math.floor(100000 + Math.random()*900000)}`,
      vehicleModel: "ون تویوتا هایس",
      vehiclePlate: "۱۲ ب ۳۴۵ ایران ۱۱",
      activeRoute: "مسیر ۱ - ونک",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setFormData({
      fullName: d.fullName,
      phone: d.phone,
      licenseNo: d.licenseNo,
      vehicleModel: d.vehicleModel,
      vehiclePlate: d.vehiclePlate,
      activeRoute: d.activeRoute,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این راننده از ناوگان فعال اطمینان دارید؟")) {
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) return;

    if (editingDriver) {
      setDrivers(prev => prev.map(d => d.id === editingDriver.id ? { ...d, ...formData } : d));
    } else {
      const newDriver: Driver = {
        id: `drv-${Date.now()}`,
        fullName: formData.fullName,
        phone: formData.phone,
        email: `driver.${formData.phone.slice(-4)}@demo.ir`,
        licenseNo: formData.licenseNo,
        vehicleModel: formData.vehicleModel,
        vehiclePlate: formData.vehiclePlate,
        activeRoute: formData.activeRoute,
        status: "ACTIVE"
      };
      setDrivers(prev => [newDriver, ...prev]);
    }
    setIsModalOpen(false);
  };

  const filtered = drivers.filter(d => !search || d.fullName.includes(search) || d.phone.includes(search));

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🚗 رانندگان مجاز ناوگان</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت اطلاعات هویتی، گواهینامه و تخصیص مسیر رانندگان مدرسه</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="جستجو با نام راننده..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
          />
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <span>+ استخدام و ثبت راننده</span>
          </button>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-2 rounded-xl">
            مجموع: <span className="text-emerald-400 font-bold">{toPersianDigits(drivers.length)} راننده</span>
          </span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">نام راننده</th>
              <th className="p-3.5">شماره همراه</th>
              <th className="p-3.5">شماره گواهینامه</th>
              <th className="p-3.5">خودروی تخصیص‌یافته</th>
              <th className="p-3.5">پلاک</th>
              <th className="p-3.5">مسیر فعال</th>
              <th className="p-3.5">وضعیت</th>
              <th className="p-3.5">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-white">{d.fullName}</td>
                <td className="p-3.5 font-mono text-slate-300">{d.phone}</td>
                <td className="p-3.5 font-mono text-slate-400">{d.licenseNo}</td>
                <td className="p-3.5 text-slate-300">{d.vehicleModel}</td>
                <td className="p-3.5 font-mono text-emerald-400">{d.vehiclePlate}</td>
                <td className="p-3.5 text-slate-300">{d.activeRoute}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    فعال
                  </span>
                </td>
                <td className="p-3.5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
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
              {editingDriver ? "ویرایش پرونده راننده" : "ثبت راننده جدید در ناوگان مدرسه"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">نام و نام خانوادگی راننده</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: کاظم مرادی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">شماره همراه</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">شماره گواهینامه</label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNo}
                    onChange={e => setFormData({ ...formData, licenseNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">مدل خودروی تخصیص یافته</label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">پلاک خودرو</label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">مسیر سرویس</label>
                  <select
                    value={formData.activeRoute}
                    onChange={e => setFormData({ ...formData, activeRoute: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 outline-none"
                  >
                    <option value="مسیر ۱ - ونک">مسیر ۱ - ونک</option>
                    <option value="مسیر ۲ - پاسداران">مسیر ۲ - پاسداران</option>
                    <option value="مسیر ۳ - سعادت‌آباد">مسیر ۳ - سعادت‌آباد</option>
                  </select>
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
                  {editingDriver ? "ذخیره تغییرات" : "ثبت و صدور دسترسی راننده"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
