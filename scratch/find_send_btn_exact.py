import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def find_send_btn_exact():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        js = """
        (() => {
            const ta = document.querySelector('textarea.message-input-textarea');
            if (!ta) return 'no textarea';
            
            // Search all elements near textarea that are clickable or svg or div buttons
            let p = ta.parentElement;
            let found = [];
            for (let i = 0; i < 5 && p; i++) {
                const clickable = p.querySelectorAll('button, svg, [role="button"], div[class*="send"], div[class*="submit"], div[class*="btn"]');
                clickable.forEach(c => {
                    found.push({
                        tag: c.tagName,
                        className: c.className,
                        aria: c.getAttribute('aria-label'),
                        role: c.getAttribute('role'),
                        rect: c.getBoundingClientRect()
                    });
                });
                p = p.parentElement;
            }
            return found;
        })()
        """
        msg = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print(json.dumps(res.get("result", {}).get("result", {}).get("value", []), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(find_send_btn_exact())
