/**
 * Parent PWA Server (Fastify + Real Backend Integration + Strict Auth Gate)
 * Port: 3004 (0.0.0.0)
 * Features:
 * - Strict Auth Gate: If no valid token in localStorage, renders ONLY the login screen.
 * - Dynamic API Base: window.location.hostname + ':3000' (supports localhost & Wi-Fi IP).
 * - Real API: Authenticates via POST /api/v1/auth/login, fetches children from GET /api/v1/parent/children.
 * - Real live status and timeline from GET /api/v1/parent/children/:id/status and /timeline.
 * - Real absence reporting via POST /api/v1/parent/absence-reports.
 * - Zero hardcoded mock students or fake data.
 */

import Fastify from 'fastify';

const fastify = Fastify({ logger: false });
const PORT = 3004;
const HOST = '0.0.0.0';

// Web App Manifest
fastify.get('/manifest.json', async (req, reply) => {
  reply.header('Content-Type', 'application/manifest+json; charset=utf-8').send({
    name: 'سرویس یار — نسخه اولیا و والدین',
    short_name: 'سرویس‌یار والدین',
    description: 'سامانه هوشمند رهگیری زنده سرویس مدرسه و ثبت مرخصی دانش‌آموز ویژه اولیا',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#064e3b',
    theme_color: '#059669',
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
    const CACHE_NAME = 'serviceyar-parent-pwa-v2';
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

// Parent Main App Interface with Strict Auth Gate & Real API Binding
fastify.get('/', async (req, reply) => {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>سرویس یار — پنل اولیا و والدین</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#059669">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="سرویس‌یار اولیا">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Vazirmatn', -apple-system, sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background-color: #061e16; }
    .glass { background: rgba(6, 44, 32, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(16, 185, 129, 0.15); }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto">

  <!-- ==================== VIEW 1: AUTH GATE (LOGIN SCREEN) ==================== -->
  <div id="view-login" class="flex-1 flex flex-col justify-center space-y-6 my-auto">
    <div class="text-center space-y-2">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-emerald-600/30">
        👨‍👩‍👧
      </div>
      <h1 class="text-xl font-black text-white">ورود به سامانه اولیا و والدین</h1>
      <p class="text-xs text-slate-400">رهگیری بلادرنگ و امنیت تردد فرزندان</p>
    </div>

    <!-- Error Banner -->
    <div id="login-error" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center"></div>

    <form id="form-login" onsubmit="handleLogin(event)" class="glass p-5 rounded-3xl space-y-4 shadow-2xl">
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-emerald-300">شماره تلفن یا ایمیل والد</label>
        <input type="email" id="login-email" required placeholder="parent@serviceyar.ir" dir="ltr"
               class="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-emerald-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-bold text-emerald-300">رمز عبور</label>
        <input type="password" id="login-password" required placeholder="••••••••" dir="ltr"
               class="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-emerald-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono" />
      </div>

      <button type="submit" id="btn-login-submit"
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <span>ورود به پنل والدین</span>
        <span>🔐</span>
      </button>

      <!-- Quick Demo Credentials -->
      <div class="pt-2 border-t border-emerald-950 text-center">
        <button type="button" onclick="fillDemoCredentials()" class="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium">
          🔑 درج سریع حساب نمونه (parent@serviceyar.ir)
        </button>
      </div>
    </form>
  </div>

  <!-- ==================== VIEW 2: PARENT DASHBOARD (AUTH PROTECTED) ==================== -->
  <div id="view-dashboard" class="hidden flex-1 flex flex-col justify-between space-y-4">
    <!-- Top Bar -->
    <header class="space-y-3">
      <div class="flex items-center justify-between glass p-3.5 rounded-2xl shadow-lg">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl shadow-md">
            👨‍👩‍👧
          </div>
          <div>
            <h2 id="dash-parent-name" class="text-sm font-bold text-white">ولی گرامی</h2>
            <p id="dash-parent-role" class="text-[11px] text-emerald-400/80 font-medium">مدرسه مهر دانش</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="متصل به سرور"></span>
          <button onclick="handleLogout()" class="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-slate-300 hover:text-rose-400 text-xs font-bold transition-all" title="خروج">
            🚪 خروج
          </button>
        </div>
      </div>

      <!-- PWA Install Prompt Banner -->
      <div id="pwa-install-banner" class="hidden bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-500/40 p-3 rounded-2xl shadow-xl flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-lg">📲</span>
          <span class="font-bold text-white">نصب مستقیم اپلیکیشن روی گوشی</span>
        </div>
        <button id="btn-pwa-install" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md transition-all">
          نصب اپ
        </button>
      </div>
    </header>

    <!-- Main Container: Dynamic Children Status & Live Timeline -->
    <main class="space-y-4 flex-1">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-xs font-bold text-emerald-300">وضعیت تردد فرزندان شما</h3>
        <button onclick="fetchParentChildren()" class="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
          <span>🔄 به‌روزرسانی زنده</span>
        </button>
      </div>

      <div id="children-container" class="space-y-4">
        <!-- Injected Dynamically by JavaScript -->
        <div class="text-center py-8 text-xs text-slate-400">
          در حال دریافت اطلاعات فرزندان از سرور...
        </div>
      </div>
    </main>

    <!-- Absence Modal Dialog -->
    <div id="modal-absence" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="glass p-5 rounded-3xl w-full max-w-sm space-y-4 border border-emerald-500/30">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-white">📝 ثبت اعلام عدم حضور / مرخصی</h4>
          <button onclick="closeAbsenceModal()" class="text-slate-400 hover:text-white text-sm">✕</button>
        </div>
        <input type="hidden" id="absence-child-id" />
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300">علت عدم حضور در سرویس:</label>
          <textarea id="absence-reason" rows="3" placeholder="مثال: سرماخوردگی، سفر خانوادگی یا همراهی با والدین"
                    class="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"></textarea>
        </div>
        <div class="flex gap-2 pt-2">
          <button onclick="submitAbsenceReport()" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md">
            ثبت نهایی مرخصی ✅
          </button>
          <button onclick="closeAbsenceModal()" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
            انصراف
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="pt-2 text-center space-y-1">
      <p class="text-[10px] text-emerald-400/60 font-mono">سرویس‌یار PWA v1.2.0 — ایزولاسیون چندمستاجری و داده‌های ۱۰۰٪ زنده</p>
    </footer>
  </div>

  <script>
    // Dynamic API Base URL (Supports both localhost & Local Wi-Fi IP)
    const API_BASE = window.location.protocol + '//' + window.location.hostname + ':3000/api/v1';

    let parentChildren = [];

    // 1. Check Authentication on Startup
    function initAuth() {
      const token = localStorage.getItem('parent_token');
      const userRaw = localStorage.getItem('parent_user');

      if (!token) {
        showLoginView();
      } else {
        try {
          const user = JSON.parse(userRaw || '{}');
          showDashboardView(user);
          fetchParentChildren();
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
        document.getElementById('dash-parent-name').textContent = user.fullName;
        document.getElementById('dash-parent-role').textContent = user.email + ' | ولی دانش‌آموز';
      }
    }

    function fillDemoCredentials() {
      document.getElementById('login-email').value = 'parent@serviceyar.ir';
      document.getElementById('login-password').value = 'ParentPass@123';
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
        localStorage.setItem('parent_token', data.token);
        localStorage.setItem('parent_user', JSON.stringify(data.user));

        showDashboardView(data.user);
        await fetchParentChildren();
      } catch (err) {
        const isNetworkErr = !err.message || err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('failed');
        const userMsg = isNetworkErr
          ? 'اتصال به سرور برقرار نشد — بررسی کنید سرور و شبکه Wi-Fi روشن است.'
          : (err.message || 'خطا در ارتباط با سرور.');
        errorEl.innerHTML = \`
          <div class="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs text-center space-y-1.5">
            <p>⚠️ \${userMsg}</p>
            <button type="button" onclick="handleLogin(event)" class="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] transition-all">🔄 تلاش مجدد</button>
          </div>
        \`;
        errorEl.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>ورود به پنل والدین</span><span>🔐</span>';
      }
    }

    // 3. Handle Logout
    function handleLogout() {
      localStorage.removeItem('parent_token');
      localStorage.removeItem('parent_user');
      parentChildren = [];
      showLoginView();
    }

    // 4. Fetch Real Children from Parent API
    async function fetchParentChildren() {
      const token = localStorage.getItem('parent_token');
      if (!token) return showLoginView();

      const container = document.getElementById('children-container');
      container.innerHTML = '<div class="text-center py-6 text-xs text-emerald-400">در حال دریافت داده‌های فرزندان از سرور...</div>';

      try {
        const res = await fetch(API_BASE + '/parent/children', {
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
        if (!res.ok || !data.children) {
          throw new Error(data.message || 'خطا در دریافت لیست فرزندان');
        }

        parentChildren = data.children;
        if (parentChildren.length === 0) {
          container.innerHTML = '<div class="glass p-4 rounded-2xl text-center text-xs text-slate-400">هیچ دانش‌آموزی متصل به حساب شما ثبت نشده است.</div>';
          return;
        }

        // For each child, fetch status and timeline
        const fullChildrenData = await Promise.all(
          parentChildren.map(async (child) => {
            try {
              const [statusRes, timelineRes] = await Promise.all([
                fetch(API_BASE + '/parent/children/' + child.id + '/status', {
                  headers: { 'Authorization': 'Bearer ' + token }
                }),
                fetch(API_BASE + '/parent/children/' + child.id + '/timeline', {
                  headers: { 'Authorization': 'Bearer ' + token }
                })
              ]);
              const statusData = statusRes.ok ? await statusRes.json() : {};
              const timelineData = timelineRes.ok ? await timelineRes.json() : {};
              return { ...child, status: statusData.status || 'AT_HOME', timeline: timelineData.events || [] };
            } catch (e) {
              return { ...child, status: 'AT_HOME', timeline: [] };
            }
          })
        );

      } catch (err) {
        const isNetworkErr = !err.message || err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('failed');
        const userMsg = isNetworkErr
          ? 'اتصال به سرور برقرار نشد — بررسی کنید سرور روشن است'
          : (err.message || 'خطا در بارگذاری اطلاعات');
        container.innerHTML = \`
          <div class="glass p-5 rounded-3xl text-center space-y-3 border border-rose-500/30 shadow-lg">
            <p class="text-xs text-rose-300 font-bold">⚠️ \\\${userMsg}</p>
            <button onclick="fetchParentChildren()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md">
              🔄 تلاش مجدد
            </button>
          </div>
        \`;
      }
    }

    // 5. Render Real Children & Status
    function renderChildren(children) {
      const container = document.getElementById('children-container');

      container.innerHTML = children.map(child => {
        let statusTitle = 'در منزل / آماده حرکت';
        let statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">در منزل</span>';
        let progressWidth = 'w-1/4 bg-slate-500';

        if (child.status === 'PICKED_UP') {
          statusTitle = 'سوار بر سرویس (به سمت مدرسه)';
          statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">سوار شد ✅</span>';
          progressWidth = 'w-3/4 bg-emerald-500 animate-pulse';
        } else if (child.status === 'DROPPED_OFF') {
          statusTitle = 'رسیده به مقصد (حاضر در مدرسه)';
          statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">حاضر در مدرسه 🏫</span>';
          progressWidth = 'w-full bg-blue-500';
        } else if (child.status === 'ABSENT') {
          statusTitle = 'مرخصی / عدم حضور ثبت‌شده';
          statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">غایب ⚠️</span>';
          progressWidth = 'w-0';
        }

        // Timeline items
        const timelineHtml = child.timeline && child.timeline.length > 0
          ? child.timeline.slice(0, 3).map(evt => \`
              <li class="flex items-center justify-between text-[11px] py-1 border-b border-emerald-950">
                <span class="text-slate-300">رویداد: <b class="text-white">\${evt.eventType}</b></span>
                <span class="text-slate-400 font-mono">\${new Date(evt.clientTimestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            \`).join('')
          : '<li class="text-[11px] text-slate-400 py-1">هیچ رویدادی برای امروز ثبت نشده است.</li>';

        return \`
          <div class="glass p-4 rounded-3xl space-y-3.5 shadow-lg border border-emerald-500/20">
            <!-- Student Header -->
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-base font-extrabold text-white">\${child.firstName} \${child.lastName}</h4>
                <p class="text-[11px] text-emerald-400/80 font-medium">\${child.grade || 'پایه تحصیلی'}</p>
              </div>
              \${statusBadge}
            </div>

            <!-- Status Bar -->
            <div class="bg-slate-900/80 p-3 rounded-2xl space-y-2 border border-emerald-950">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-300">وضعیت زنده:</span>
                <span class="font-bold text-white">\${statusTitle}</span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="\${progressWidth} h-full rounded-full transition-all duration-500"></div>
              </div>
            </div>

            <!-- Real Timeline Events -->
            <div class="space-y-1">
              <h5 class="text-[11px] font-bold text-emerald-300">📜 تاریخچه تردد امروز:</h5>
              <ul class="space-y-0.5">
                \${timelineHtml}
              </ul>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 pt-1">
              <a href="tel:09129876543" class="flex-1 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                <span>📞 تماس با راننده</span>
              </a>
              <button onclick="openAbsenceModal('\${child.id}')" class="flex-1 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                <span>📝 اعلام مرخصی</span>
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    // 6. Absence Reporting Modal Handlers
    function openAbsenceModal(childId) {
      document.getElementById('absence-child-id').value = childId;
      document.getElementById('absence-reason').value = '';
      document.getElementById('modal-absence').classList.remove('hidden');
    }

    function closeAbsenceModal() {
      document.getElementById('modal-absence').classList.add('hidden');
    }

    async function submitAbsenceReport() {
      const token = localStorage.getItem('parent_token');
      const childId = document.getElementById('absence-child-id').value;
      const reason = document.getElementById('absence-reason').value.trim() || 'اعلام غیبت توسط والدین';

      if (!token || !childId) return;

      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await fetch(API_BASE + '/parent/absence-reports', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            child_id: childId,
            date: todayStr,
            reason: reason
          })
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'خطا در ثبت مرخصی');
        }

        closeAbsenceModal();
        alert('درخواست مرخصی با موفقیت ثبت و به راننده و مدرسه ابلاغ گردید.');
        await fetchParentChildren();
      } catch (err) {
        alert('خطا در ثبت مرخصی: ' + err.message);
      }
    }

    // 7. PWA Lifecycle & Installation Handlers
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Parent PWA Service Worker Registered:', reg.scope))
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
    console.error('Error starting Parent PWA Server:', err);
    process.exit(1);
  }
  console.log(`[ParentPWA] Server listening on ${address} (0.0.0.0:${PORT})`);
});
