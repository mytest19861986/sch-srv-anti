import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def capture_pwa_v21():
    # 1. Capture Driver PWA (Port 3003)
    url_driver = "http://localhost:3003"
    req1 = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_driver}", method="PUT")
    with urllib.request.urlopen(req1) as resp:
        tab1 = json.loads(resp.read().decode('utf-8'))
    
    async with websockets.connect(tab1["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws:
        async def call(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res

        await call("Page.enable")
        await call("Emulation.setDeviceMetricsOverride", {
            "width": 412,
            "height": 915,
            "deviceScaleFactor": 2.625,
            "mobile": True
        })
        # Trigger PWA banner
        await call("Runtime.evaluate", {
            "expression": "document.getElementById('pwa-install-banner').classList.remove('hidden');"
        })
        await asyncio.sleep(1.0)
        res1 = await call("Page.captureScreenshot", {"format": "png"})
        p1 = os.path.join(SCREENSHOTS_DIR, "v21-driver-pwa-mobile-install.png")
        with open(p1, "wb") as f:
            f.write(base64.b64decode(res1["result"]["data"]))
        print(f"[+] Saved Driver PWA screenshot: {p1}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab1['id']}")
    except Exception:
        pass

    # 2. Capture Parent PWA (Port 3004)
    url_parent = "http://localhost:3004"
    req2 = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_parent}", method="PUT")
    with urllib.request.urlopen(req2) as resp:
        tab2 = json.loads(resp.read().decode('utf-8'))
    
    async with websockets.connect(tab2["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws:
        async def call(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res

        await call("Page.enable")
        await call("Emulation.setDeviceMetricsOverride", {
            "width": 412,
            "height": 915,
            "deviceScaleFactor": 2.625,
            "mobile": True
        })
        await call("Runtime.evaluate", {
            "expression": "document.getElementById('pwa-install-banner').classList.remove('hidden');"
        })
        await asyncio.sleep(1.0)
        res2 = await call("Page.captureScreenshot", {"format": "png"})
        p2 = os.path.join(SCREENSHOTS_DIR, "v21-parent-pwa-mobile-install.png")
        with open(p2, "wb") as f:
            f.write(base64.b64decode(res2["result"]["data"]))
        print(f"[+] Saved Parent PWA screenshot: {p2}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab2['id']}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_pwa_v21())
