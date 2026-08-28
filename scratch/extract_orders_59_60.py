import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def extract_last_assistant_msgs():
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
            return msgs.map(m => m.innerText);
        })()
        """
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": js, "returnByValue": True}
        }
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        msgs = res.get("result", {}).get("result", {}).get("value", [])
        print(f"Total assistant messages found: {len(msgs)}")
        
        for i, m in enumerate(msgs[-3:]):
            print(f"\n{'='*40} MESSAGE {i+1} {'='*40}")
            print(m)
            
        with open(r"g:\project\TEST\1\scratch\qwen_orders_59_60.txt", "w", encoding="utf-8") as f:
            f.write("\n\n---\n\n".join(msgs[-3:]))

if __name__ == "__main__":
    asyncio.run(extract_last_assistant_msgs())
