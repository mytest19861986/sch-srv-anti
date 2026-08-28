import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def click_send_explicit():
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
            const inputEl = document.querySelector('textarea, [contenteditable="true"], .chat-input');
            const hasText = inputEl ? (inputEl.value || inputEl.innerText || '').length : 0;
            
            // Search for send button
            const allBtns = Array.from(document.querySelectorAll('button'));
            const sendBtn = allBtns.find(b => {
                const aria = (b.getAttribute('aria-label') || '').toLowerCase();
                const cls = (b.className || '').toLowerCase();
                const text = (b.innerText || '').toLowerCase();
                return aria.includes('send') || cls.includes('send') || text.includes('send') || (b.querySelector('svg') && !b.disabled && b.offsetWidth > 10);
            });
            
            let clicked = false;
            if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
                clicked = true;
            }
            
            return { hasText, clicked, btnFound: !!sendBtn, btnDisabled: sendBtn ? sendBtn.disabled : null };
        })()
        """
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": js, "returnByValue": True}
        }
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print("Click send result:", json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(click_send_explicit())
