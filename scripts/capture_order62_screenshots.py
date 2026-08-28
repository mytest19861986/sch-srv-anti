import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def capture_v17_resolutions():
    req = urllib.request.Request("http://127.0.0.1:9222/json/new?http://localhost:3002", method="PUT")
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

        # 1. Capture 1366x768 (Laptop view)
        await cdp_call("Emulation.setDeviceMetricsOverride", {
            "width": 1366,
            "height": 768,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await asyncio.sleep(1.2)

        res1 = await cdp_call("Page.captureScreenshot", {"format": "png"})
        p1 = os.path.join(SCREENSHOTS_DIR, "super-admin-actions-organized-1366.png")
        with open(p1, "wb") as f:
            f.write(base64.b64decode(res1["result"]["data"]))
        print(f"[+] Saved screenshot 1366: {p1}")

        # 2. Capture 1920x1080 (FHD view)
        await cdp_call("Emulation.setDeviceMetricsOverride", {
            "width": 1920,
            "height": 1080,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await asyncio.sleep(1.2)

        res2 = await cdp_call("Page.captureScreenshot", {"format": "png"})
        p2 = os.path.join(SCREENSHOTS_DIR, "super-admin-actions-organized-1920.png")
        with open(p2, "wb") as f:
            f.write(base64.b64decode(res2["result"]["data"]))
        print(f"[+] Saved screenshot 1920: {p2}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_id}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_v17_resolutions())
