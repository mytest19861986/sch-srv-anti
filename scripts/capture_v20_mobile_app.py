import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def capture_v20():
    # Extract assets/www/index.html to a temporary file or serve it
    import zipfile
    apk_path = r"g:\project\TEST\1\docs\releases\ir.serviceyar.driver-v1.2.0.apk"
    with zipfile.ZipFile(apk_path, "r") as zf:
        html = zf.read("assets/www/index.html").decode('utf-8')

    temp_html_path = r"g:\project\TEST\1\docs\screenshots\mobile_preview.html"
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html)

    url_preview = f"file:///{temp_html_path.replace(chr(92), '/')}"
    
    req = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_preview}", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tab_info = json.loads(resp.read().decode('utf-8'))
    
    ws_url = tab_info["webSocketDebuggerUrl"]
    tab_id = tab_info["id"]

    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        async def call(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res

        await call("Page.enable")
        # Mobile Device Metrics (Pixel 7 / Samsung Galaxy: 412x915)
        await call("Emulation.setDeviceMetricsOverride", {
            "width": 412,
            "height": 915,
            "deviceScaleFactor": 2.625,
            "mobile": True
        })
        await asyncio.sleep(1.0)

        res = await call("Page.captureScreenshot", {"format": "png"})
        out_path = os.path.join(SCREENSHOTS_DIR, "v20-mobile-driver-app-login.png")
        with open(out_path, "wb") as f:
            f.write(base64.b64decode(res["result"]["data"]))
        print(f"[+] Saved Screenshot v20: {out_path}")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_id}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_v20())
