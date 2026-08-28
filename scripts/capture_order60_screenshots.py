import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

DOCS_RELEASES = r"g:\project\TEST\1\docs\releases"
os.makedirs(DOCS_RELEASES, exist_ok=True)

async def capture_screenshots():
    # 1. Open new tab in Brave via CDP HTTP
    req = urllib.request.Request("http://127.0.0.1:9222/json/new?http://localhost:3002", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tab_info = json.loads(resp.read().decode('utf-8'))
    
    ws_url = tab_info["webSocketDebuggerUrl"]
    tab_id = tab_info["id"]
    print(f"Opened new tab {tab_id}: {ws_url}")

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

        await asyncio.sleep(1.5)

        # 1. Capture Overview (5 actions on each row + dynamic KPIs)
        res = await cdp_call("Page.captureScreenshot", {"format": "png"})
        img_b64 = res["result"]["data"]
        p1 = os.path.join(DOCS_RELEASES, "v15-super-admin-tenants-actions.png")
        with open(p1, "wb") as f:
            f.write(base64.b64decode(img_b64))
        print(f"[+] Saved screenshot 1: {p1}")

        # 2. Navigate to /tenants/tenant-school-mehr/manage
        await cdp_call("Page.navigate", {"url": "http://localhost:3002/tenants/tenant-school-mehr/manage"})
        await asyncio.sleep(1.5)

        res = await cdp_call("Page.captureScreenshot", {"format": "png"})
        img_b64 = res["result"]["data"]
        p2 = os.path.join(DOCS_RELEASES, "v15-super-admin-manage-tabs.png")
        with open(p2, "wb") as f:
            f.write(base64.b64decode(img_b64))
        print(f"[+] Saved screenshot 2: {p2}")

        # 3. Trigger student edit / active working state
        await cdp_call("Runtime.evaluate", {
            "expression": """
            (() => {
                const tr = document.querySelector('#std-row-std-101');
                if (tr) {
                    tr.style.outline = '3px solid #6366f1';
                    tr.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
                }
            })()
            """
        })
        await asyncio.sleep(0.5)

        res = await cdp_call("Page.captureScreenshot", {"format": "png"})
        img_b64 = res["result"]["data"]
        p3 = os.path.join(DOCS_RELEASES, "v15-super-admin-edit-working.png")
        with open(p3, "wb") as f:
            f.write(base64.b64decode(img_b64))
        print(f"[+] Saved screenshot 3: {p3}")

    # Close test tab
    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_id}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_screenshots())
