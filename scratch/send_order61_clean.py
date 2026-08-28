import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r"g:\project\TEST\1\scratch\send_report_order61.py", "r", encoding="utf-8") as f:
    code = f.read()

start = code.find('REPORT_ORDER61 = """') + 20
end = code.find('"""\n\nasync def')
REPORT_ORDER61 = code[start:end]

async def send_order61_clean():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    print(f"[+] Connecting: {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        escaped = json.dumps(REPORT_ORDER61)
        
        # Focus textarea and insert
        js = f"""
        (() => {{
            const ta = document.querySelector('textarea.message-input-textarea, textarea');
            if (!ta) return 'no_ta';
            ta.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, {escaped});
            return {{ valLen: ta.value.length }};
        }})()
        """
        await ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}))
        res = json.loads(await ws.recv())
        print("Insert:", res)

        await asyncio.sleep(0.8)

        # Click send button
        js_click = """
        (() => {
            const btn = document.querySelector('button.send-button');
            if (btn && !btn.disabled) {
                btn.click();
                return 'clicked_enabled';
            }
            return 'not_clicked';
        })()
        """
        await ws.send(json.dumps({"id": 2, "method": "Runtime.evaluate", "params": {"expression": js_click, "returnByValue": True}}))
        res_click = json.loads(await ws.recv())
        print("Click:", res_click)

        # Dispatch physical Enter
        await ws.send(json.dumps({
            "id": 3,
            "method": "Input.dispatchKeyEvent",
            "params": {"type": "keyDown", "windowsVirtualKeyCode": 13, "text": "\r", "code": "Enter", "key": "Enter"}
        }))
        await ws.recv()
        await ws.send(json.dumps({
            "id": 4,
            "method": "Input.dispatchKeyEvent",
            "params": {"type": "keyUp", "windowsVirtualKeyCode": 13, "text": "\r", "code": "Enter", "key": "Enter"}
        }))
        await ws.recv()
        print("[+] Dispatched Enter key")

if __name__ == "__main__":
    asyncio.run(send_order61_clean())
