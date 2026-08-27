import asyncio
import json
import sys
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

def get_tabs():
    req = urllib.request.Request("http://127.0.0.1:9222/json/list")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

async def monitor():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", "") and t.get("type") == "page")
    ws = await websockets.connect(qwen_tab["webSocketDebuggerUrl"], max_size=20*1024*1024)
    
    last_len = 0
    stable_count = 0
    
    for i in range(120):
        msg = {"id": i + 1, "method": "Runtime.evaluate", "params": {
            "expression": """
            (() => {
                const stopBtn = !!document.querySelector(".stop-button, button[aria-label='Stop']");
                const fullText = document.body.innerText;
                return JSON.stringify({
                    hasStopBtn: stopBtn,
                    fullLength: fullText.length,
                    tail: fullText.slice(-300)
                });
            })()
            """,
            "returnByValue": True
        }}
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        val = res.get("result", {}).get("result", {}).get("value")
        data = json.loads(val)
        
        has_stop = data["hasStopBtn"]
        curr_len = data["fullLength"]
        print(f"[{i*3}s] StopBtn: {has_stop} | Length: {curr_len}", flush=True)
        
        if not has_stop:
            if curr_len == last_len:
                stable_count += 1
                if stable_count >= 2:
                    print("\n🎉 Commander response is 100% COMPLETE!\n", flush=True)
                    break
            else:
                stable_count = 0
                last_len = curr_len
        
        await asyncio.sleep(3)

    # Fetch the exact response text
    msg = {"id": 999, "method": "Runtime.evaluate", "params": {
        "expression": """
        (() => {
            const text = document.body.innerText;
            const marker = "گزارش اجرای دستور کار شماره ۱۰";
            const idx = text.lastIndexOf(marker);
            if (idx !== -1) {
                return text.slice(idx);
            }
            return text.slice(-4000);
        })()
        """,
        "returnByValue": True
    }}
    await ws.send(json.dumps(msg))
    res = json.loads(await ws.recv())
    final_text = res.get("result", {}).get("result", {}).get("value")
    
    with open("g:/project/TEST/1/services/backend-api/latest_commander_order.txt", "w", encoding="utf-8") as f:
        f.write(final_text)
    
    print("\n--- Order Saved to latest_commander_order.txt ---", flush=True)
    await ws.close()

asyncio.run(monitor())
