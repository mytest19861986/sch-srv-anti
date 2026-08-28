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

async def send_order61_now():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    print(f"[+] Connecting to Qwen: {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        escaped = json.dumps(REPORT_ORDER61)
        
        js = f"""
        (() => {{
            const ta = document.querySelector('textarea.message-input-textarea, textarea');
            if (!ta) return 'no textarea';
            
            ta.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, {escaped});
            
            const btn = document.querySelector('button.send-button');
            let clicked = false;
            if (btn && !btn.disabled && !btn.className.includes('disabled')) {{
                btn.click();
                clicked = true;
            }}
            
            return {{
                taValLen: ta.value.length,
                btnDisabled: btn ? btn.disabled : null,
                btnClass: btn ? btn.className : null,
                clicked
            }};
        }})()
        """
        msg = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print(json.dumps(res, ensure_ascii=False, indent=2))

        await asyncio.sleep(0.5)

        # Force click if needed
        js2 = """
        (() => {
            const btn = document.querySelector('button.send-button');
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('disabled');
                btn.click();
                return 'clicked_force';
            }
            return 'no_btn';
        })()
        """
        await ws.send(json.dumps({"id": 2, "method": "Runtime.evaluate", "params": {"expression": js2, "returnByValue": True}}))
        res2 = json.loads(await ws.recv())
        print("Force click result:", res2)

        # Enter key
        press_enter = {
            "id": 3,
            "method": "Input.dispatchKeyEvent",
            "params": {"type": "keyDown", "windowsVirtualKeyCode": 13, "text": "\r", "code": "Enter", "key": "Enter"}
        }
        await ws.send(json.dumps(press_enter))
        await ws.recv()
        release_enter = {
            "id": 4,
            "method": "Input.dispatchKeyEvent",
            "params": {"type": "keyUp", "windowsVirtualKeyCode": 13, "text": "\r", "code": "Enter", "key": "Enter"}
        }
        await ws.send(json.dumps(release_enter))
        await ws.recv()
        print("[+] Dispatched Enter")

if __name__ == "__main__":
    asyncio.run(send_order61_now())
