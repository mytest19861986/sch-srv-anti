import json
import urllib.request
import websockets
import asyncio
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

async def monitor_commander():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    if not qwen_ws:
        print("[-] Qwen tab not found")
        return

    print(f"[+] Monitoring Commander tab: {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        t0 = time.time()
        prev_len = 0
        stable_count = 0

        while True:
            await asyncio.sleep(4)
            elapsed = int(time.time() - t0)

            # Check if stop button exists / still generating
            js_check = """
            (() => {
                const stopBtn = document.querySelector('button[aria-label*="Stop" i], button[class*="stopBtn"], [class*="stop-icon"]');
                const isGenerating = !!stopBtn;
                
                // Get all message items
                const msgs = document.querySelectorAll('.chat-message, [class*="message-item"], [class*="chat-item"]');
                let lastText = "";
                if (msgs.length > 0) {
                    lastText = msgs[msgs.length - 1].innerText;
                } else {
                    lastText = document.body.innerText.slice(-2000);
                }
                return { isGenerating, length: lastText.length, snippet: lastText.slice(-300), fullText: lastText };
            })()
            """
            msg = {
                "id": int(time.time()),
                "method": "Runtime.evaluate",
                "params": {"expression": js_check, "returnByValue": True}
            }
            await ws.send(json.dumps(msg))
            raw = await ws.recv()
            data = json.loads(raw).get("result", {}).get("result", {}).get("value", {})

            is_gen = data.get("isGenerating", False)
            cur_len = data.get("length", 0)

            print(f"[{elapsed}s] Generating: {is_gen} | Msg Length: {cur_len} chars")

            if not is_gen and cur_len > 100:
                if cur_len == prev_len:
                    stable_count += 1
                    if stable_count >= 2:
                        print("\n[+] Commander response generation is 100% complete and stable!")
                        print("=" * 80)
                        print(data.get("snippet", ""))
                        print("=" * 80)
                        
                        # Save full response to scratch
                        with open(r"g:\project\TEST\1\scratch\commander_latest_response.txt", "w", encoding="utf-8") as f:
                            f.write(data.get("fullText", ""))
                        break
                else:
                    stable_count = 0
            prev_len = cur_len

            if elapsed > 900: # 15 minutes rule
                print("[-] 15-minute timeout reached. Will refresh.")
                break

if __name__ == "__main__":
    asyncio.run(monitor_commander())
