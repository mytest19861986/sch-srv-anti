import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def click_submit():
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
            if (!ta) return 'no_textarea';
            
            // Search all siblings or parent buttons
            let container = ta.parentElement;
            while (container && !container.querySelector('button')) {
                container = container.parentElement;
            }
            if (container) {
                const btns = Array.from(container.querySelectorAll('button'));
                const lastBtn = btns[btns.length - 1];
                if (lastBtn) {
                    lastBtn.click();
                    return { clicked: true, btnText: lastBtn.innerText, aria: lastBtn.getAttribute('aria-label') };
                }
            }
            return 'no_btn';
        })()
        """
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": js, "returnByValue": True}
        }
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print(json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(click_submit())
