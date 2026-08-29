import urllib.request
import json
import base64
import websockets
import asyncio
import os

QA_DIR = r"g:\project\TEST\1\temp\qa"
os.makedirs(QA_DIR, exist_ok=True)

async def capture_order74():
    url_parent = "http://localhost:3004"
    req = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_parent}", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tab_p = json.loads(resp.read().decode('utf-8'))

    async with websockets.connect(tab_p["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws:
        async def call_p(method, params=None):
            msg_id = int(asyncio.get_event_loop().time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res

        await call_p("Page.enable")
        await call_p("Runtime.enable")
        await call_p("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })

        await asyncio.sleep(1)

        # 1. Capture PWA Install Banner on Mobile Screen
        res1 = await call_p("Page.captureScreenshot", {"format": "png"})
        with open(os.path.join(QA_DIR, "qa-074-pwa-install-banner.png"), "wb") as f:
            f.write(base64.b64decode(res1["result"]["data"]))
        print("[+] Captured: qa-074-pwa-install-banner.png")

        # 2. Click Install App button to open guide modal
        await call_p("Runtime.evaluate", {"expression": "document.getElementById('btn-pwa-install')?.click();"})
        await asyncio.sleep(1)

        res2 = await call_p("Page.captureScreenshot", {"format": "png"})
        with open(os.path.join(QA_DIR, "qa-074-pwa-install-guide-modal.png"), "wb") as f:
            f.write(base64.b64decode(res2["result"]["data"]))
        print("[+] Captured: qa-074-pwa-install-guide-modal.png")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_p['id']}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_order74())
