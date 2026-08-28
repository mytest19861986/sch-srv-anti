import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def inspect_input():
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
            const inputs = Array.from(document.querySelectorAll('textarea, [contenteditable="true"], input[type="text"]'));
            return inputs.map(el => ({
                tag: el.tagName,
                className: el.className,
                placeholder: el.getAttribute('placeholder') || el.getAttribute('data-placeholder'),
                isContentEditable: el.isContentEditable,
                rect: el.getBoundingClientRect()
            }));
        })()
        """
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": js, "returnByValue": True}
        }
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print(json.dumps(res.get("result", {}).get("result", {}).get("value", []), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(inspect_input())
