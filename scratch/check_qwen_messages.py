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
        print("No Qwen tab found.")
        return

    ws_url = qwen['webSocketDebuggerUrl']
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        js = """
        (() => {
            // Get all user messages and assistant messages
            const userMsgs = Array.from(document.querySelectorAll('[class*="user-message"], [class*="userMessage"], [class*="chat-item-right"], [class*="human-message"]')).map(el => el.innerText.trim());
            const allMsgs = Array.from(document.querySelectorAll('.custom-qwen-markdown, .markdown-body, [class*="message-content"]')).map(el => el.innerText.trim());
            const textarea = document.querySelector('textarea, div[contenteditable="true"], [class*="input"] textarea');
            
            return JSON.stringify({
                userMsgsCount: userMsgs.length,
                lastUserMsg: userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].substring(0, 150) : null,
                allMsgsCount: allMsgs.length,
                lastMsg: allMsgs.length > 0 ? allMsgs[allMsgs.length - 1].substring(0, 150) : null,
                textareaContent: textarea ? (textarea.value || textarea.innerText || '') : null
            }, null, 2);
        })()
        """
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        val_str = res.get('result', {}).get('result', {}).get('value', '{}')
        print(val_str)

if __name__ == "__main__":
    asyncio.run(main())
