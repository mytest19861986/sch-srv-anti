import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def extract_new_response():
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
            const allAssistant = Array.from(document.querySelectorAll('.qwen-chat-message-assistant .custom-qwen-markdown, .chat-response-message .custom-qwen-markdown'));
            const last = allAssistant[allAssistant.length - 1];
            return {
                totalAssistant: allAssistant.length,
                text: last ? last.innerText : 'none'
            };
        })()
        """
        msg = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        val = res.get("result", {}).get("result", {}).get("value", {})
        print("Total Assistant Messages:", val.get("totalAssistant"))
        print("\n" + "=" * 80)
        print("COMMANDER RESPONSE:\n")
        print(val.get("text", ""))
        print("=" * 80)

        with open(r"g:\project\TEST\1\scratch\commander_order60_final_response.txt", "w", encoding="utf-8") as f:
            f.write(val.get("text", ""))

if __name__ == "__main__":
    asyncio.run(extract_new_response())
