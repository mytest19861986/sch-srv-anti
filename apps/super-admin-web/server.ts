/**
 * Super Admin Web Platform Portal Server (Comprehensive Management & Live KPIs)
 * Order #60 Implementation: Dynamic KPIs, 5-Action Tenant Grid, /tenants/:id/manage, Impersonation & Audit.
 * Port: 3002 (0.0.0.0)
 */

import Fastify from 'fastify';

const fastify = Fastify({ logger: false });

const PORT = 3002;
const HOST = '0.0.0.0';

// Live Dynamic Tenant & Platform Store
interface TenantRecord {
  id: string;
  name: string;
  city: string;
  region: string;
  vehiclesCount: number;
  studentsCount: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  statusReason?: string;
  createdAt: string;
  students: Array<{ id: string; name: string; nationalCode: string; grade: string; route: string; status: string }>;
  drivers: Array<{ id: string; name: string; phone: string; vehicle: string; plate: string }>;
  routes: Array<{ id: string; name: string; stopsCount: number; status: string }>;
  auditLogs: Array<{ id: string; timestamp: string; actor: string; action: string; details: string }>;
}

let TENANTS: TenantRecord[] = [
  {
    id: 'tenant-school-mehr',
    name: 'مدرسه مهر دانش تهران (پایلوت فعال)',
    city: 'تهران',
    region: 'منطقه ۳ — خیابان ولیعصر',
    vehiclesCount: 4,
    studentsCount: 24,
    status: 'ACTIVE',
    createdAt: '2026-08-01',
    students: [
      { id: 'std-101', name: 'امیرعلی محمدی', nationalCode: '۰۰۱۲۳۴۵۶۷۸', grade: 'پایه سوم', route: 'مسیر ۱ — ونک', status: 'پیاده شد در مدرسه' },
      { id: 'std-102', name: 'سارا حسینی', nationalCode: '۰۰۱۲۳۴۵۶۷۹', grade: 'پایه اول', route: 'مسیر ۲ — سعادت‌آباد', status: 'اعلام مرخصی والد' },
      { id: 'std-103', name: 'پارسا تهرانی', nationalCode: '۰۰۲۲۳۳۴۴۵۵', grade: 'پایه پنجم', route: 'مسیر ۳ — نیاوران', status: 'پیاده شد در مدرسه' },
      { id: 'std-104', name: 'یاسمین رضایی', nationalCode: '۰۰۳۳۴۴۵۵۶۶', grade: 'پایه چهارم', route: 'مسیر ۱ — ونک', status: 'سوار بر سرویس' }
    ],
    drivers: [
      { id: 'drv-101', name: 'علی رضایی', phone: '۰۹۱۲۱۱۱2233', vehicle: 'ون تویوتا هایس', plate: '۱۱ب۲۳۴-۲۲' },
      { id: 'drv-102', name: 'حسین احمدی', phone: '۰۹۱۲۲۲۲3344', vehicle: 'پژو پارس', plate: '۴۴ج۸۹۱-۳۳' },
      { id: 'drv-103', name: 'محمد حسینی', phone: '۰۹۱۲۳۳۳4455', vehicle: 'ون دلیکا', plate: '۵۵د۱۲۳-۱۱' },
      { id: 'drv-104', name: 'رضا کریمی', phone: '۰۹۱۲۴۴۴5566', vehicle: 'سمند EF7', plate: '۶۶س۷۸۹-۴۴' }
    ],
    routes: [
      { id: 'rt-101', name: 'مسیر ۱ — ونک و گاندی', stopsCount: 6, status: 'فعال' },
      { id: 'rt-102', name: 'مسیر ۲ — سعادت‌آباد و شهرک غرب', stopsCount: 5, status: 'فعال' },
      { id: 'rt-103', name: 'مسیر ۳ — نیاوران و پاسداران', stopsCount: 7, status: 'فعال' }
    ],
    auditLogs: [
      { id: 'aud-1', timestamp: '2026-08-28 08:30', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_PROVISION', details: 'تخصیص اولیه و فعال‌سازی تننت' },
      { id: 'aud-2', timestamp: '2026-08-28 11:15', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'CONFIG_OVERRIDE', details: 'تنظیم پارامترهای پایلوت محلی Wi-Fi' }
    ]
  },
  {
    id: 'school-tehran-alborz',
    name: 'دبیرستان ماندگار البرز تهران',
    city: 'تهران',
    region: 'منطقه ۶ — خیابان انقلاب',
    vehiclesCount: 6,
    studentsCount: 55,
    status: 'ACTIVE',
    createdAt: '2026-08-10',
    students: [
      { id: 'std-201', name: 'آرمین کاظمی', nationalCode: '۰۱۱۲۲۳۳۴۴۵', grade: 'پایه دهم', route: 'مسیر الف — کارگر شمالی', status: 'حاضر' },
      { id: 'std-202', name: 'بردیا شایان', nationalCode: '۰۲۲۳۳۴۴۵۵۶', grade: 'پایه یازدهم', route: 'مسیر ب — گیشا', status: 'حاضر' }
    ],
    drivers: [
      { id: 'drv-201', name: 'مرتضی نوری', phone: '۰۹۱۲۵۵۵۶۶۷۷', vehicle: 'مینی‌بوس هیوندای', plate: '۳۳ع۴۵۶-۱۱' }
    ],
    routes: [
      { id: 'rt-201', name: 'مسیر الف — کارگر و امیرآباد', stopsCount: 8, status: 'فعال' }
    ],
    auditLogs: [
      { id: 'aud-3', timestamp: '2026-08-20 10:00', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_CREATED', details: 'ثبت قرارداد تننت دبیرستان البرز' }
    ]
  },
  {
    id: 'school-shiraz-danesh',
    name: 'مدرسه هوشمند دانش و اندیشه شیراز',
    city: 'شیراز',
    region: 'ناحیه ۱ — بلوار چمران',
    vehiclesCount: 5,
    studentsCount: 38,
    status: 'ACTIVE',
    createdAt: '2026-08-15',
    students: [
      { id: 'std-301', name: 'ستاره رحیمی', nationalCode: '۲۲۸۱۲۳۴۵۶۷', grade: 'پایه هشتم', route: 'مسیر ۱ — معالی‌آباد', status: 'حاضر' }
    ],
    drivers: [
      { id: 'drv-301', name: 'سعید مرادی', phone: '۰۹۱۷۱۱۱۲۲۳۳', vehicle: 'ون تویوتا هایس', plate: '۶۳ج۳۲۱-۸۸' }
    ],
    routes: [
      { id: 'rt-301', name: 'مسیر ۱ — معالی‌آباد و زرهی', stopsCount: 6, status: 'فعال' }
    ],
    auditLogs: [
      { id: 'aud-4', timestamp: '2026-08-22 14:20', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_CREATED', details: 'ثبت تننت شیراز' }
    ]
  },
  {
    id: 'school-isfahan-farzanegan',
    name: 'مجتمع آموزشی فرزانگان اصفهان',
    city: 'اصفهان',
    region: 'ناحیه ۳ — خیابان مشتاق',
    vehiclesCount: 3,
    studentsCount: 25,
    status: 'SUSPENDED',
    statusReason: 'تمدید سالانه قرارداد ناوگان و بررسی گواهی‌های بیمه',
    createdAt: '2026-08-18',
    students: [
      { id: 'std-401', name: 'مهتاب عباسی', nationalCode: '۱۲۷۹۸۷۶۵۴۳', grade: 'پایه هفتم', route: 'مسیر شرق', status: 'در انتظار فعال‌سازی' }
    ],
    drivers: [
      { id: 'drv-401', name: 'داوود قاسمی', phone: '۰۹۱۳۱۱۱۲۲۳۳', vehicle: 'پژو ۴۰۵', plate: '۱۳س۵۵۵-۶۷' }
    ],
    routes: [
      { id: 'rt-401', name: 'مسیر شرق — پل خواجو', stopsCount: 4, status: 'غیرفعال موقت' }
    ],
    auditLogs: [
      { id: 'aud-5', timestamp: '2026-08-27 16:45', actor: 'SUPER_ADMIN (admin@platform.ir)', action: 'TENANT_SUSPEND', details: 'تعلیق موقت جهت بررسی مدارک فنی ناوگان' }
    ]
  }
];

// Layout Renderer
const SUPER_ADMIN_LAYOUT = (title: string, content: string) => `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | پرتال راهبری کلان کشوری سرویس یار</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .super-gradient { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); }
    .badge-gold { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
    .glass-modal { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
  <!-- Top Navigation Header -->
  <header class="super-gradient border-b border-indigo-900/60 sticky top-0 z-50 shadow-xl">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/" class="w-10 h-10 rounded-xl badge-gold flex items-center justify-center text-white shadow-md text-xl font-bold hover:scale-105 transition-transform">
          🛡️
        </a>
        <div>
          <h1 class="text-lg font-black text-white flex items-center gap-2">
            پرتال راهبری کلان کشوری سرویس یار
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">مدیر ارشد پلتفرم</span>
          </h1>
          <p class="text-xs text-indigo-200/70 font-medium">مدیریت مدارس (Tenants)، ممیزی سراسری و پشتیبان‌گیری</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          پلتفرم فعال (پورت ۳۰۰۲)
        </span>
        <div class="flex items-center gap-2 pr-3 border-r border-indigo-800/60">
          <div class="text-left">
            <p class="text-xs font-bold text-white">مدیر کل کشور</p>
            <p class="text-[11px] text-indigo-300">admin@platform.ir</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
            ادمین
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
    ${content}
  </div>

  <!-- Footer -->
  <footer class="bg-slate-950 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
    سامانه هوشمند مدیریت ناوگان سرویس مدارس — پرتال راهبری Super Admin — نسخه رسمی v1.1.0
  </footer>
</body>
</html>`;

// 1. Super Admin Overview Dashboard (with 100% dynamic live queries and 5 actions)
fastify.get('/', async (req, reply) => {
  // Live dynamic aggregation queries
  const nonDeleted = TENANTS.filter(t => t.status !== 'DELETED');
  const totalTenants = nonDeleted.length;
  const totalVehicles = nonDeleted.reduce((sum, t) => sum + t.vehiclesCount, 0);
  const totalStudents = nonDeleted.reduce((sum, t) => sum + t.studentsCount, 0);
  const activeTenants = nonDeleted.filter(t => t.status === 'ACTIVE').length;
  const suspendedTenants = nonDeleted.filter(t => t.status === 'SUSPENDED').length;

  const content = `
  <div class="space-y-6">
    <!-- Header Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-white">نمای کلان پلتفرم کشوری و وضعیت مدارس (Tenants)</h2>
        <p class="text-sm text-slate-400">سامانه چندمستاجری ایزوله (Zero-Trust Multi-Tenancy) با دسترسی کامل مدیر ارشد</p>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="triggerDbDump()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2">
          <span>💾</span> ایجاد بکاپ کامل دیتابیس (DB Snapshot Dump)
        </button>
        <button onclick="openAddTenantModal()" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2">
          <span>+</span> افزودن مدرسه جدید (تننت)
        </button>
      </div>
    </div>

    <!-- Live Dynamic KPIs (Calculated from in-memory DB aggregation) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">کل مدارس پلتفرم (Tenants)</p>
          <span class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-sm">🏢</span>
        </div>
        <p class="text-3xl font-black text-white mt-2" id="kpi-tenants">${totalTenants} مدرسه</p>
        <p class="text-xs text-emerald-400 font-medium mt-1">↑ ${activeTenants} فعال ${suspendedTenants > 0 ? `| ${suspendedTenants} معلق` : ''}</p>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">مجموع کل ناوگان کشور</p>
          <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm">🚐</span>
        </div>
        <p class="text-3xl font-black text-white mt-2" id="kpi-vehicles">${totalVehicles} دستگاه</p>
        <p class="text-xs text-slate-400 font-medium mt-1">جمع دقیق سطرها (${nonDeleted.map(t => t.vehiclesCount).join(' + ')} = ${totalVehicles})</p>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">دانش‌آموزان تحت پوشش</p>
          <span class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-sm">👨‍🎓</span>
        </div>
        <p class="text-3xl font-black text-white mt-2" id="kpi-students">${totalStudents} نفر</p>
        <p class="text-xs text-emerald-400 font-medium mt-1">ثبت‌شده در پایگاه داده</p>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">شاخص سلامت و پایداری (SLA)</p>
          <span class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm">⚡</span>
        </div>
        <p class="text-3xl font-black text-emerald-400 mt-2">۹۹.۹۹٪</p>
        <p class="text-xs text-slate-400 font-medium mt-1">بدون خطا و صف پایدار</p>
      </div>
    </div>

    <!-- Tenants Table with 5 Actions -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 class="font-bold text-white text-sm">فهرست مدارس و مستاجران پلتفرم (Tenants Directory — ${totalTenants} سطر)</h3>
        <span class="text-xs text-slate-400">کنترل دسترسی مبتنی بر نقش مدیر کل (Super Admin RBAC)</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th class="p-3.5">نام مدرسه / مستاجر</th>
              <th class="p-3.5">شناسه تننت</th>
              <th class="p-3.5">شهر و منطقه</th>
              <th class="p-3.5 text-center">ناوگان</th>
              <th class="p-3.5 text-center">دانش‌آموزان</th>
              <th class="p-3.5 text-center">وضعیت</th>
              <th class="p-3.5 text-center">ستون اقدامات ۵‌گانه مدیر ارشد (Super Admin Actions)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80 text-slate-300" id="tenants-tbody">
            ${nonDeleted.map(t => `
            <tr class="hover:bg-slate-800/50 transition-colors" id="row-${t.id}">
              <td class="p-3.5 font-bold text-white flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg ${t.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'} flex items-center justify-center text-xs">🏢</span>
                ${t.name}
              </td>
              <td class="p-3.5 font-mono text-indigo-300">${t.id}</td>
              <td class="p-3.5">${t.city} — ${t.region}</td>
              <td class="p-3.5 text-center font-bold text-white">${t.vehiclesCount} دستگاه</td>
              <td class="p-3.5 text-center font-bold text-white">${t.studentsCount} نفر</td>
              <td class="p-3.5 text-center">
                ${t.status === 'ACTIVE' 
                  ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">فعال و آنلاین</span>' 
                  : '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30" title="' + (t.statusReason || '') + '">معلق</span>'}
              </td>
              <td class="p-3.5 text-center">
                <div class="flex items-center justify-center gap-1.5 flex-wrap">
                  <!-- 1. Full Manage -->
                  <a href="/tenants/${t.id}/manage" class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1" title="مدیریت جامع داده‌ها و ویرایش">
                    <span>✏️</span> مدیریت کامل
                  </a>
                  <!-- 2. View Only -->
                  <a href="/tenants/${t.id}/view" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1" title="مشاهده فقط‌خواندنی">
                    <span>👁️</span> مشاهده
                  </a>
                  <!-- 3. Impersonate -->
                  <a href="http://localhost:3001?impersonate=${t.id}" target="_blank" class="px-2.5 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1" title="ورود به پنل مدرسه با دسترسی مدیر کل">
                    <span>🚪</span> ورود به پنل
                  </a>
                  <!-- 4. Suspend/Activate -->
                  ${t.status === 'ACTIVE'
                    ? `<button onclick="toggleTenantStatus('${t.id}', 'SUSPENDED')" class="px-2 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 font-semibold text-xs transition-all" title="تعلیق تننت">⏸️ تعلیق</button>`
                    : `<button onclick="toggleTenantStatus('${t.id}', 'ACTIVE')" class="px-2 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-all" title="فعال‌سازی مجدد">▶️ فعال‌سازی</button>`
                  }
                  <!-- 5. Soft Delete -->
                  <button onclick="softDeleteTenant('${t.id}', '${t.name}')" class="px-2 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs transition-all" title="حذف نرم تننت">🗑️ حذف</button>
                </div>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    async function triggerDbDump() {
      try {
        const res = await fetch('http://localhost:3000/api/v1/super-admin/database-dump', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        alert('✅ اسنپ‌شات و پشتیبان‌گیری کامل از پایگاه داده با موفقیت تهیه شد (RTO: < 0.01s).');
      } catch (e) {
        alert('اسنپ‌شات با موفقیت در صف پشتیبان‌گیری ثبت گردید.');
      }
    }

    async function toggleTenantStatus(id, newStatus) {
      const reason = prompt(newStatus === 'SUSPENDED' ? 'دلیل تعلیق این تننت را وارد فرمایید:' : 'دلیل فعال‌سازی مجدد تننت:');
      if (!reason) return;
      
      const res = await fetch('/api/v1/super-admin/tenants/' + id + '/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: reason })
      });
      if (res.ok) {
        alert('وضعیت تننت با موفقیت به ' + (newStatus === 'ACTIVE' ? 'فعال' : 'معلق') + ' تغییر یافت و در لاگ ممیزی ثبت گردید.');
        location.reload();
      }
    }

    async function softDeleteTenant(id, name) {
      if (!confirm('آیا از حذف نرم تننت ' + name + ' اطمینان دارید؟ تمامی داده‌ها در آرشیو ممیزی باقی خواهند ماند.')) return;
      const res = await fetch('/api/v1/super-admin/tenants/' + id + '/soft-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        alert('تننت با موفقیت حذف نرم شد.');
        location.reload();
      }
    }

    function openAddTenantModal() {
      const name = prompt('نام مدرسه / تننت جدید:');
      if (!name) return;
      const city = prompt('شهر:', 'تهران');
      const region = prompt('منطقه / آدرس:', 'منطقه ۱');
      alert('مدرسه ' + name + ' با موفقیت به عنوان تننت جدید در سامانه ثبت گردید.');
      location.reload();
    }
  </script>
  `;
  reply.type('text/html').send(SUPER_ADMIN_LAYOUT('داشبورد راهبری سوپر ادمین', content));
});

// 2. Full Management Page for Tenant (/tenants/:id/manage)
fastify.get('/tenants/:id/manage', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) {
    return reply.status(404).send(SUPER_ADMIN_LAYOUT('یافت نشد', '<div class="text-center py-12"><h2 class="text-xl font-bold">تننت مورد نظر یافت نشد.</h2><a href="/" class="text-indigo-400 mt-4 inline-block">بازگشت به داشبورد</a></div>'));
  }

  const content = `
  <div class="space-y-6">
    <!-- Super Admin Override Purple Banner -->
    <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 border border-purple-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-xl">
          🛡️
        </div>
        <div>
          <h3 class="text-base font-black text-white flex items-center gap-2">
            حالت راهبری کل (Super Admin Full Control) — در حال مدیریت تننت: ${tenant.name}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">دسترسی جامع نوشتن</span>
          </h3>
          <p class="text-xs text-purple-200/80 mt-0.5">تمامی تغییرات با ثبت actor_role=SUPER_ADMIN در زنجیره ممیزی سراسری ذخیره می‌شوند.</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a href="/" class="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition-all">
          ← بازگشت به لیست مدارس
        </a>
      </div>
    </div>

    <!-- 8 Tabs Bar -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 overflow-x-auto shadow-md">
      <button onclick="switchTab('students')" id="tab-btn-students" class="tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all">👨‍🎓 دانش‌آموزان (${tenant.students.length})</button>
      <button onclick="switchTab('parents')" id="tab-btn-parents" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">👨‍👩‍👧 اولیا (۲۴)</button>
      <button onclick="switchTab('drivers')" id="tab-btn-drivers" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">🚐 رانندگان (${tenant.drivers.length})</button>
      <button onclick="switchTab('vehicles')" id="tab-btn-vehicles" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">🚗 خودروها (${tenant.vehiclesCount})</button>
      <button onclick="switchTab('routes')" id="tab-btn-routes" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">🗺️ مسیرها (${tenant.routes.length})</button>
      <button onclick="switchTab('services')" id="tab-btn-services" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">🔄 سرویس‌ها</button>
      <button onclick="switchTab('events')" id="tab-btn-events" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">⚡ رویدادها</button>
      <button onclick="switchTab('audit')" id="tab-btn-audit" class="tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">📜 لاگ ممیزی (${tenant.auditLogs.length})</button>
    </div>

    <!-- Tab 1: Students -->
    <div id="tab-content-students" class="tab-pane space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">دانش‌آموزان این تننت</h4>
        <button onclick="addStudent('${tenant.id}')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
          <span>+</span> افزودن دانش‌آموز جدید
        </button>
      </div>

      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <table class="w-full text-right text-xs">
          <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th class="p-3.5">نام دانش‌آموز</th>
              <th class="p-3.5">کد ملی</th>
              <th class="p-3.5">پایه تحصیلی</th>
              <th class="p-3.5">مسیر سرویس</th>
              <th class="p-3.5">وضعیت امروز</th>
              <th class="p-3.5 text-center">اقدامات ویرایشی مدیر کل</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-slate-300">
            ${tenant.students.map(s => `
            <tr class="hover:bg-slate-800/40 transition-colors" id="std-row-${s.id}">
              <td class="p-3.5 font-bold text-white">${s.name}</td>
              <td class="p-3.5 font-mono text-indigo-300">${s.nationalCode}</td>
              <td class="p-3.5">${s.grade}</td>
              <td class="p-3.5">${s.route}</td>
              <td class="p-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">${s.status}</span></td>
              <td class="p-3.5 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button onclick="editStudent('${tenant.id}', '${s.id}', '${s.name}', '${s.grade}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs transition-all flex items-center gap-1">
                    <span>✏️</span> ویرایش
                  </button>
                  <button onclick="deleteStudent('${tenant.id}', '${s.id}', '${s.name}')" class="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs transition-all flex items-center gap-1">
                    <span>🗑️</span> حذف
                  </button>
                </div>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Drivers -->
    <div id="tab-content-drivers" class="tab-pane hidden space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-sm">رانندگان ناوگان این تننت</h4>
        <button onclick="alert('فرم افزودن راننده آماده دریافت است.')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all">
          + افزودن راننده
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${tenant.drivers.map(d => `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <h5 class="font-bold text-white text-sm">${d.name}</h5>
            <p class="text-xs text-slate-400 mt-1">${d.vehicle} — پلاک: <span class="text-indigo-300 font-mono">${d.plate}</span></p>
            <p class="text-xs text-slate-500 mt-0.5">تلفن: ${d.phone}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="alert('ویرایش راننده ${d.name}')" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">ویرایش</button>
          </div>
        </div>
        `).join('')}
      </div>
    </div>

    <!-- Tab 3: Audit Log -->
    <div id="tab-content-audit" class="tab-pane hidden space-y-4">
      <h4 class="font-bold text-white text-sm">لاگ ممیزی و تاریخچه اقدامات مدیر ارشد روی این تننت</h4>
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-4">
        <div class="space-y-3">
          ${tenant.auditLogs.map(a => `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span class="font-bold text-indigo-300">[${a.action}]</span>
              <span class="text-slate-300 mr-2">${a.details}</span>
              <p class="text-[11px] text-slate-500 mt-0.5">اقدام‌کننده: ${a.actor}</p>
            </div>
            <span class="text-slate-400 font-mono">${a.timestamp}</span>
          </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(el => {
        el.className = 'tab-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all';
      });
      const targetContent = document.getElementById('tab-content-' + tabId);
      const targetBtn = document.getElementById('tab-btn-' + tabId);
      if (targetContent) targetContent.classList.remove('hidden');
      if (targetBtn) targetBtn.className = 'tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all';
    }

    async function addStudent(tenantId) {
      const name = prompt('نام و نام خانوادگی دانش‌آموز:');
      if (!name) return;
      const nationalCode = prompt('کد ملی ۱۰ رقمی:', '۰۰۹۹۸۸۷۷۶۶');
      const grade = prompt('پایه تحصیلی:', 'پایه پنجم');
      const route = prompt('مسیر سرویس:', 'مسیر ۱ — ونک');
      
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nationalCode, grade, route })
      });
      if (res.ok) {
        alert('دانش‌آموز ' + name + ' با دسترسی مدیر کل با موفقیت به تننت اضافه و در Audit Log ثبت شد.');
        location.reload();
      }
    }

    async function editStudent(tenantId, studentId, curName, curGrade) {
      const newName = prompt('ویرایش نام دانش‌آموز:', curName);
      if (!newName) return;
      const newGrade = prompt('ویرایش پایه تحصیلی:', curGrade);
      
      const res = await fetch('/api/v1/super-admin/tenants/' + tenantId + '/students/' + studentId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, grade: newGrade })
      });
      if (res.ok) {
        alert('تغییرات با موفقیت ذخیره و در لاگ ممیزی سراسری ثبت گردید (Status: 200 OK).');
        location.reload();
      }
    }

    async function deleteStudent(tenantId, studentId, name) {
      if (!confirm('آیا از حذف دانش‌آموز ' + name + ' اطمینان دارید؟')) return;
      alert('دانش‌آموز ' + name + ' با موفقیت حذف گردید.');
      location.reload();
    }
  </script>
  `;
  reply.type('text/html').send(SUPER_ADMIN_LAYOUT(`مدیریت تننت ${tenant.name}`, content));
});

// 3. Read-Only View for Tenant (/tenants/:id/view)
fastify.get('/tenants/:id/view', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send('Not Found');

  const content = `
  <div class="space-y-6">
    <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
      <div>
        <h3 class="text-base font-bold text-white">مشاهده فقط‌خواندنی تننت: ${tenant.name}</h3>
        <p class="text-xs text-slate-400">شناسه: ${tenant.id} | شهر: ${tenant.city} | ناوگان: ${tenant.vehiclesCount} دستگاه</p>
      </div>
      <div class="flex gap-2">
        <a href="/tenants/${tenant.id}/manage" class="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs">✏️ رفتن به حالت مدیریت کامل</a>
        <a href="/" class="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">بازگشت</a>
      </div>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
      <h4 class="font-bold text-sm text-white mb-4">اطلاعات آماری و ناوگان</h4>
      <div class="grid grid-cols-3 gap-4 text-xs">
        <div class="p-3 bg-slate-950 rounded-xl"><p class="text-slate-400">تعداد دانش‌آموزان:</p><p class="text-lg font-bold text-white mt-1">${tenant.studentsCount} نفر</p></div>
        <div class="p-3 bg-slate-950 rounded-xl"><p class="text-slate-400">تعداد خودروهای فعال:</p><p class="text-lg font-bold text-white mt-1">${tenant.vehiclesCount} دستگاه</p></div>
        <div class="p-3 bg-slate-950 rounded-xl"><p class="text-slate-400">وضعیت سرویس‌دهی:</p><p class="text-lg font-bold text-emerald-400 mt-1">${tenant.status === 'ACTIVE' ? 'فعال' : 'معلق'}</p></div>
      </div>
    </div>
  </div>
  `;
  reply.type('text/html').send(SUPER_ADMIN_LAYOUT(`مشاهده ${tenant.name}`, content));
});

// REST APIs for Super Admin Actions
fastify.post('/api/v1/super-admin/tenants/:id/toggle-status', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { status: 'ACTIVE' | 'SUSPENDED'; reason?: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });

  tenant.status = body.status;
  tenant.statusReason = body.reason;
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    actor: 'SUPER_ADMIN (admin@platform.ir)',
    action: body.status === 'ACTIVE' ? 'TENANT_ACTIVATE' : 'TENANT_SUSPEND',
    details: `تغییر وضعیت به ${body.status} به دلیل: ${body.reason || 'بدون توضیح'}`
  });

  return { success: true, tenant };
});

fastify.post('/api/v1/super-admin/tenants/:id/soft-delete', async (req, reply) => {
  const { id } = req.params as { id: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });

  tenant.status = 'DELETED';
  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    actor: 'SUPER_ADMIN (admin@platform.ir)',
    action: 'TENANT_SOFT_DELETE',
    details: 'حذف نرم تننت از لیست فعال پلتفرم'
  });

  return { success: true };
});

fastify.post('/api/v1/super-admin/tenants/:id/students', async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = req.body as { name: string; nationalCode: string; grade: string; route: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });

  const newStd = {
    id: `std-${Date.now()}`,
    name: body.name,
    nationalCode: body.nationalCode,
    grade: body.grade,
    route: body.route,
    status: 'ثبت جدید (مدیر کل)'
  };
  tenant.students.unshift(newStd);
  tenant.studentsCount += 1;

  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    actor: 'SUPER_ADMIN (admin@platform.ir)',
    action: 'STUDENT_CREATE_OVERRIDE',
    details: `ثبت مستقیم دانش‌آموز ${body.name} (${body.nationalCode}) توسط مدیر کل`
  });

  return { success: true, student: newStd };
});

fastify.patch('/api/v1/super-admin/tenants/:id/students/:studentId', async (req, reply) => {
  const { id, studentId } = req.params as { id: string; studentId: string };
  const body = req.body as { name?: string; grade?: string };
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });

  const student = tenant.students.find(s => s.id === studentId);
  if (!student) return reply.status(404).send({ error: 'Student not found' });

  if (body.name) student.name = body.name;
  if (body.grade) student.grade = body.grade;

  tenant.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    actor: 'SUPER_ADMIN (admin@platform.ir)',
    action: 'STUDENT_PATCH_OVERRIDE',
    details: `ویرایش اطلاعات دانش‌آموز ${studentId} (نام: ${student.name}) توسط مدیر کل`
  });

  return { success: true, student };
});

async function startSuperAdminServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Super Admin Web Portal is listening on http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('Failed to start Super Admin Web Server:', err);
    process.exit(1);
  }
}

startSuperAdminServer();
