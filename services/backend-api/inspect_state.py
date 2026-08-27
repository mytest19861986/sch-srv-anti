import asyncio
import json
import urllib.request
import websockets

def get_tabs():
    req = urllib.request.Request("http://127.0.0.1:9222/json/list")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

async def check():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", "") and t.get("type") == "page")
    ws = await websockets.connect(qwen_tab["webSocketDebuggerUrl"], max_size=20*1024*1024)
    
    msg = {"id": 1, "method": "Runtime.evaluate", "params": {
        "expression": """
        (() => {
            const stopBtn = !!document.querySelector(".stop-button, button[aria-label='Stop']");
            const fullText = document.body.innerText;
            return JSON.stringify({
                hasStopBtn: stopBtn,
                fullLength: fullText.length,
                tail: fullText.slice(-600)
            });
        })()
        """,
        "returnByValue": True
    }}
    await ws.send(json.dumps(msg))
    res = json.loads(await ws.recv())
    val = res.get("result", {}).get("result", {}).get("value")
    data = json.loads(val)
    print(f"StopBtn Active: {data['hasStopBtn']}")
    print(f"Total Text Length: {data['fullLength']}")
    print("--- Tail ---")
    print(data['tail'])
    await ws.close()

asyncio.run(check())
