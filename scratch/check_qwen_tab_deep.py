import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    try:
        tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9222/json').read().decode())
    except Exception as e:
        print("Failed to connect to CDP:", e)
        return

    print("Open tabs in Brave:")
    for i, t in enumerate(tabs):
        print(f"[{i}] {t.get('title', '')} | {t.get('url', '')} | {t.get('type', '')}")

    qwen = next((t for t in tabs if 'chat.qwen.ai' in t.get('url', '') and t.get('type') == 'page'), None)
    if not qwen:
        print("\nNo Qwen page tab found!")
        return

    print(f"\nFound Qwen tab: {qwen.get('url')}")
    ws_url = qwen['webSocketDebuggerUrl']
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        js = """
        (() => {
            const currentUrl = window.location.href;
            const title = document.title;
            const textarea = document.querySelector('textarea, div[contenteditable="true"], [class*="input"] textarea, [class*="chat-input"]');
            const messages = Array.from(document.querySelectorAll('.custom-qwen-markdown, .markdown-body, [class*="response-content"], [class*="message-content"], [class*="chat-message"]'));
            
            return JSON.stringify({
                url: currentUrl,
                title: title,
                hasTextarea: !!textarea,
                textareaTag: textarea ? textarea.tagName : null,
                textareaVal: textarea ? (textarea.value || textarea.innerText || '') : null,
                messageCount: messages.length,
                last3Messages: messages.slice(-3).map(m => m.innerText.substring(0, 100))
            }, null, 2);
        })()
        """
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        print("Qwen tab details:")
        print(res.get('result', {}).get('result', {}).get('value', '{}'))

if __name__ == "__main__":
    asyncio.run(main())
