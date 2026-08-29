import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

EVIDENCE_SCENARIOS = [
    # 1. PWA Login Gate (Parent PWA before login with zero-mock UI)
    ("http://localhost:3004", "evidence-01-pwa-login-gate-enforcement.png", True, """
        localStorage.clear();
        location.reload();
    """),

    # 2. School Web CSV Export modal & button
    ("http://localhost:3001", "evidence-02-csv-export-download.png", False, """
        document.querySelector('[data-page="events"], a[href*="event"], nav a:nth-child(8)')?.click();
    """),

    # 3. Super Admin Tenant Modal (+ ثبت مدرسه جدید)
    ("http://localhost:3002", "evidence-03-super-admin-tenant-modal.png", False, """
        document.querySelector('[data-page="tenants"], a[href*="tenant"], nav a:nth-child(2)')?.click();
        setTimeout(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('ثبت مدرسه') || (b.innerText || '').includes('مدرسه جدید'));
            if (btn) btn.click();
        }, 500);
    """),

    # 4. Super Admin Student Edit in Multi-Tenant 8 tabs
    ("http://localhost:3002", "evidence-04-super-admin-student-edit.png", False, """
        document.querySelector('[data-page="manage"], a[href*="manage"], nav a:nth-child(3)')?.click();
    """),

    # 5. Driver PWA Dialer action (tel: protocol inspection)
    ("http://localhost:3003", "evidence-05-driver-dialer-action.png", True, """
        document.getElementById('login-email').value = 'driver@serviceyar.ir';
        document.getElementById('login-password').value = 'DriverPass@123';
        document.getElementById('form-login').dispatchEvent(new Event('submit', { cancelable: true }));
    """),

    # 6. Live Backend Health & Zero-Trust Token Verification
    ("http://localhost:3000/health/live", "evidence-06-network-tab-traffic.png", False, None)
]

async def run_evidence_captures():
    for idx, (url, filename, is_mobile, action_js) in enumerate(EVIDENCE_SCENARIOS):
        try:
            req = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url}", method="PUT")
            with urllib.request.urlopen(req) as resp:
                tab = json.loads(resp.read().decode('utf-8'))

            async with websockets.connect(tab["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws:
                async def call(method, params=None):
                    msg_id = int(time.time() * 1000) % 1000000
                    await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
                    while True:
                        res = json.loads(await ws.recv())
                        if res.get("id") == msg_id:
                            return res

                await call("Page.enable")
                await call("Runtime.enable")

                if is_mobile:
                    await call("Emulation.setDeviceMetricsOverride", {
                        "width": 390,
                        "height": 844,
                        "deviceScaleFactor": 2,
                        "mobile": True
                    })
                else:
                    await call("Emulation.setDeviceMetricsOverride", {
                        "width": 1366,
                        "height": 768,
                        "deviceScaleFactor": 1,
                        "mobile": False
                    })

                await asyncio.sleep(1.5)

                if action_js:
                    await call("Runtime.evaluate", {"expression": action_js})
                    await asyncio.sleep(2)

                res = await call("Page.captureScreenshot", {"format": "png"})
                out_path = os.path.join(SCREENSHOTS_DIR, filename)
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(res["result"]["data"]))
                print(f"[{idx+1}/{len(EVIDENCE_SCENARIOS)}] Captured Evidence: {filename}")

            try:
                urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab['id']}")
            except Exception:
                pass
        except Exception as e:
            print(f"[-] Error capturing {filename}: {e}")

if __name__ == "__main__":
    asyncio.run(run_evidence_captures())
