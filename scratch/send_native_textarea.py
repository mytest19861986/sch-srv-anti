import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r"g:\project\TEST\1\scratch\send_report_order60.py", "r", encoding="utf-8") as f:
    code = f.read()

# Extract REPORT_TEXT
start = code.find('REPORT_TEXT = """') + 17
end = code.find('"""\n\nasync def')
REPORT_TEXT = code[start:end]

async def send_via_native_textarea():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    print(f"[+] Connecting to {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        escaped_text = json.dumps(REPORT_TEXT)
        js_insert = f"""
        (() => {{
            const ta = document.querySelector('textarea.message-input-textarea, textarea');
            if (!ta) return 'textarea_not_found';
            
            ta.focus();
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            nativeSetter.call(ta, {escaped_text});
            ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
            ta.dispatchEvent(new Event('change', {{ bubbles: true }}));
            
            return {{ inserted: true, length: ta.value.length }};
        }})()
        """
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": js_insert, "returnByValue": True}
        }
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print("Insert result:", res)

        await asyncio.sleep(0.8)

        # Click send button
        js_click = """
        (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const sendBtn = btns.find(b => {
                const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                const cls = (b.className || '').toLowerCase();
                return aria.includes('send') || cls.includes('send') || (b.closest('.message-input') && !b.disabled);
            });
            if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
                return 'clicked_button';
            }
            return 'btn_not_found';
        })()
        """
        msg_click = {
            "id": 2,
            "method": "Runtime.evaluate",
            "params": {"expression": js_click, "returnByValue": True}
        }
        await ws.send(json.dumps(msg_click))
        res_click = json.loads(await ws.recv())
        print("Click result:", res_click)

        # If button click was not enough, also send Enter key event
        if res_click.get("result", {}).get("result", {}).get("value") != "clicked_button":
            press_enter = {
                "id": 3,
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
                "id": 4,
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
            print("[+] Dispatched Enter key event")

if __name__ == "__main__":
    asyncio.run(send_via_native_textarea())
