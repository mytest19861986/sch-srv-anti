import json
import urllib.request
import websockets
import asyncio
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

async def watch_commander_exact():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    print(f"[+] Connecting to Qwen CDP: {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        t0 = time.time()
        last_len = 0
        stable_cycles = 0

        while True:
            await asyncio.sleep(4)
            elapsed = int(time.time() - t0)

            js = """
            (() => {
                const stopBtn = document.querySelector('button[aria-label*="Stop" i], button[class*="stopBtn"], [class*="stop-icon"]');
                const isGenerating = !!stopBtn;
                
                const msgs = Array.from(document.querySelectorAll('.qwen-chat-message-assistant .custom-qwen-markdown, .chat-response-message .custom-qwen-markdown'));
                const latest = msgs[msgs.length - 1];
                const fullText = latest ? latest.innerText : '';
                return {
                    totalMsgs: msgs.length,
                    isGenerating,
                    len: fullText.length,
                    snippet: fullText.slice(-250),
                    fullText
                };
            })()
            """
            msg = {"id": int(time.time()), "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}
            await ws.send(json.dumps(msg))
            raw = await ws.recv()
            data = json.loads(raw).get("result", {}).get("result", {}).get("value", {})

            is_gen = data.get("isGenerating", False)
            cur_len = data.get("len", 0)
            total = data.get("totalMsgs", 0)

            print(f"[{elapsed}s] Total Assistant Msgs: {total} | Generating: {is_gen} | Msg Len: {cur_len}")

            if not is_gen and cur_len > 100:
                if cur_len == last_len:
                    stable_cycles += 1
                    if stable_cycles >= 2:
                        print("\n[+] Response 100% COMPLETE AND STABLE!")
                        print("=" * 80)
                        print(data.get("fullText", ""))
                        print("=" * 80)
                        with open(r"g:\project\TEST\1\scratch\commander_order61_latest_response.txt", "w", encoding="utf-8") as f:
                            f.write(data.get("fullText", ""))
                        break
                else:
                    stable_cycles = 0
            last_len = cur_len

            if elapsed > 900:
                print("[-] 15-minute timeout")
                break

if __name__ == "__main__":
    asyncio.run(watch_commander_exact())
