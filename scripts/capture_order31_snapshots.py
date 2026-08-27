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
    ("school-overview-v2.png", "http://localhost:3001/"),
    ("school-students.png", "http://localhost:3001/students"),
    ("school-services.png", "http://localhost:3001/services"),
    ("school-events-report.png", "http://localhost:3001/reports/events"),
    ("school-audit-log.png", "http://localhost:3001/reports/audit-logs"),
    ("school-notification-log.png", "http://localhost:3001/reports/notifications"),
]

async def capture_all():
    tabs_data = json.loads(urllib.request.urlopen("http://127.0.0.1:9222/json").read().decode())
    target_tab = tabs_data[0]
    initial_url = target_tab.get("url", "https://chat.qwen.ai/c/705351c0-6d8e-4dd3-a432-b7d477017ed8")
    print(f"Using tab: {target_tab.get('title')} ({initial_url})", flush=True)

    async with websockets.connect(target_tab["webSocketDebuggerUrl"], max_size=50*1024*1024) as ws:
        # First log in on school-web to set cookie
        await ws.send(json.dumps({
            "id": 1,
            "method": "Network.setCookie",
            "params": {
                "name": "session_token",
                "value": "mock_valid_token_school_admin",
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
                "value": "SCHOOL_ADMIN",
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

        for idx, (filename, url) in enumerate(PAGES_TO_CAPTURE, start=10):
            print(f"\n--- Capturing {filename} ({url}) ---", flush=True)
            await ws.send(json.dumps({
                "id": idx * 10 + 1,
                "method": "Page.navigate",
                "params": {"url": url}
            }))
            await ws.recv()

            await asyncio.sleep(2)

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
