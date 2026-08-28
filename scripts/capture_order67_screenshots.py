import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def capture_all_v23():
    # Helper to capture a page
    async def capture_tab(url, output_filename, mobile=True, fill_login=None):
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
            if mobile:
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

            await asyncio.sleep(2)

            if fill_login:
                # Fill credentials and submit
                await call("Runtime.evaluate", {
                    "expression": f"""
                      document.getElementById('login-email').value = '{fill_login['email']}';
                      document.getElementById('login-password').value = '{fill_login['password']}';
                      document.getElementById('form-login').dispatchEvent(new Event('submit', {{ cancelable: true }}));
                    """
                })
                await asyncio.sleep(3)

            res = await call("Page.captureScreenshot", {"format": "png"})
            out_path = os.path.join(SCREENSHOTS_DIR, output_filename)
            with open(out_path, "wb") as f:
                f.write(base64.b64decode(res["result"]["data"]))
            print(f"[+] Saved {output_filename}")

        try:
            urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab['id']}")
        except Exception:
            pass

    # 1. v23-parent-login-gate.png
    await capture_tab("http://localhost:3004", "v23-parent-login-gate.png", mobile=True)

    # 2. v23-driver-login-gate.png
    await capture_tab("http://localhost:3003", "v23-driver-login-gate.png", mobile=True)

    # 3. v23-parent-real-data.png
    await capture_tab("http://localhost:3004", "v23-parent-real-data.png", mobile=True, fill_login={
        "email": "parent@serviceyar.ir",
        "password": "ParentPass@123"
    })

    # 4. v23-wifi-phone-login.png
    await capture_tab("http://192.168.1.110:3004", "v23-wifi-phone-login.png", mobile=True)

if __name__ == "__main__":
    asyncio.run(capture_all_v23())
