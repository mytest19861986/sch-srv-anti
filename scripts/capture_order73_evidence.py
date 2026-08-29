import urllib.request
import json
import base64
import websockets
import asyncio
import time
import os

QA_DIR = r"g:\project\TEST\1\temp\qa"
os.makedirs(QA_DIR, exist_ok=True)

async def capture_order73():
    # 1. Capture Parent PWA Logged-in Dashboard (Children: Ali & Sara)
    url_parent = "http://localhost:3004"
    req = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_parent}", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tab_p = json.loads(resp.read().decode('utf-8'))

    async with websockets.connect(tab_p["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws:
        async def call_p(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
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
        login_script = """
        (() => {
            document.getElementById('login-email').value = 'parent@serviceyar.ir';
            document.getElementById('login-password').value = 'ParentPass@123';
            document.getElementById('form-login').dispatchEvent(new Event('submit', { cancelable: true }));
        })()
        """
        await call_p("Runtime.evaluate", {"expression": login_script})
        await asyncio.sleep(2)

        res = await call_p("Page.captureScreenshot", {"format": "png"})
        with open(os.path.join(QA_DIR, "qa-073-parent-dashboard-rendered.png"), "wb") as f:
            f.write(base64.b64decode(res["result"]["data"]))
        print("[+] Captured: qa-073-parent-dashboard-rendered.png")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_p['id']}")
    except Exception:
        pass

    # 2. Capture Driver PWA Logged-in Manifest
    url_driver = "http://localhost:3003"
    req_d = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_driver}", method="PUT")
    with urllib.request.urlopen(req_d) as resp_d:
        tab_d = json.loads(resp_d.read().decode('utf-8'))

    async with websockets.connect(tab_d["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws_d:
        async def call_d(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws_d.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws_d.recv())
                if res.get("id") == msg_id:
                    return res

        await call_d("Page.enable")
        await call_d("Runtime.enable")
        await call_d("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })

        await asyncio.sleep(1)
        login_driver_script = """
        (() => {
            document.getElementById('login-email').value = 'driver@serviceyar.ir';
            document.getElementById('login-password').value = 'DriverPass@123';
            document.getElementById('form-login').dispatchEvent(new Event('submit', { cancelable: true }));
        })()
        """
        await call_d("Runtime.evaluate", {"expression": login_driver_script})
        await asyncio.sleep(2)

        res_d = await call_d("Page.captureScreenshot", {"format": "png"})
        with open(os.path.join(QA_DIR, "qa-073-driver-manifest-rendered.png"), "wb") as f:
            f.write(base64.b64decode(res_d["result"]["data"]))
        print("[+] Captured: qa-073-driver-manifest-rendered.png")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_d['id']}")
    except Exception:
        pass

    # 3. Capture Persian Error Banner on Network failure
    url_err = "http://localhost:3004"
    req_e = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_err}", method="PUT")
    with urllib.request.urlopen(req_e) as resp_e:
        tab_e = json.loads(resp_e.read().decode('utf-8'))

    async with websockets.connect(tab_e["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws_e:
        async def call_e(method, params=None):
            msg_id = int(time.time() * 1000) % 1000000
            await ws_e.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws_e.recv())
                if res.get("id") == msg_id:
                    return res

        await call_e("Page.enable")
        await call_e("Runtime.enable")
        await call_e("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })

        await asyncio.sleep(1)
        err_script = """
        (() => {
            document.getElementById('login-email').value = 'wrong@email.ir';
            document.getElementById('login-password').value = 'wrong';
            document.getElementById('form-login').dispatchEvent(new Event('submit', { cancelable: true }));
        })()
        """
        await call_e("Runtime.evaluate", {"expression": err_script})
        await asyncio.sleep(1.5)

        res_e = await call_e("Page.captureScreenshot", {"format": "png"})
        with open(os.path.join(QA_DIR, "qa-073-error-banner-persian.png"), "wb") as f:
            f.write(base64.b64decode(res_e["result"]["data"]))
        print("[+] Captured: qa-073-error-banner-persian.png")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_e['id']}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(capture_order73())
