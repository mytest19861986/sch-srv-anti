import json
import base64
import os
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

DOCS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(DOCS_DIR, exist_ok=True)

PAGES_TO_CAPTURE = [
    ("super-admin-overview-v2.png", "http://localhost:3002/"),
    ("super-admin-tenants-v2.png", "http://localhost:3002/tenants"),
    ("super-admin-users.png", "http://localhost:3002/users"),
    ("super-admin-audit-log-v2.png", "http://localhost:3002/audit-logs"),
    ("super-admin-settings.png", "http://localhost:3002/settings"),
]

async def capture_all():
    tabs_data = json.loads(urllib.request.urlopen("http://127.0.0.1:9222/json").read().decode())
    target_tab = tabs_data[0]
    initial_url = target_tab.get("url", "https://chat.qwen.ai/c/705351c0-6d8e-4dd3-a432-b7d477017ed8")
    print(f"Using tab: {target_tab.get('title')} ({initial_url})", flush=True)

    async with websockets.connect(target_tab["webSocketDebuggerUrl"], max_size=50*1024*1024) as ws:
        # First set Super Admin cookie on port 3002
        await ws.send(json.dumps({
            "id": 1,
            "method": "Network.setCookie",
            "params": {
                "name": "session_token",
                "value": "mock_valid_token_super_admin",
                "domain": "localhost",
                "path": "/"
            }
        }))
        await ws.recv()

        await ws.send(json.dumps({
            "id": 2,
            "method": "Network.setCookie",
            "params": {
                "name": "user_role",
                "value": "SUPER_ADMIN",
                "domain": "localhost",
                "path": "/"
            }
        }))
        await ws.recv()

        # Viewport size
        await ws.send(json.dumps({
            "id": 3,
            "method": "Emulation.setDeviceMetricsOverride",
            "params": {
                "width": 1440,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            }
        }))
        await ws.recv()

        for idx, (filename, url) in enumerate(PAGES_TO_CAPTURE, start=20):
            print(f"\n--- Capturing {filename} ({url}) ---", flush=True)
            await ws.send(json.dumps({
                "id": idx * 10 + 1,
                "method": "Page.navigate",
                "params": {"url": url}
            }))
            await ws.recv()

            await asyncio.sleep(2.5)

            await ws.send(json.dumps({
                "id": idx * 10 + 2,
                "method": "Page.captureScreenshot",
                "params": {"format": "png"}
            }))
            res = json.loads(await ws.recv())
            img_data = base64.b64decode(res["result"]["data"])

            out_path = os.path.join(DOCS_DIR, filename)
            with open(out_path, "wb") as f:
                f.write(img_data)
            print(f"[+] Saved screenshot: {filename} ({len(img_data)} bytes)", flush=True)

        # Restore Qwen Tab
        print("\nRestoring Qwen tab navigation...", flush=True)
        await ws.send(json.dumps({
            "id": 999,
            "method": "Page.navigate",
            "params": {"url": "https://chat.qwen.ai/c/705351c0-6d8e-4dd3-a432-b7d477017ed8"}
        }))
        await ws.recv()
        print("[✔] Restored Qwen tab!", flush=True)

asyncio.run(capture_all())
