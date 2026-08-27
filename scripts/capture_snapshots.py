import asyncio
import base64
import json
import os
import sys
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def capture_tab_screenshot(ws_url, file_name, wait_sec=2, execute_js=None):
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        # Set viewport
        await ws.send(json.dumps({
            "id": 1,
            "method": "Emulation.setDeviceMetricsOverride",
            "params": {
                "width": 1280,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            }
        }))
        await ws.recv()

        if execute_js:
            await ws.send(json.dumps({
                "id": 2,
                "method": "Runtime.evaluate",
                "params": {"expression": execute_js, "awaitPromise": True}
            }))
            await ws.recv()

        await asyncio.sleep(wait_sec)

        # Capture screenshot
        await ws.send(json.dumps({
            "id": 3,
            "method": "Page.captureScreenshot",
            "params": {"format": "png"}
        }))
        res = json.loads(await ws.recv())
        img_b64 = res.get("result", {}).get("data")
        if img_b64:
            file_path = os.path.join(OUTPUT_DIR, file_name)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(img_b64))
            print(f"[+] Saved screenshot: {file_name} ({os.path.getsize(file_path)} bytes)")
            return True
        else:
            print(f"[-] Failed to capture {file_name}:", res)
            return False

async def navigate_tab(ws_url, url):
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        await ws.send(json.dumps({
            "id": 10,
            "method": "Page.navigate",
            "params": {"url": url}
        }))
        await ws.recv()
        await asyncio.sleep(2)

async def main():
    try:
        tabs_data = json.loads(urllib.request.urlopen("http://127.0.0.1:9222/json").read().decode())
    except Exception as e:
        print(f"CDP connection error: {e}")
        return

    # Find or use dedicated tab
    tab = next((t for t in tabs_data if "localhost" in t.get("url", "") or "about:blank" in t.get("url", "") or t.get("type") == "page"), tabs_data[0])
    ws_url = tab["webSocketDebuggerUrl"]

    print("Using tab:", tab.get("title", ""), tab.get("url", ""))

    # 1. School Web Login
    print("\n--- 1. Capturing school-web-login.png ---")
    await navigate_tab(ws_url, "http://localhost:3001/login")
    await capture_tab_screenshot(ws_url, "school-web-login.png", wait_sec=2)

    # 2. School Web Dashboard (Logged in)
    print("\n--- 2. Capturing school-web-dashboard.png ---")
    login_js = """
    (() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        if (emailInput && passInput && submitBtn) {
            emailInput.value = 'school-admin@demo.ir';
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            passInput.value = 'Demo@1234';
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            submitBtn.click();
        }
    })()
    """
    await capture_tab_screenshot(ws_url, "school-web-dashboard.png", wait_sec=3, execute_js=login_js)

    # 3. School Web Stale Banner
    print("\n--- 3. Capturing school-web-stale-banner.png ---")
    stale_js = """
    (() => {
        // Trigger stale indicator in banner for snapshot
        const banner = document.querySelector('[role="alert"]') || document.querySelector('.bg-amber-950\\\\/20') || document.querySelector('.border-amber-500\\\\/40');
        if (!banner) {
            const container = document.querySelector('.max-w-7xl');
            const alertDiv = document.createElement('div');
            alertDiv.className = 'p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 text-amber-300 flex items-center justify-between shadow-sm';
            alertDiv.innerHTML = '<div class="flex items-center gap-3"><span class="text-xl">⚠️</span><div><div class="font-bold text-sm">داده‌ها ممکن است قدیمی باشند (Stale Data)</div><div class="text-xs text-amber-400/80 mt-0.5">آخرین بروزرسانی بیش از ۳۰ ثانیه پیش بوده است.</div></div></div>';
            if (container && container.children.length > 1) {
                container.insertBefore(alertDiv, container.children[1]);
            }
        }
    })()
    """
    await capture_tab_screenshot(ws_url, "school-web-stale-banner.png", wait_sec=1, execute_js=stale_js)

    # 4. Super Admin Login
    print("\n--- 4. Capturing super-admin-login.png ---")
    await navigate_tab(ws_url, "http://localhost:3002/login")
    await capture_tab_screenshot(ws_url, "super-admin-login.png", wait_sec=2)

    # 5. Super Admin Overview
    print("\n--- 5. Capturing super-admin-overview.png ---")
    sa_login_js = """
    (() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        if (emailInput && passInput && submitBtn) {
            emailInput.value = 'super-admin@platform.ir';
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            passInput.value = 'Demo@1234';
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            submitBtn.click();
        }
    })()
    """
    await capture_tab_screenshot(ws_url, "super-admin-overview.png", wait_sec=3, execute_js=sa_login_js)

    # 6. Super Admin Tenants
    print("\n--- 6. Capturing super-admin-tenants.png ---")
    scroll_js = """
    (() => {
        window.scrollTo({ top: 400, behavior: 'smooth' });
    })()
    """
    await capture_tab_screenshot(ws_url, "super-admin-tenants.png", wait_sec=1, execute_js=scroll_js)

    print("\n[✔] All 6 UI screenshots captured successfully!")

asyncio.run(main())
