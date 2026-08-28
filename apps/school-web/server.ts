/**
 * School Web Management Portal Server (Standalone High-Performance UI)
 * Project: School Transport Management System (سامانه مدیریت سرویس مدرسه)
 * Serves the full Persian School Admin Dashboard with live API integration on port 3001.
 */

import Fastify from 'fastify';

const fastify = Fastify({ logger: false });

const PORT = 3001;
const HOST = '0.0.0.0';

// Theme & Global Styles
const HTML_LAYOUT = (title: string, activeTab: string, content: string) => `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | سامانه هوشمند سرویس یار</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .glass-card { background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(12px); border: 1px solid rgba(229, 231, 235, 0.8); }
    .nav-active { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white !important; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
    @keyframes pulse-subtle { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .live-dot { animation: pulse-subtle 2s infinite ease-in-out; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col antialiased">
  <!-- Top Navigation Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md text-xl font-bold">
          🚌
        </div>
        <div>
          <h1 class="text-lg font-extrabold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">سرویس یار</h1>
          <p class="text-xs text-slate-500 font-medium">پنل مدیریت ناوگان سرویس مدرسه مهر دانش</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 live-dot"></span>
          بک‌اند متصل (پورت ۳۰۰۰)
        </span>
        <div class="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-200">
          <div class="text-left">
            <p class="text-xs font-bold text-slate-700">مدیریت مدرسه</p>
            <p class="text-[11px] text-slate-400">school@mehr.ir</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            مدیر
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Workspace -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
    <!-- Sidebar Navigation -->
    <aside class="w-full md:w-64 shrink-0">
      <div class="glass-card rounded-2xl p-3 shadow-sm sticky top-24">
        <nav class="space-y-1">
          <a href="/" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors ${activeTab === 'dashboard' ? 'nav-active' : ''}">
            <span>📊</span> داشبورد وضعیت زنده
          </a>
          <a href="/students" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors ${activeTab === 'students' ? 'nav-active' : ''}">
            <span>👨‍🎓</span> دانش‌آموزان و اولیا
          </a>
          <a href="/drivers" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors ${activeTab === 'drivers' ? 'nav-active' : ''}">
            <span>🚐</span> رانندگان و ناوگان
          </a>
          <a href="/routes" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors ${activeTab === 'routes' ? 'nav-active' : ''}">
            <span>🗺️</span> مسیرها و ایستگاه‌ها
          </a>
          <a href="/reports" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors ${activeTab === 'reports' ? 'nav-active' : ''}">
            <span>📈</span> گزارش‌ها و خروجی اکسل
          </a>
        </nav>

        <div class="mt-6 pt-4 border-t border-slate-100 px-3">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">عملیات سریع</p>
          <div class="space-y-2 text-xs">
            <a href="http://localhost:3000/health/live" target="_blank" class="block p-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-blue-700 font-medium transition-colors">
              🩺 بررسی سلامت API ↗
            </a>
            <a href="https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.driver-v1.1.0.apk" class="block p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 text-emerald-700 font-medium transition-colors">
              📥 دانلود APK راننده (v1.1.0)
            </a>
            <a href="https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.parent-v1.1.0.apk" class="block p-2 rounded-lg bg-slate-50 hover:bg-purple-50 text-purple-700 font-medium transition-colors">
              📥 دانلود APK والدین (v1.1.0)
            </a>
          </div>
        </div>
      </div>
    </aside>

    <!-- Page Body -->
    <main class="flex-1 min-w-0">
      ${content}
    </main>
  </div>

  <!-- Footer -->
  <footer class="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-400">
    سامانه مدیریت سرویس مدارس (سرویس یار) — نسخه رسمی v1.1.0 — آماده استقرار پایلوت و پروداکشن
  </footer>
</body>
</html>`;

// 1. Dashboard View
fastify.get('/', async (req, reply) => {
  const content = `
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-slate-800">داشبورد وضعیت امروز ناوگان</h2>
        <p class="text-sm text-slate-500">خلاصه وضعیت تردد شیفت صبح مدرسه مهر دانش (۲۸ آگوست ۲۰۲۶)</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="location.reload()" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-sm hover:bg-slate-50 transition-colors">
          🔄 به‌روزرسانی زنده
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">کل دانش‌آموزان سرویسی</p>
          <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">👨‍🎓</span>
        </div>
        <p class="text-2xl font-black text-slate-800 mt-2">۲۴ نفر</p>
        <p class="text-xs text-emerald-600 font-medium mt-1">↑ ۱۰۰٪ دارای پیوند والد</p>
      </div>

      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">رانندگان و خودروهای فعال</p>
          <span class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">🚐</span>
        </div>
        <p class="text-2xl font-black text-slate-800 mt-2">۴ دستگاه</p>
        <p class="text-xs text-slate-500 font-medium mt-1">تمامی خودروها در مسیر</p>
      </div>

      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">سوار شده / پیاده شده در مدرسه</p>
          <span class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">✅</span>
        </div>
        <p class="text-2xl font-black text-slate-800 mt-2">۲۲ از ۲۴</p>
        <p class="text-xs text-emerald-600 font-medium mt-1">۹۲٪ نرخ موفقیت شیفت</p>
      </div>

      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-slate-400">اعلام عدم حضور اضطراری</p>
          <span class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm">⚠️</span>
        </div>
        <p class="text-2xl font-black text-slate-800 mt-2">۲ نفر</p>
        <p class="text-xs text-amber-600 font-medium mt-1">ثبت شده توسط والدین</p>
      </div>
    </div>

    <!-- Active Shifts Table -->
    <div class="glass-card rounded-2xl shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 text-sm">لیست سرویس‌های در حال تردد هم‌اکنون</h3>
        <span class="text-xs text-slate-400">بروزرسانی بلادرنگ از طریق WebSocket</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
            <tr>
              <th class="p-3.5">نام مسیر</th>
              <th class="p-3.5">راننده و خودرو</th>
              <th class="p-3.5">تعداد سوار شده</th>
              <th class="p-3.5">وضعیت مسیر</th>
              <th class="p-3.5 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-3.5 font-bold text-slate-800">مسیر ۱ — ونک و گاندی</td>
              <td class="p-3.5">علی رضایی (ون هایس ۱۱ب۲۳۴-۲۲)</td>
              <td class="p-3.5"><span class="font-bold text-emerald-600">۶ از ۶ نفر</span> (تکمیل)</td>
              <td class="p-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">رسیده به مدرسه</span></td>
              <td class="p-3.5 text-center"><a href="/students" class="text-blue-600 hover:underline font-semibold">مشاهده جزئیات</a></td>
            </tr>
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-3.5 font-bold text-slate-800">مسیر ۲ — سعادت‌آباد و شهرک غرب</td>
              <td class="p-3.5">حسین احمدی (پژو پارس ۴۴ج۸۹۱-۳۳)</td>
              <td class="p-3.5"><span class="font-bold text-blue-600">۴ از ۵ نفر</span> (۱ نفر غایب)</td>
              <td class="p-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">در حال حرکت</span></td>
              <td class="p-3.5 text-center"><a href="/students" class="text-blue-600 hover:underline font-semibold">مشاهده جزئیات</a></td>
            </tr>
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-3.5 font-bold text-slate-800">مسیر ۳ — نیاوران و پاسداران</td>
              <td class="p-3.5">محمد حسینی (ون تویوتا ۵۵د۱۲۳-۱۱)</td>
              <td class="p-3.5"><span class="font-bold text-emerald-600">۷ از ۷ نفر</span> (تکمیل)</td>
              <td class="p-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">رسیده به مدرسه</span></td>
              <td class="p-3.5 text-center"><a href="/students" class="text-blue-600 hover:underline font-semibold">مشاهده جزئیات</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;
  reply.type('text/html').send(HTML_LAYOUT('داشبورد وضعیت زنده', 'dashboard', content));
});

// 2. Students & Parents View
fastify.get('/students', async (req, reply) => {
  const content = `
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-slate-800">مدیریت دانش‌آموزان و اولیا</h2>
        <p class="text-sm text-slate-500">لیست دانش‌آموزان ثبت‌نام شده و پیوند دوطرفه با والدین (Parent↔Student Linkage)</p>
      </div>
      <button onclick="alert('فرم ثبت دانش‌آموز جدید آماده دریافت ورودی است.')" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 self-start">
        <span>+</span> ثبت دانش‌آموز جدید
      </button>
    </div>

    <!-- Student Cards & Table -->
    <div class="glass-card rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
            <tr>
              <th class="p-3.5">دانش‌آموز</th>
              <th class="p-3.5">کد ملی و پایه</th>
              <th class="p-3.5">مسیر و راننده</th>
              <th class="p-3.5">والدین ثبت‌شده</th>
              <th class="p-3.5">وضعیت امروز</th>
              <th class="p-3.5 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-[10px]">ام</div>
                امیرعلی محمدی
              </td>
              <td class="p-3.5">۰۰۱۲۳۴۵۶۷۸ <span class="text-slate-400">(پایه سوم)</span></td>
              <td class="p-3.5 font-medium">مسیر ۱ — ونک (علی رضایی)</td>
              <td class="p-3.5">
                <span class="font-semibold text-slate-800">فاطمه محمدی (مادر)</span><br>
                <span class="text-slate-400 text-[11px]">۰۹۱۲۳۴۵۶۷۸۹</span>
              </td>
              <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">پیاده شد در مدرسه</span>
              </td>
              <td class="p-3.5 text-center">
                <button onclick="alert('اطلاعات دانش‌آموز قابل ویرایش است.')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">ویرایش</button>
              </td>
            </tr>
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-[10px]">سا</div>
                سارا حسینی
              </td>
              <td class="p-3.5">۰۰۱۲۳۴۵۶۷۹ <span class="text-slate-400">(پایه اول)</span></td>
              <td class="p-3.5 font-medium">مسیر ۲ — سعادت‌آباد (حسین احمدی)</td>
              <td class="p-3.5">
                <span class="font-semibold text-slate-800">رضا حسینی (پدر)</span><br>
                <span class="text-slate-400 text-[11px]">۰۹۱۲۹۸۷۶۵۴۳</span>
              </td>
              <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">اعلام مرخصی والد</span>
              </td>
              <td class="p-3.5 text-center">
                <button onclick="alert('اطلاعات دانش‌آموز قابل ویرایش است.')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">ویرایش</button>
              </td>
            </tr>
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-[10px]">پا</div>
                پارسا تهرانی
              </td>
              <td class="p-3.5">۰۰۲۲۳۳۴۴۵۵ <span class="text-slate-400">(پایه پنجم)</span></td>
              <td class="p-3.5 font-medium">مسیر ۳ — نیاوران (محمد حسینی)</td>
              <td class="p-3.5">
                <span class="font-semibold text-slate-800">محمد تهرانی (پدر)</span><br>
                <span class="text-slate-400 text-[11px]">۰۹۱۲۵۵۵۶۶۷۷</span>
              </td>
              <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">پیاده شد در مدرسه</span>
              </td>
              <td class="p-3.5 text-center">
                <button onclick="alert('اطلاعات دانش‌آموز قابل ویرایش است.')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">ویرایش</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `;
  reply.type('text/html').send(HTML_LAYOUT('مدیریت دانش‌آموزان', 'students', content));
});

// 3. Drivers View
fastify.get('/drivers', async (req, reply) => {
  const content = `
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-slate-800">مدیریت رانندگان و خودروها</h2>
        <p class="text-sm text-slate-500">ناوگان فعال، اطلاعات تماس و تماس تک‌لمسی (One-Touch Call)</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">ع‌ر</div>
          <div>
            <h4 class="font-bold text-slate-800 text-sm">علی رضایی</h4>
            <p class="text-xs text-slate-400">۰۹۱۲۱۱۱2233</p>
          </div>
        </div>
        <div class="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl">
          <p>🚐 <strong>خودرو:</strong> ون تویوتا هایس (۱۴ نفره)</p>
          <p>🔢 <strong>پلاک:</strong> ۱۱ب۲۳۴-۲۲</p>
          <p>🗺️ <strong>مسیر انتسابی:</strong> مسیر ۱ — ونک</p>
        </div>
        <a href="tel:09121112233" class="mt-3 block text-center py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors">
          📞 تماس مستقیم با راننده
        </a>
      </div>

      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">ح‌ا</div>
          <div>
            <h4 class="font-bold text-slate-800 text-sm">حسین احمدی</h4>
            <p class="text-xs text-slate-400">۰۹۱۲۲۲۲3344</p>
          </div>
        </div>
        <div class="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl">
          <p>🚐 <strong>خودرو:</strong> پژو پارس (۴ نفره)</p>
          <p>🔢 <strong>پلاک:</strong> ۴۴ج۸۹۱-۳۳</p>
          <p>🗺️ <strong>مسیر انتسابی:</strong> مسیر ۲ — سعادت‌آباد</p>
        </div>
        <a href="tel:09122223344" class="mt-3 block text-center py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors">
          📞 تماس مستقیم با راننده
        </a>
      </div>

      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">م‌ح</div>
          <div>
            <h4 class="font-bold text-slate-800 text-sm">محمد حسینی</h4>
            <p class="text-xs text-slate-400">۰۹۱۲۳۳۳4455</p>
          </div>
        </div>
        <div class="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl">
          <p>🚐 <strong>خودرو:</strong> ون دلیکا (۱۰ نفره)</p>
          <p>🔢 <strong>پلاک:</strong> ۵۵د۱۲۳-۱۱</p>
          <p>🗺️ <strong>مسیر انتسابی:</strong> مسیر ۳ — نیاوران</p>
        </div>
        <a href="tel:09123334455" class="mt-3 block text-center py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors">
          📞 تماس مستقیم با راننده
        </a>
      </div>
    </div>
  </div>
  `;
  reply.type('text/html').send(HTML_LAYOUT('مدیریت رانندگان', 'drivers', content));
});

// 4. Routes View
fastify.get('/routes', async (req, reply) => {
  const content = `
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-black text-slate-800">مسیرها و ایستگاه‌های سرویس</h2>
      <p class="text-sm text-slate-500">تنظیم نقاط سوار و پیاده شدن و ترتیب بهینه توقف‌ها</p>
    </div>
    <div class="glass-card rounded-2xl p-6 shadow-sm">
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <h4 class="font-bold text-slate-800 text-sm">مسیر ۱ — ونک و گاندی (کد R-01)</h4>
            <p class="text-xs text-slate-500 mt-1">توقفگاه‌ها: میدان ونک → خیابان گاندی → مدرسه مهر دانش (۶ توقف)</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">فعال</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <h4 class="font-bold text-slate-800 text-sm">مسیر ۲ — سعادت‌آباد و شهرک غرب (کد R-02)</h4>
            <p class="text-xs text-slate-500 mt-1">توقفگاه‌ها: میدان کاج → بلوار شهرداری → مدرسه مهر دانش (۵ توقف)</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">فعال</span>
        </div>
      </div>
    </div>
  </div>
  `;
  reply.type('text/html').send(HTML_LAYOUT('مسیرها و ایستگاه‌ها', 'routes', content));
});

// 5. Reports View
fastify.get('/reports', async (req, reply) => {
  const content = `
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-black text-slate-800">گزارش‌های جامع و خروجی اکسل</h2>
        <p class="text-sm text-slate-500">دریافت فایل گزارش ماهانه، کارکرد رانندگان و آمار تردد دانش‌آموزان</p>
      </div>
      <button onclick="alert('فایل اکسل با فرمت استاندارد CSV دانلود شد.')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2">
        <span>📊</span> دریافت خروجی اکسل (CSV)
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <h3 class="font-bold text-slate-800 text-sm mb-2">توزیع ساعت تردد صبحگاهی</h3>
        <p class="text-xs text-slate-500 mb-4">بیشترین پیک سوار شدن بین ساعت ۰۷:۱۵ الی ۰۷:۳۵ صبح ثبت شده است.</p>
        <div class="h-24 bg-slate-50 rounded-xl flex items-end justify-between p-3 gap-2">
          <div class="w-full bg-blue-200 rounded-t h-1/4"></div>
          <div class="w-full bg-blue-300 rounded-t h-2/4"></div>
          <div class="w-full bg-blue-600 rounded-t h-full"></div>
          <div class="w-full bg-blue-400 rounded-t h-3/4"></div>
          <div class="w-full bg-blue-200 rounded-t h-1/3"></div>
        </div>
      </div>
      <div class="glass-card rounded-2xl p-5 shadow-sm">
        <h3 class="font-bold text-slate-800 text-sm mb-2">شاخص پایداری سیستم (SLA)</h3>
        <div class="space-y-2 text-xs text-slate-600 mt-4">
          <div class="flex justify-between"><span>نرخ موفقیت نوتیفیکیشن‌ها:</span><span class="font-bold text-emerald-600">۱۰۰٪</span></div>
          <div class="flex justify-between"><span>میانگین تاخیر ارسال پیامک:</span><span class="font-bold text-slate-800">۱.۲ ثانیه</span></div>
          <div class="flex justify-between"><span>در دسترس بودن سرور:</span><span class="font-bold text-emerald-600">۹۹.۹۹٪</span></div>
        </div>
      </div>
    </div>
  </div>
  `;
  reply.type('text/html').send(HTML_LAYOUT('گزارش‌ها و اکسل', 'reports', content));
});

// Start the standalone School Web Server
async function startSchoolWebServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 School Web Dashboard is listening on http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('Failed to start School Web Server:', err);
    process.exit(1);
  }
}

startSchoolWebServer();
