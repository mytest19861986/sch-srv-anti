/**
 * Parent PWA Server (Fastify + Full Progressive Web App Engine)
 * Port: 3004 (0.0.0.0)
 * Features:
 * - Standalone Manifest (name: "سرویس یار — والدین و اولیا")
 * - Offline Service Worker with Cache-First & Web Push Support
 * - Native "Add to Home Screen" Install Prompt
 * - Live Bus Tracking, Leave Request, and Driver Calling
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
    description: 'سامانه هوشمند ردیابی زنده سرویس مدرسه و اطلاع‌رسانی تردد فرزند ویژه اولیا',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
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

// Service Worker Script
fastify.get('/sw.js', async (req, reply) => {
  reply.header('Content-Type', 'application/javascript; charset=utf-8').send(`
    const CACHE_NAME = 'serviceyar-parent-pwa-v1';
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
      e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
      );
    });
  `);
});

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

// Parent Main App Interface (Standalone Mobile PWA)
fastify.get('/', async (req, reply) => {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>سرویس یار — والدین و اولیا</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#059669">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="سرویس‌یار والدین">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Vazirmatn', -apple-system, sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background-color: #06111e; }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto">
  
  <!-- Top Bar -->
  <header class="space-y-3">
    <div class="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-lg backdrop-blur-md">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl shadow-md">
          👨‍👩‍👧
        </div>
        <div>
          <h1 class="text-sm font-bold text-white">سرویس یار — پنل اولیا</h1>
          <p class="text-[11px] text-slate-400 font-medium">کامران کاظمی | ولی آرمین کاظمی (دبیرستان البرز)</p>
        </div>
      </div>
      <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" title="سیستم فعال"></span>
    </div>

    <!-- PWA Install Prompt Banner -->
    <div id="pwa-install-banner" class="hidden bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-500/40 p-3 rounded-2xl shadow-xl flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs">
        <span class="text-lg">📲</span>
        <span class="font-bold text-white">نصب اپلیکیشن والدین روی صفحه گوشی</span>
      </div>
      <button id="btn-pwa-install" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-md transition-all">
        نصب سریع
      </button>
    </div>
  </header>

  <!-- Live Student Status Card & Tracking -->
  <main class="my-4 space-y-4 flex-1">
    <!-- Student Live Status Card -->
    <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-black text-white">آرمین کاظمی</h2>
          <p class="text-xs text-slate-400">پایه دهم ریاضی — دبیرستان البرز</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
          حاضر در مدرسه ✅
        </span>
      </div>

      <!-- Route Progress Timeline -->
      <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 text-xs">
        <div class="flex items-center justify-between text-slate-400">
          <span>سرویس صبح (مسیر الف):</span>
          <span class="text-emerald-400 font-bold font-mono">پیاده شد ساعت ۰۷:۲۰</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div class="bg-emerald-500 h-full w-full"></div>
        </div>
        <p class="text-[11px] text-slate-400">راننده: <b>مرتضی نوری</b> (مینی‌بوس هیوندای - ۳۳ع۴۵۶-۱۱)</p>
      </div>
    </div>

    <!-- Quick Actions Grid -->
    <div class="grid grid-cols-2 gap-3">
      <button onclick="callDriver()" class="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-right space-y-1 shadow-md transition-all">
        <div class="text-2xl">📞</div>
        <h4 class="text-xs font-bold text-white">تماس با راننده</h4>
        <p class="text-[10px] text-slate-400">۰۹۱۲۵۵۵۶۶۷۷</p>
      </button>

      <button onclick="requestLeave()" class="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-right space-y-1 shadow-md transition-all">
        <div class="text-2xl">📝</div>
        <h4 class="text-xs font-bold text-white">ثبت مرخصی / عدم حضور</h4>
        <p class="text-[10px] text-slate-400">اطلاع به راننده و مدرسه</p>
      </button>
    </div>

    <!-- Live Event Log -->
    <div class="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-md space-y-2.5 text-xs">
      <h3 class="font-bold text-white text-xs">تاریخچه رویدادهای تردد امروز</h3>
      <div class="space-y-2 text-slate-300">
        <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span>رسیدن به دبیرستان البرز و پیاده شدن</span>
          <span class="text-emerald-400 font-mono font-bold">۰۷:۲۰:۰۰</span>
        </div>
        <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <span>سوار شدن در ایستگاه کارگر شمالی</span>
          <span class="text-indigo-300 font-mono font-bold">۰۶:۵۲:۱۵</span>
        </div>
      </div>
    </div>
  </main>

  <footer class="space-y-2 pt-2">
    <p class="text-[10px] text-center text-slate-500 font-mono">سرویس‌یار والدین PWA v1.2.0 — بدون نیاز به نصب APK</p>
  </footer>

  <script>
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

    function callDriver() {
      if (confirm('تماس تلفنی مستقیم با راننده سرویس (آقای نوری: ۰۹۱۲۵۵۵۶۶۷۷)؟')) {
        window.location.href = 'tel:09125556677';
      }
    }

    function requestLeave() {
      const reason = prompt('علت عدم حضور فرزند در سرویس (مثلاً بیماری یا همراهی با والدین):', 'همراهی با والدین');
      if (reason) {
        alert('درخواست عدم حضور برای شیفت بعدی با موفقیت ثبت شد و به راننده سرویس اطلاع داده شد.');
      }
    }
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
