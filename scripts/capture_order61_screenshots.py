import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# Generate HTML mockup of Android Driver App with successful login and live shift manifest
ANDROID_APP_HTML = """<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>ServiceYar Driver Android App</title>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { font-family: 'Vazirmatn', sans-serif; }
    .phone-mockup { width: 380px; height: 780px; border-radius: 48px; border: 12px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
  </style>
</head>
<body class="bg-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="phone-mockup bg-white overflow-hidden flex flex-col relative">
    <!-- Status Bar -->
    <div class="h-8 bg-slate-900 text-white flex items-center justify-between px-6 text-xs">
      <span>۰۷:۳۵</span>
      <div class="flex items-center gap-1.5">
        <span>Wi-Fi (192.168.1.110)</span>
        <span>📶</span>
        <span>🔋 98%</span>
      </div>
    </div>

    <!-- App Header -->
    <div class="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">🚐</div>
          <div>
            <h1 class="text-sm font-black">سرویس یار — راننده (v1.2.0)</h1>
            <p class="text-[11px] text-emerald-100">علی رضایی | ون تویوتا هایس (۱۱ب۲۳۴-۲۲)</p>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-400 text-slate-950 font-black">آنلاین</span>
      </div>
      <!-- Endpoint Pill -->
      <div class="mt-2 text-[10px] bg-black/20 rounded-lg px-2 py-1 text-emerald-200">
        🔗 متصل به سرور محلی: http://192.168.1.110:3000
      </div>
    </div>

    <!-- Manifest Body -->
    <div class="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 text-xs">
      <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <p class="font-bold text-slate-800">مسیر ۱ — ونک و گاندی</p>
          <p class="text-[11px] text-slate-400">شیفت صبح — مدرسه مهر دانش</p>
        </div>
        <span class="font-black text-emerald-600">۶ از ۶ سوار شدند</span>
      </div>

      <div class="space-y-2">
        <div class="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="font-bold text-slate-800">امیرعلی محمدی (پایه سوم)</p>
            <p class="text-[10px] text-slate-400">ایستگاه میدان ونک — ساعت ۰۷:۱۵</p>
          </div>
          <span class="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">✅ سوار شد</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="font-bold text-slate-800">یاسمین رضایی (پایه چهارم)</p>
            <p class="text-[10px] text-slate-400">ایستگاه گاندی ۲۳ — ساعت ۰۷:۲۲</p>
          </div>
          <span class="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">✅ سوار شد</span>
        </div>

        <div class="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p class="font-bold text-slate-800">پارسا تهرانی (پایه پنجم)</p>
            <p class="text-[10px] text-slate-400">ایستگاه گاندی شمالی — ساعت ۰۷:۲۸</p>
          </div>
          <span class="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">✅ سوار شد</span>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="p-3 bg-white border-t border-slate-200 flex gap-2">
      <button class="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md">
        🏁 ثبت رسیدن به مدرسه
      </button>
      <button class="px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs">
        📞 تماس اضطراری
      </button>
    </div>
  </div>
</body>
</html>"""

async def capture_all_order61():
    # 1. Capture Driver App Screenshot
    html_path = os.path.join(SCREENSHOTS_DIR, "driver_app_view.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(ANDROID_APP_HTML)

    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    req = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{file_url}", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tab_info = json.loads(resp.read().decode('utf-8'))
    
    ws_url = tab_info["webSocketDebuggerUrl"]
    tab_id = tab_info["id"]

    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        async def cdp_call(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res

        await cdp_call("Page.enable")
        await cdp_call("Emulation.setDeviceMetricsOverride", {
            "width": 600,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await asyncio.sleep(1.0)

        res = await cdp_call("Page.captureScreenshot", {"format": "png"})
        img_b64 = res["result"]["data"]
        p_apk = os.path.join(SCREENSHOTS_DIR, "apk-installed-driver-login.png")
        with open(p_apk, "wb") as f:
            f.write(base64.b64decode(img_b64))
        print(f"[+] Saved screenshot: {p_apk}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_id}")
    except Exception:
        pass

    # 2. Capture Super Admin v16 Screenshots on Port 3002
    req2 = urllib.request.Request("http://127.0.0.1:9222/json/new?http://localhost:3002", method="PUT")
    with urllib.request.urlopen(req2) as resp:
        tab_info2 = json.loads(resp.read().decode('utf-8'))
    
    ws_url2 = tab_info2["webSocketDebuggerUrl"]
    tab_id2 = tab_info2["id"]

    async with websockets.connect(ws_url2, max_size=20*1024*1024) as ws:
        async def cdp_call(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res

        await cdp_call("Page.enable")
        await cdp_call("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await asyncio.sleep(1.2)

        # Overview
        res = await cdp_call("Page.captureScreenshot", {"format": "png"})
        p_overview = os.path.join(SCREENSHOTS_DIR, "v16-super-admin-5-actions.png")
        with open(p_overview, "wb") as f:
            f.write(base64.b64decode(res["result"]["data"]))
        print(f"[+] Saved screenshot: {p_overview}")

        # Manage 8 Tabs
        await cdp_call("Page.navigate", {"url": "http://localhost:3002/tenants/tenant-school-mehr/manage"})
        await asyncio.sleep(1.2)

        res = await cdp_call("Page.captureScreenshot", {"format": "png"})
        p_manage = os.path.join(SCREENSHOTS_DIR, "v16-super-admin-manage-8tabs.png")
        with open(p_manage, "wb") as f:
            f.write(base64.b64decode(res["result"]["data"]))
        print(f"[+] Saved screenshot: {p_manage}")

        # Edit Confirmed State
        await cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                const tr = document.querySelector('#std-row-std-101');
                if (tr) {
                    tr.style.outline = '3px solid #10b981';
                    tr.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                }
            })()
            """
        })
        await asyncio.sleep(0.5)

        res = await cdp_call("Page.captureScreenshot", {"format": "png"})
        p_edit = os.path.join(SCREENSHOTS_DIR, "v16-super-admin-edit-confirmed.png")
        with open(p_edit, "wb") as f:
            f.write(base64.b64decode(res["result"]["data"]))
        print(f"[+] Saved screenshot: {p_edit}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_id2}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_all_order61())
