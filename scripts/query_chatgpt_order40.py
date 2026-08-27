import json
import urllib.request
import websockets
import asyncio
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

PROMPT = """You are a Senior Product Architect reviewing the complete Information Architecture (IA) of a school-transport platform ("ServiceYar") for Pilot readiness.
Context file (raw URL): https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/23-full-ia-inventory.md

The inventory lists every menu, section, page, and action of:
1) School Admin Web Dashboard  2) Super Admin Web Dashboard
3) Driver Android App          4) Parent Android App

Task:
- Cross-check against the full school-transport domain: enrollment, routes/stops, fleets, shifts, attendance, notifications, billing, reports, safety/compliance, user lifecycle, support.
- Identify MISSING items: P0 (critical for Pilot), P1 (important for V1), P2 (later).
- Flag redundant/over-engineered sections to defer.

Deliver:
- Gap table: Priority | App | Missing Item | Rationale | Minimal Viable Design
- Executive summary (one paragraph) for the product manager
- Top-3 recommendations before Pilot
"""

DOCS_DIR = r"g:\project\TEST\1\docs"
OUT_FILE = os.path.join(DOCS_DIR, "CHATGPT_IA_REVIEW.md")

async def send_to_chatgpt():
    tabs_data = json.loads(urllib.request.urlopen("http://127.0.0.1:9222/json").read().decode())
    gpt_tab = next((t for t in tabs_data if "chatgpt.com" in t.get("url", "")), None)
    if not gpt_tab:
        print("[!] No ChatGPT tab found, creating simulation or writing directly.", flush=True)
        return False

    ws_url = gpt_tab["webSocketDebuggerUrl"]
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        print("[*] Inserting prompt into ChatGPT...", flush=True)
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {
                "expression": f"""
                (() => {{
                    const el = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
                    if (!el) return 'no_input';
                    el.focus();
                    document.execCommand('insertText', false, {json.dumps(PROMPT)});
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    return 'inserted';
                }})()
                """,
                "returnByValue": True
            }
        }
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print("Insert res:", res, flush=True)

        await asyncio.sleep(0.5)

        press_enter = {
            "id": 2,
            "method": "Input.dispatchKeyEvent",
            "params": {
                "type": "keyDown",
                "windowsVirtualKeyCode": 13,
                "nativeVirtualKeyCode": 13,
                "macCharCode": 13,
                "unmodifiedText": "\r",
                "text": "\r",
                "key": "Enter",
                "code": "Enter"
            }
        }
        await ws.send(json.dumps(press_enter))
        await ws.recv()

        release_enter = {
            "id": 3,
            "method": "Input.dispatchKeyEvent",
            "params": {
                "type": "keyUp",
                "windowsVirtualKeyCode": 13,
                "nativeVirtualKeyCode": 13,
                "macCharCode": 13,
                "unmodifiedText": "\r",
                "text": "\r",
                "key": "Enter",
                "code": "Enter"
            }
        }
        await ws.send(json.dumps(release_enter))
        await ws.recv()
        print("[+] Sent prompt to ChatGPT.", flush=True)
        return True

asyncio.run(send_to_chatgpt())
