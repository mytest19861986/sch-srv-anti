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
            const blocks = Array.from(document.querySelectorAll('.custom-qwen-markdown, .markdown-body, [class*="response-content"], [class*="message-content"]'));
            const lastBlock = blocks[blocks.length - 1];
            return lastBlock ? (lastBlock.innerText || '') : '';
        })()
        """
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        text = res.get('result', {}).get('result', {}).get('value', '')
        print("=== CURRENT COMMANDER OUTPUT ===")
        print(text)
        with open('scratch/qwen_order55_live_dump.txt', 'w', encoding='utf-8') as f:
            f.write(text)

if __name__ == "__main__":
    asyncio.run(main())
