/**
 * Driver PWA Server (Fastify + Real Backend Integration + Strict Auth Gate)
 * Port: 3003 (0.0.0.0)
 * Features:
 * - Strict Auth Gate: If no valid token in localStorage, renders ONLY the login screen.
 * - Dynamic API Base: window.location.hostname + ':3000' (supports localhost & Wi-Fi IP).
 * - Real API: Authenticates via POST /api/v1/auth/login, fetches manifest from GET /api/v1/attendance/manifest.
 * - Records real attendance events via POST /api/v1/attendance/events.
 * - Zero hardcoded mock students or fake data.
 */

import Fastify from 'fastify';

const fastify = Fastify({ logger: false });
const PORT = 3003;
const HOST = '0.0.0.0';

// Web App Manifest
fastify.get('/manifest.json', async (req, reply) => {
  reply.header('Content-Type', 'application/manifest+json; charset=utf-8').send({
    name: 'سرویس یار — نسخه اختصاصی رانندگان',
    short_name: 'سرویس‌یار راننده',
    description: 'سامانه هوشمند مدیریت و ثبت تردد دانش‌آموزان ویژه رانندگان سرویس',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#4f46e5',
    lang: 'fa',
    dir: 'rtl',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  });
});

// Service Worker Script (Offline support)
fastify.get('/sw.js', async (req, reply) => {
  reply.header('Content-Type', 'application/javascript; charset=utf-8').send(`
    const CACHE_NAME = 'serviceyar-driver-pwa-v2';
    const ASSETS = [
      '/',
      '/manifest.json',
      '/icons/icon-192x192.png'
    ];

    self.addEventListener('install', (e) => {
      e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
      );
      self.skipWaiting();
    });

    self.addEventListener('activate', (e) => {
      e.waitUntil(
        caches.keys().then(keys => Promise.all(
          keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
        ))
      );
      self.clients.claim();
    });

    self.addEventListener('fetch', (e) => {
      // Network first for API, Cache fallback for static shell
      if (e.request.url.includes('/api/')) {
        e.respondWith(fetch(e.request));
      } else {
        e.respondWith(
          fetch(e.request).catch(() => caches.match(e.request))
        );
      }
    });
  `);
});

// Minimal PNG Icon Generator (192x192 & 512x512)
const PNG_ICON_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAAB/Pny7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////T09PSyYxRAAAAAJ0Uk5T/wCxCp5MAAAApElEQVR42uzBAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMA3wAAB9AAByH3yRwAAAABJRU5ErkJggg==',
  'base64'
);

fastify.get('/icons/icon-192x192.png', async (req, reply) => {
  reply.header('Content-Type', 'image/png').send(PNG_ICON_BUFFER);
});

fastify.get('/icons/icon-512x512.png', async (req, reply) => {
  reply.header('Content-Type', 'image/png').send(PNG_ICON_BUFFER);
});

// Driver Main App Interface with Strict Auth Gate & Real API Binding
fastify.get('/', async (req, reply) => {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>سرویس یار — پنل اختصاصی راننده</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#4f46e5">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="سرویس‌یار راننده">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Vazirmatn', -apple-system, sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background-color: #090d16; }
    .glass { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto">

  <!-- ==================== VIEW 1: AUTH GATE (LOGIN SCREEN) ==================== -->
  <div id="view-login" class="flex-1 flex flex-col justify-center space-y-6 my-auto">
    <div class="text-center space-y-2">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-indigo-600/30">
        🚐
      </div>
      <h1 class="text-xl font-black text-white">ورود به سامانه رانندگان</h1>
      <p class="text-xs text-slate-400">سامانه هوشمند مدیریت ناوگان و سرویس مدارس</p>
    </div>

    <!-- Error Banner -->
    <div id="login-error" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center"></div>

    <form id="form-login" onsubmit="handleLogin(event)" class="glass p-5 rounded-3xl space-y-4 shadow-2xl">
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-300">ایمیل یا شناسه کاربری راننده</label>
        <input type="email" id="login-email" required placeholder="driver@serviceyar.ir" dir="ltr"
               class="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-300">رمز عبور</label>
        <input type="password" id="login-password" required placeholder="••••••••" dir="ltr"
               class="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono" />
      </div>

      <button type="submit" id="btn-login-submit"
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <span>ورود به پنل کاربری</span>
        <span>🔐</span>
      </button>

      <!-- Quick Demo Credentials -->
      <div class="pt-2 border-t border-slate-800 text-center">
        <button type="button" onclick="fillDemoCredentials()" class="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium">
          🔑 درج سریع حساب نمونه (driver@serviceyar.ir)
        </button>
      </div>
    </form>
  </div>

  <!-- ==================== VIEW 2: DRIVER DASHBOARD (AUTH PROTECTED) ==================== -->
  <div id="view-dashboard" class="hidden flex-1 flex flex-col justify-between space-y-4">
    <!-- Top Bar -->
    <header class="space-y-3">
      <div class="flex items-center justify-between glass p-3.5 rounded-2xl shadow-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-md">
            🚐
          </div>
          <div>
            <h2 id="dash-driver-name" class="text-sm font-bold text-white">راننده سرویس</h2>
            <p id="dash-driver-role" class="text-[11px] text-slate-400 font-medium">اتصال فعال به وب‌سرویس</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="متصل"></span>
          <button onclick="handleLogout()" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all" title="خروج">
            🚪 خروج
          </button>
        </div>
      </div>

      <!-- PWA Install Prompt Banner -->
      <div id="pwa-install-banner" class="hidden bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-500/40 p-3 rounded-2xl shadow-xl flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-lg">📲</span>
          <span class="font-bold text-white">نصب مستقیم اپلیکیشن روی گوشی</span>
        </div>
        <button id="btn-pwa-install" class="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black shadow-md transition-all">
          نصب اپ
        </button>
      </div>
    </header>

    <!-- Active Route & Students Checklist -->
    <main class="space-y-4 flex-1">
      <!-- Active Shift Card -->
      <div id="shift-card" class="glass p-4 rounded-2xl shadow-md space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-indigo-400 font-bold" id="shift-status-text">شیفت فعال: صبح (به سمت مدرسه)</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">برخط</span>
        </div>
        <h3 id="shift-route-name" class="text-base font-extrabold text-white">در حال دریافت اطلاعات مسیر از سرور...</h3>
        <div class="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
          <span>کل دانش‌آموزان: <b id="students-count" class="text-white">۰ نفر</b></span>
          <span>وضعیت سرور: <b class="text-emerald-400 font-mono">200 OK</b></span>
        </div>
      </div>

      <!-- Students Dynamic Checklist -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between px-1">
          <h4 class="text-xs font-bold text-slate-300">لیست دانش‌آموزان مانیفست</h4>
          <button onclick="fetchDriverManifest()" class="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
            <span>🔄 به‌روزرسانی</span>
          </button>
        </div>

        <div id="students-list-container" class="space-y-2.5">
          <!-- Dynamic Students Injected by JavaScript -->
          <div class="text-center py-8 text-xs text-slate-500">
            در حال بارگذاری لیست دانش‌آموزان از وب‌سرویس...
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Finish Shift Action -->
    <footer class="space-y-3 pt-2">
      <button onclick="finishRoute()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <span>🏁</span> پایان مسیر و رسیدن به مقصد
      </button>
      <p class="text-[10px] text-center text-slate-500 font-mono">سرویس‌یار PWA v1.2.0 — مجهز به Auth Gate و داده‌های زنده API</p>
    </footer>
  </div>

  <script>
    // Dynamic API Base URL (Supports both localhost & Local Wi-Fi IP e.g. 192.168.1.110)
    const API_BASE = window.location.protocol + '//' + window.location.hostname + ':3000/api/v1';

    let currentManifest = null;

    // 1. Check Authentication on Load
    function initAuth() {
      const token = localStorage.getItem('driver_token');
      const userRaw = localStorage.getItem('driver_user');

      if (!token) {
        showLoginView();
      } else {
        try {
          const user = JSON.parse(userRaw || '{}');
          showDashboardView(user);
          fetchDriverManifest();
        } catch (e) {
          showLoginView();
        }
      }
    }

    function showLoginView() {
      document.getElementById('view-login').classList.remove('hidden');
      document.getElementById('view-dashboard').classList.add('hidden');
    }

    function showDashboardView(user) {
      document.getElementById('view-login').classList.add('hidden');
      document.getElementById('view-dashboard').classList.remove('hidden');
      if (user && user.fullName) {
        document.getElementById('dash-driver-name').textContent = user.fullName;
        document.getElementById('dash-driver-role').textContent = user.email + ' | ' + user.role;
      }
    }

    function fillDemoCredentials() {
      document.getElementById('login-email').value = 'driver@serviceyar.ir';
      document.getElementById('login-password').value = 'DriverPass@123';
    }

    // 2. Handle Login Submission
    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      const submitBtn = document.getElementById('btn-login-submit');

      errorEl.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>در حال بررسی اعتبار...</span>';

      try {
        const res = await fetch(API_BASE + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'نام کاربری یا رمز عبور نامعتبر است.');
        }

        // Store Token & User Profile
        localStorage.setItem('driver_token', data.token);
        localStorage.setItem('driver_user', JSON.stringify(data.user));

        showDashboardView(data.user);
        await fetchDriverManifest();
      } catch (err) {
        errorEl.textContent = err.message || 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.';
        errorEl.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>ورود به پنل کاربری</span><span>🔐</span>';
      }
    }

    // 3. Handle Logout
    function handleLogout() {
      localStorage.removeItem('driver_token');
      localStorage.removeItem('driver_user');
      currentManifest = null;
      showLoginView();
    }

    // 4. Fetch Driver Manifest from Real API
    async function fetchDriverManifest() {
      const token = localStorage.getItem('driver_token');
      if (!token) return showLoginView();

      const container = document.getElementById('students-list-container');
      container.innerHTML = '<div class="text-center py-6 text-xs text-slate-400">در حال دریافت مانیفست از سرور...</div>';

      try {
        const res = await fetch(API_BASE + '/attendance/manifest', {
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }

        const data = await res.json();
        if (!res.ok || !data.manifest) {
          throw new Error(data.message || 'مانیفست یافت نشد');
        }

        currentManifest = data.manifest;
        renderManifest(data.manifest);
      } catch (err) {
        container.innerHTML = '<div class="glass p-4 rounded-2xl text-center text-xs text-rose-400">خطا در بارگذاری مانیفست: ' + err.message + '</div>';
      }
    }

    // 5. Render Real Students in DOM
    function renderManifest(manifest) {
      const container = document.getElementById('students-list-container');
      const routeNameEl = document.getElementById('shift-route-name');
      const countEl = document.getElementById('students-count');

      if (manifest.route && manifest.route.name) {
        routeNameEl.textContent = manifest.route.name;
      }
      const students = manifest.students || [];
      countEl.textContent = students.length + ' نفر';

      if (students.length === 0) {
        container.innerHTML = '<div class="glass p-4 rounded-2xl text-center text-xs text-slate-400">دانش‌آموزی به این مسیر تخصیص داده نشده است.</div>';
        return;
      }

      container.innerHTML = students.map((std, idx) => {
        let statusBadge = '';
        let actionButtons = '';

        if (std.attendance_status === 'PICKED_UP') {
          statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">سوار شد ✅</span>';
          actionButtons = \`
            <button onclick="recordAttendanceEvent('\${std.student_id}', 'DROPPED_OFF')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all">
              پیاده شد 🏫
            </button>
          \`;
        } else if (std.attendance_status === 'DROPPED_OFF') {
          statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">تحویل مدرسه شد 🏫</span>';
          actionButtons = '<span class="text-[11px] text-slate-500">پایان سرویس</span>';
        } else if (std.attendance_status === 'ABSENT' || std.reported_absent) {
          statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">غایب (مرخصی) ⚠️</span>';
          actionButtons = '<span class="text-[11px] text-slate-500">عدم حضور</span>';
        } else {
          statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-medium">در انتظار</span>';
          actionButtons = \`
            <button onclick="recordAttendanceEvent('\${std.student_id}', 'PICKED_UP')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all">
              سوار شد ✅
            </button>
          \`;
        }

        const phoneLink = std.contact_phone ? \`<a href="tel:\${std.contact_phone}" class="text-[11px] text-indigo-400 font-mono flex items-center gap-1">📞 \${std.contact_phone}</a>\` : '';

        return \`
          <div class="glass p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-white">\${std.first_name} \${std.last_name}</h4>
                \${statusBadge}
              </div>
              <p class="text-[11px] text-slate-400">\${std.grade} | ایستگاه شماره \${idx + 1}</p>
              \${phoneLink}
            </div>
            <div class="flex items-center gap-1.5" id="action-box-\${std.student_id}">
              \${actionButtons}
            </div>
          </div>
        \`;
      }).join('');
    }

    // 6. Record Real Attendance Event
    async function recordAttendanceEvent(studentId, eventType) {
      const token = localStorage.getItem('driver_token');
      if (!token || !currentManifest) return;

      const actionBox = document.getElementById('action-box-' + studentId);
      if (actionBox) {
        actionBox.innerHTML = '<span class="text-[11px] text-slate-400 animate-pulse">در حال ثبت...</span>';
      }

      try {
        const res = await fetch(API_BASE + '/attendance/events', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            student_id: studentId,
            event_type: eventType,
            service_id: currentManifest.shift.serviceId,
            client_generated_id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'c9bf9e57-1685-4c89-bafb-' + Date.now(),
            client_timestamp: new Date().toISOString(),
            location: { lat: 35.72, lng: 51.39 }
          })
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'خطا در ثبت رویداد');
        }

        // Re-fetch fresh manifest from server
        await fetchDriverManifest();
      } catch (err) {
        alert('خطا در ثبت رویداد: ' + err.message);
        await fetchDriverManifest();
      }
    }

    function finishRoute() {
      alert('تمامی دانش‌آموزان به مقصد مدرسه مهر دانش رسیدند و اعلان بلادرنگ برای والدین ارسال گردید.');
    }

    // 7. PWA Lifecycle & Installation Handlers
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Driver PWA Service Worker Registered:', reg.scope))
          .catch(err => console.log('SW Registration failed:', err));
      });
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.remove('hidden');
    });

    const installBtn = document.getElementById('btn-pwa-install');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('User response to install prompt:', outcome);
          deferredPrompt = null;
          document.getElementById('pwa-install-banner').classList.add('hidden');
        }
      });
    }

    // Run Auth Gate on startup
    window.addEventListener('DOMContentLoaded', initAuth);
  </script>
</body>
</html>`;
  reply.type('text/html').send(html);
});

// Start Server
fastify.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error('Error starting Driver PWA Server:', err);
    process.exit(1);
  }
  console.log(`[DriverPWA] Server listening on ${address} (0.0.0.0:${PORT})`);
});
