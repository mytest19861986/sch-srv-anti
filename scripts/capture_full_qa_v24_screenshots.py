import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# List of QA captures: (url, filename, is_mobile, fill_action_js)
QA_SCENARIOS = [
    # 1. School Admin (Port 3001) - 12 captures
    ("http://localhost:3001", "qa-01-school-dashboard-overview.png", False, None),
    ("http://localhost:3001", "qa-02-school-students-list.png", False, "document.querySelector('[data-page=\"students\"], a[href*=\"student\"], nav a:nth-child(2)')?.click()"),
    ("http://localhost:3001", "qa-03-school-parents-list.png", False, "document.querySelector('[data-page=\"parents\"], a[href*=\"parent\"], nav a:nth-child(3)')?.click()"),
    ("http://localhost:3001", "qa-04-school-drivers-fleet.png", False, "document.querySelector('[data-page=\"drivers\"], a[href*=\"driver\"], nav a:nth-child(4)')?.click()"),
    ("http://localhost:3001", "qa-05-school-vehicles-fleet.png", False, "document.querySelector('[data-page=\"vehicles\"], a[href*=\"vehicle\"], nav a:nth-child(5)')?.click()"),
    ("http://localhost:3001", "qa-06-school-routes-stops.png", False, "document.querySelector('[data-page=\"routes\"], a[href*=\"route\"], nav a:nth-child(6)')?.click()"),
    ("http://localhost:3001", "qa-07-school-live-services.png", False, "document.querySelector('[data-page=\"live\"], a[href*=\"live\"], nav a:nth-child(7)')?.click()"),
    ("http://localhost:3001", "qa-08-school-attendance-events.png", False, "document.querySelector('[data-page=\"events\"], a[href*=\"event\"], nav a:nth-child(8)')?.click()"),
    ("http://localhost:3001", "qa-09-school-absence-reports.png", False, "document.querySelector('[data-page=\"absences\"], a[href*=\"absence\"], nav a:nth-child(9)')?.click()"),
    ("http://localhost:3001", "qa-10-school-audit-logs.png", False, "document.querySelector('[data-page=\"audit\"], a[href*=\"audit\"], nav a:nth-child(10)')?.click()"),
    ("http://localhost:3001", "qa-11-school-notification-history.png", False, "document.querySelector('[data-page=\"notifications\"], a[href*=\"notification\"], nav a:nth-child(11)')?.click()"),
    ("http://localhost:3001", "qa-12-school-connected-pwas.png", False, "document.querySelector('[data-page=\"apps\"], a[href*=\"app\"], nav a:nth-child(12)')?.click()"),

    # 2. Super Admin (Port 3002) - 11 captures
    ("http://localhost:3002", "qa-13-super-platform-overview.png", False, None),
    ("http://localhost:3002", "qa-14-super-tenants-list.png", False, "document.querySelector('[data-page=\"tenants\"], a[href*=\"tenant\"], nav a:nth-child(2)')?.click()"),
    ("http://localhost:3002", "qa-15-super-manage-8tabs.png", False, "document.querySelector('[data-page=\"manage\"], a[href*=\"manage\"], nav a:nth-child(3)')?.click()"),
    ("http://localhost:3002", "qa-16-super-global-users.png", False, "document.querySelector('[data-page=\"users\"], a[href*=\"user\"], nav a:nth-child(4)')?.click()"),
    ("http://localhost:3002", "qa-17-super-rbac-matrix.png", False, "document.querySelector('[data-page=\"roles\"], a[href*=\"role\"], nav a:nth-child(5)')?.click()"),
    ("http://localhost:3002", "qa-18-super-audit-logs.png", False, "document.querySelector('[data-page=\"audit\"], a[href*=\"audit\"], nav a:nth-child(6)')?.click()"),
    ("http://localhost:3002", "qa-19-super-platform-settings.png", False, "document.querySelector('[data-page=\"settings\"], a[href*=\"setting\"], nav a:nth-child(7)')?.click()"),
    ("http://localhost:3002", "qa-20-super-analytics-reports.png", False, "document.querySelector('[data-page=\"reports\"], a[href*=\"report\"], nav a:nth-child(8)')?.click()"),
    ("http://localhost:3002", "qa-21-super-growth-metrics.png", False, "document.querySelector('[data-page=\"growth\"], a[href*=\"growth\"], nav a:nth-child(9)')?.click()"),
    ("http://localhost:3002", "qa-22-super-db-dump.png", False, "document.querySelector('[data-page=\"backup\"], a[href*=\"backup\"], nav a:nth-child(10)')?.click()"),
    ("http://localhost:3002", "qa-23-super-impersonation-mode.png", False, "document.querySelector('[data-page=\"impersonate\"], a[href*=\"impersonate\"], nav a:nth-child(11)')?.click()"),

    # 3. Driver PWA (Port 3003) - 6 captures
    ("http://localhost:3003", "qa-24-driver-auth-gate.png", True, "localStorage.clear(); location.reload();"),
    ("http://localhost:3003", "qa-25-driver-login-action.png", True, """
        document.getElementById('login-email').value = 'driver@serviceyar.ir';
        document.getElementById('login-password').value = 'DriverPass@123';
        document.getElementById('form-login').dispatchEvent(new Event('submit', { cancelable: true }));
    """),
    ("http://localhost:3003", "qa-26-driver-manifest-live.png", True, None),
    ("http://localhost:3003", "qa-27-driver-attendance-actions.png", True, None),
    ("http://localhost:3003", "qa-28-driver-pwa-install-banner.png", True, None),
    ("http://localhost:3003", "qa-29-driver-server-config.png", True, None),

    # 4. Parent PWA (Port 3004) - 6 captures
    ("http://localhost:3004", "qa-30-parent-auth-gate.png", True, "localStorage.clear(); location.reload();"),
    ("http://localhost:3004", "qa-31-parent-login-action.png", True, """
        document.getElementById('login-email').value = 'parent@serviceyar.ir';
        document.getElementById('login-password').value = 'ParentPass@123';
        document.getElementById('form-login').dispatchEvent(new Event('submit', { cancelable: true }));
    """),
    ("http://localhost:3004", "qa-32-parent-children-cards.png", True, None),
    ("http://localhost:3004", "qa-33-parent-live-timeline.png", True, None),
    ("http://localhost:3004", "qa-34-parent-absence-modal.png", True, "document.getElementById('btn-report-absence')?.click()"),
    ("http://localhost:3004", "qa-35-parent-pwa-install-banner.png", True, None),

    # 5. Wi-Fi Local Network Captures (192.168.1.110) - 5 captures
    ("http://192.168.1.110:3001", "qa-36-wifi-school-dashboard.png", False, None),
    ("http://192.168.1.110:3002", "qa-37-wifi-super-admin.png", False, None),
    ("http://192.168.1.110:3003", "qa-38-wifi-driver-pwa.png", True, None),
    ("http://192.168.1.110:3004", "qa-39-wifi-parent-pwa.png", True, None),
    ("http://192.168.1.110:3000/health/live", "qa-40-wifi-backend-healthcheck.png", False, None)
]

async def run_all_qa_captures():
    for idx, (url, filename, is_mobile, action_js) in enumerate(QA_SCENARIOS):
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
                print(f"[{idx+1}/{len(QA_SCENARIOS)}] Captured: {filename}")

            try:
                urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab['id']}")
            except Exception:
                pass
        except Exception as e:
            print(f"[-] Error capturing {filename}: {e}")

if __name__ == "__main__":
    asyncio.run(run_all_qa_captures())
