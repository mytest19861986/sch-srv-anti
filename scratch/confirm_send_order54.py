import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9222/json').read().decode())
    qwen = next((t for t in tabs if 'chat.qwen.ai' in t.get('url', '') and t.get('type') == 'page'), None)
    if not qwen:
        return

    ws_url = qwen['webSocketDebuggerUrl']
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        js = """
        (() => {
            const textarea = document.querySelector('textarea, div[contenteditable="true"], [class*="input"] textarea, [class*="chat-input"]');
            if (textarea && textarea.value && textarea.value.trim().length > 0) {
                // Find send button
                const btn = document.querySelector('button[aria-label="Send"], button.send-button, [class*="send"] button, button:has(svg)');
                if (btn) {
                    btn.click();
                    return 'Clicked send button';
                }
            }
            return 'Already sent or empty';
        })()
        """
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        print(res)

if __name__ == "__main__":
    asyncio.run(main())
