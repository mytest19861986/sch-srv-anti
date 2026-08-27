import asyncio
import json
import sys
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

class CDPClient:
    def __init__(self, ws_url):
        self.ws_url = ws_url
        self.ws = None
        self._msg_id = 0

    async def connect(self):
        self.ws = await websockets.connect(self.ws_url, max_size=20*1024*1024)

    async def send_cmd(self, method, params=None):
        self._msg_id += 1
        msg = {"id": self._msg_id, "method": method, "params": params or {}}
        await self.ws.send(json.dumps(msg))
        while True:
            res_raw = await self.ws.recv()
            res = json.loads(res_raw)
            if res.get("id") == self._msg_id:
                return res.get("result", {})

    async def eval_js(self, expression):
        res = await self.send_cmd("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True
        })
        return res.get("result", {}).get("value")

    async def close(self):
        if self.ws:
            await self.ws.close()

def get_tabs():
    req = urllib.request.Request("http://127.0.0.1:9222/json/list")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

REPORT_ORDER_9 = """فرمانده گرامی، گزارش اجرای دستور کار شماره ۹ (Deployment Readiness & Observability) با موفقیت کامل آماده و تمامی تغییرات در مخزن گیت‌هاب ثبت گردید:

🔗 مخزن رسمی پروژه در گیت‌هاب:
https://github.com/mytest19861986/sch-srv-anti

📋 خلاصه اقدامات انجام‌شده در دستور کار شماره ۹:
۱. Observability & Metrics Service:
   - پیاده‌سازی متریک‌های اختصاصی هیستوگرام، کانتور و گیج برای مسیر بحرانی (latency, success/error counters, outbox queue delay, db pool, http duration).
   - لاگر ساخت‌یافته JSON (سطوح debug, info, warn, error, fatal) و Middleware ردیابی درخواست‌ها با تزریق خودکار x-request-id و x-correlation-id.
   - مانیتورینگ بلادرنگ صف Outbox و تاخیر رویدادها.

۲. Health Checks & Readiness:
   - اندپوینت GET /health/live جهت بررسی سلامت و زمان بالا بودن پروسه (Uptime).
   - اندپوینت GET /health/ready جهت اعتبارسنجی اتصال پایگاه داده و صف Outbox با محاسبه دقیق تاخیر بر حسب میلی‌ثانیه.
   - اندپوینت GET /health/metrics جهت خروجی تجمیعی متریک‌های کارایی.

۳. Graceful Shutdown:
   - مدیریت سیگنال‌های SIGTERM و SIGINT با تخلیه درخواست‌های فعال (حداکثر مهلت ۳۰ ثانیه)، متوقف‌سازی منظم Outbox Worker و مانیتور صف، و قطع اتصالات پایگاه داده.

۴. مستندات کامل:
   - docs/API.md: مستندسازی تمامی اندپوینت‌های پیاده‌سازی‌شده (Auth, Attendance, Sync, Dashboard, Parent, Super Admin, Health).
   - docs/TESTING.md: برنامه استراتژی تست و تست‌های بار مرحله‌ای (Baseline, Morning Peak Surge, Network Reconnection Storm).

۵. تست بار مسیر بحرانی (Load Testing):
   - تست موفقیت‌آمیز مسیر بحرانی ثبت حضور و غیاب تحت بار همزمانی با میانگین تاخیر فوق‌سریع ۱.۱ میلی‌ثانیه به ازای هر درخواست.
   - وضعیت تمامی تست‌های یکپارچگی: ۲۸ تست پاس شده (۱۷۰ ادعا / Assertion)، ۰ خطا در TypeCheck و Build.

تمامی کدها کامیت و به گیت‌هاب پوش شدند. لطفاً دستور کار بعدی (مرحله ۱۴ - Testing یا فاز بعدی نقشه راه) را صادر فرمایید."""

async def main():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", "") and t.get("type") == "page")
    print(f"Connecting to Commander tab: {qwen_tab['url']}")
    
    cdp = CDPClient(qwen_tab["webSocketDebuggerUrl"])
    await cdp.connect()

    initial_len = await cdp.eval_js("document.body.innerText.length")
    print(f"Initial document length: {initial_len}")

    send_js = f"""
    (() => {{
        const textarea = document.querySelector("textarea.message-input-textarea") || document.querySelector("textarea[placeholder*='Qwen']");
        if (!textarea) return "TEXTAREA_NOT_FOUND";
        
        textarea.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeSetter.call(textarea, {json.dumps(REPORT_ORDER_9)});
        textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));
        textarea.dispatchEvent(new Event('change', {{ bubbles: true }}));
        
        const sendBtn = document.querySelector(".send-button") || document.querySelector("button[aria-label='Send']");
        if (sendBtn) {{
            sendBtn.click();
            return "CLICKED_SEND_BUTTON";
        }}
        
        return "NO_SEND_BUTTON";
    }})()
    """
    res = await cdp.eval_js(send_js)
    print(f"Submission trigger result: {res}")
    
    print("Waiting for response generation to commence...")
    for _ in range(20):
        await asyncio.sleep(1)
        check_js = """
        (() => {
            const stopBtn = !!document.querySelector(".stop-button, button[aria-label='Stop']");
            const len = document.body.innerText.length;
            return JSON.stringify({ stopBtn, len });
        })()
        """
        raw = await cdp.eval_js(check_js)
        data = json.loads(raw)
        if data["stopBtn"] or data["len"] > initial_len + 300:
            print("🚀 Commander has STARTED generating response!")
            break
    
    last_len = 0
    stable_count = 0
    max_wait = 900
    elapsed = 0

    while elapsed < max_wait:
        status_js = """
        (() => {
            const stopBtn = !!document.querySelector(".stop-button, button[aria-label='Stop']");
            const fullText = document.body.innerText;
            return JSON.stringify({
                hasStopBtn: stopBtn,
                fullLength: fullText.length,
                tail: fullText.slice(-500)
            });
        })()
        """
        raw = await cdp.eval_js(status_js)
        data = json.loads(raw)
        has_stop = data["hasStopBtn"]
        current_len = data["fullLength"]

        print(f"[{elapsed}s] StopBtn: {has_stop} | Length: {current_len}")

        if not has_stop and current_len > initial_len + 100:
            if current_len == last_len:
                stable_count += 1
                if stable_count >= 2:
                    print("\n🎯 Response is 100% COMPLETE!")
                    break
            else:
                stable_count = 0
                last_len = current_len

        await asyncio.sleep(4)
        elapsed += 4

    # Extract response
    extract_js = f"""
    (() => {{
        const text = document.body.innerText;
        const marker = "گزارش اجرای دستور کار شماره ۹";
        const idx = text.lastIndexOf(marker);
        if (idx !== -1) {{
            return text.slice(idx);
        }}
        return text.slice(-4000);
    }})()
    """
    full_output = await cdp.eval_js(extract_js)
    print("\n==================== [متن کامل و نهایی دستور کار جدید] ====================\n")
    print(full_output)
    print("\n==========================================================================\n")

    await cdp.close()

if __name__ == "__main__":
    asyncio.run(main())
