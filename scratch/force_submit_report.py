import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r"g:\project\TEST\1\scratch\send_report_order60.py", "r", encoding="utf-8") as f:
    code = f.read()

start = code.find('REPORT_TEXT = """') + 17
end = code.find('"""\n\nasync def')
REPORT_TEXT = code[start:end]

async def force_submit_report():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    print(f"[+] Connecting to Qwen: {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        escaped_text = json.dumps(REPORT_TEXT)
        
        # Focus, set value and trigger input
        js_step1 = f"""
        (() => {{
            const ta = document.querySelector('textarea.message-input-textarea, textarea');
            if (!ta) return 'no_textarea';
            ta.focus();
            
            // Native React/Vue input setter
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            setter.call(ta, {escaped_text});
            ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
            ta.dispatchEvent(new Event('change', {{ bubbles: true }}));
            
            return {{ ok: true, len: ta.value.length }};
        }})()
        """
        await ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": js_step1, "returnByValue": True}}))
        res1 = json.loads(await ws.recv())
        print("Step 1 (Populate Textarea):", res1)

        await asyncio.sleep(1.0)

        # Step 2: Click the submit button inside the input container
        js_step2 = """
        (() => {
            const ta = document.querySelector('textarea.message-input-textarea, textarea');
            const btns = Array.from(document.querySelectorAll('button'));
            
            // Priority 1: button with aria-label="Send" or Send icon
            let sendBtn = btns.find(b => (b.getAttribute('aria-label') || '').toLowerCase().includes('send'));
            if (!sendBtn) {
                sendBtn = btns.find(b => b.className.includes('send') || b.querySelector('svg'));
            }
            
            if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
                return { clicked: true, aria: sendBtn.getAttribute('aria-label'), class: sendBtn.className };
            }
            return { clicked: false, totalBtns: btns.length };
        })()
        """
        await ws.send(json.dumps({"id": 2, "method": "Runtime.evaluate", "params": {"expression": js_step2, "returnByValue": True}}))
        res2 = json.loads(await ws.recv())
        print("Step 2 (Click Send Button):", res2)

        await asyncio.sleep(0.5)

        # Step 3: Dispatch physical Enter key just in case
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
        print("Step 3: Dispatched Enter Key")

if __name__ == "__main__":
    asyncio.run(force_submit_report())
