import json
import urllib.request
import websockets
import asyncio
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def main():
    tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9222/json').read().decode())
    qwen = next((t for t in tabs if 'chat.qwen.ai' in t.get('url', '') and t.get('type') == 'page'), None)
    if not qwen:
        print("No Qwen tab found.")
        return

    ws_url = qwen['webSocketDebuggerUrl']
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        start_time = time.time()
        last_length = 0
        unchanged_count = 0

        while True:
            await asyncio.sleep(6)
            msg = {
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": """
                    (() => {
                        const stopBtns = Array.from(document.querySelectorAll('button')).filter(b => 
                            b.innerText.includes('Stop') || 
                            b.getAttribute('aria-label') === 'Stop' ||
                            b.className.includes('stop')
                        );
                        const isGenerating = stopBtns.length > 0;
                        const isThinking = document.body.innerText.includes('Thinking') || 
                                           document.body.innerText.includes('در حال فکر');

                        const blocks = Array.from(document.querySelectorAll('.custom-qwen-markdown, .markdown-body, [class*="response-content"], [class*="message-content"]'));
                        const lastBlock = blocks[blocks.length - 1];
                        const text = lastBlock ? (lastBlock.innerText || '') : '';
                        
                        return JSON.stringify({
                            isBusy: isGenerating || isThinking,
                            textLength: text.length,
                            tail: text.substring(0, 100) + '...',
                            fullText: text
                        });
                    })()
                    """,
                    "returnByValue": True
                }
            }
            await ws.send(json.dumps(msg))
            res = json.loads(await ws.recv())
            val_str = res.get('result', {}).get('result', {}).get('value', '{}')
            data = json.loads(val_str)

            is_busy = data.get('isBusy', False)
            cur_len = data.get('textLength', 0)
            elapsed = int(time.time() - start_time)

            print(f"[{elapsed}s] Busy: {is_busy} | Length: {cur_len} | Tail: {data.get('tail', '')[:60]}")

            if not is_busy and cur_len > 100:
                if cur_len == last_length:
                    unchanged_count += 1
                else:
                    unchanged_count = 0
                    last_length = cur_len

                if unchanged_count >= 2:
                    print("\n=== GENERATION COMPLETE ===")
                    with open('scratch/qwen_order55.txt', 'w', encoding='utf-8') as f:
                        f.write(data.get('fullText', ''))
                    print("Saved response to scratch/qwen_order55.txt")
                    break
            else:
                unchanged_count = 0
                last_length = cur_len

if __name__ == "__main__":
    asyncio.run(main())
