import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

FIX_SCENARIOS = [
    # 1. Phone PWA (Port 3004) Clean Login View (Wi-Fi resolution)
    ("http://localhost:3004", "evidence-fix-01-parent-pwa-phone-clean-login.png", True, """
        localStorage.clear();
        location.reload();
    """),

    # 2. School Web CSV Export Download Action
    ("http://localhost:3001/reports", "evidence-fix-02-school-csv-download-banner.png", False, """
        document.getElementById('btn-export-csv')?.click();
    """),

    # 3. Direct CSV API Endpoint Health
    ("http://localhost:3001/api/export-csv", "evidence-fix-03-csv-direct-endpoint.png", False, None)
]

async def run_fix_captures():
    for idx, (url, filename, is_mobile, action_js) in enumerate(FIX_SCENARIOS):
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
                    await asyncio.sleep(1.5)

                res = await call("Page.captureScreenshot", {"format": "png"})
                out_path = os.path.join(SCREENSHOTS_DIR, filename)
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(res["result"]["data"]))
                print(f"[{idx+1}/{len(FIX_SCENARIOS)}] Captured Evidence: {filename}")

            try:
                urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab['id']}")
            except Exception:
                pass
        except Exception as e:
            print(f"[-] Error capturing {filename}: {e}")

if __name__ == "__main__":
    asyncio.run(run_fix_captures())
