import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def capture_v22():
    url = "https://github.com/mytest19861986/sch-srv-anti/tree/v1.2.0"
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
        await call("Emulation.setDeviceMetricsOverride", {
            "width": 1366,
            "height": 768,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        await asyncio.sleep(2.5)

        res = await call("Page.captureScreenshot", {"format": "png"})
        out_path = os.path.join(SCREENSHOTS_DIR, "v22-github-release-v120-tree.png")
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(res["result"]["data"]))
        print(f"[+] Saved Screenshot v22: {out_path}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab['id']}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_v22())
