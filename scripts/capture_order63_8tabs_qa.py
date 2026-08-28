import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

tabs_to_capture = [
    ("students", "manage-tab-students.png"),
    ("parents", "manage-tab-parents.png"),
    ("drivers", "manage-tab-drivers.png"),
    ("vehicles", "manage-tab-vehicles.png"),
    ("routes", "manage-tab-routes.png"),
    ("services", "manage-tab-services-empty-state.png"),
    ("events", "manage-tab-events.png"),
    ("audit", "manage-tab-audit.png"),
]

async def capture_8tabs():
    url = "http://localhost:3002/tenants/school-tehran-alborz/manage"
    req = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url}", method="PUT")
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
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await asyncio.sleep(1.2)

        for tab_name, filename in tabs_to_capture:
            # Switch tab in UI
            await cdp_call("Runtime.evaluate", {
                "expression": f"switchTab('{tab_name}')"
            })
            await asyncio.sleep(0.4)

            res = await cdp_call("Page.captureScreenshot", {"format": "png"})
            dest_path = os.path.join(SCREENSHOTS_DIR, filename)
            with open(dest_path, "wb") as f:
                f.write(base64.b64decode(res["result"]["data"]))
            print(f"[+] Successfully captured Tab '{tab_name}' -> {dest_path}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_id}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_8tabs())
