import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def check_newest():
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
            const msgs = Array.from(document.querySelectorAll('.qwen-chat-message-assistant .custom-qwen-markdown, .chat-response-message .custom-qwen-markdown'));
            const last = msgs[msgs.length - 1];
            return { total: msgs.length, text: last ? last.innerText : '' };
        })()
        """
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": js, "returnByValue": True}
        }
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        val = res.get("result", {}).get("result", {}).get("value", {})
        print(f"Total assistant messages: {val.get('total')}")
        print("Last message snippet:\n", val.get("text", "")[-400:])

if __name__ == "__main__":
    asyncio.run(check_newest())
