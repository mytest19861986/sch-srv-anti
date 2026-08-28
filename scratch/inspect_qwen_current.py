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
            const text = lastBlock ? (lastBlock.innerText || '') : '';
            const textarea = document.querySelector('textarea, div[contenteditable="true"], [class*="input"] textarea');
            const inputValue = textarea ? (textarea.value || textarea.innerText || '') : '';
            
            return JSON.stringify({
                totalBlocks: blocks.length,
                lastBlockText: text,
                inputValue: inputValue.substring(0, 100),
                isThinking: document.body.innerText.includes('Thinking')
            }, null, 2);
        })()
        """
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        val_str = res.get('result', {}).get('result', {}).get('value', '{}')
        print(val_str)

if __name__ == "__main__":
    asyncio.run(main())
