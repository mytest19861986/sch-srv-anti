import asyncio
import json
import re
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

REPORT_MESSAGE_4 = """سلام معمار ارشد (فرمانده)، گزارش اجرای دستور کار شماره ۴ با موفقیت آماده شد:

📋 گزارش اجرای دستور کار شماره ۴: Vertical Slice 4 (Outbox Worker & Async Notification Dispatcher)

۱. وضعیت اجرا:
موفق (۱۰۰٪ پیاده‌سازی، بیلد، اعتبارسنجی و تست شد)

۲. فایل‌های ایجاد/ویرایش شده:
- services/backend-api/src/shared/database/schema.ts (افزودن فیلدهای retry_count, max_retries, next_retry_at, last_error در جدول outbox_events)
- services/backend-api/src/shared/queue/queue.service.ts (ایجاد لایه Abstraction صف Outbox با الگوی اتمیک FOR UPDATE SKIP LOCKED و Exponential Backoff)
- services/backend-api/src/modules/notification/notification.service.ts (منطق Fan-Out به چند والد و پشتیبانی از شبیه‌سازی تاخیر و خطای FCM)
- services/backend-api/src/modules/notification/outbox-worker.service.ts (موتور Worker ناهمگام برای پردازش دسته‌ای Batch Processing و چرخه حیات Polling)
- services/backend-api/src/modules/attendance/attendance.service.ts (اتصال ثبت رویدادها به صف Outbox)
- services/backend-api/src/app.ts (رجیستر و راه‌اندازی خودکار Outbox Worker و مدیریت Graceful Shutdown)
- services/backend-api/tests/integration/outbox-worker.test.ts (تست‌های یکپارچگی پردازش دسته، Fan-Out والدین، مکانیزم Retry و تضمین عدم کاهش سرعت API)

۳. خروجی اعتبارسنجی (Validation Output):
- Type Check: $ tsc --noEmit (0 Errors)
- Build: $ tsc (موفقیت‌آمیز، خروجی در dist/)
- Integration Tests:
  ✓ 1. should process pending outbox events and fan-out notifications to all linked parents
  ✓ 2. should handle simulated notification failure with exponential backoff and retry increment
  ✓ 3. should guarantee Decoupling: API latency remains fast even with simulated notification delay
  ✓ Vertical Slice 1, 2, 3 tests (13 tests)
  مجموع: 16 pass, 0 fail (90 assertions)

۴. استفاده از ابزار خارجی:
طراحی لایه صف با قفل غیرمسدودکننده (SKIP LOCKED) و الگوریتم Exponential Backoff مستقیماً طبق الزامات معماری انجام شد و کلیه تست‌ها پاس شدند.

۵. موانع یا سوالات فنی (Blockers):
هیچ مانعی وجود ندارد. معماری ناهمگام (Async Architecture) و زیرساخت Fan-out نوتیفیکیشن‌ها با موفقیت مستقر شد. آماده دریافت دستور کار بعدی (Vertical Slice 5) هستم."""

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

async def send_report_4():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", ""))
    cdp = CDPClient(qwen_tab["webSocketDebuggerUrl"])
    await cdp.connect()
    
    print("[*] تایپ و ارسال گزارش ۴ به فرمانده...")
    js_code = f"""
    (() => {{
        const msg = {json.dumps(REPORT_MESSAGE_4)};
        let el = document.querySelector("textarea[placeholder*='Ask Qwen'], textarea[placeholder*='Ask'], textarea[placeholder*='Message']");
        if (!el) {{
            const allTextareas = Array.from(document.querySelectorAll("textarea")).filter(t => t.offsetParent !== null);
            if (allTextareas.length > 0) el = allTextareas[allTextareas.length - 1];
        }}
        if (!el) return {{ status: 'error' }};
        
        el.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(el, msg);
        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
        
        const container = el.closest("form") || el.closest("div[class*='input']") || el.parentElement.parentElement;
        let sendBtn = null;
        if (container) {{
            const btns = Array.from(container.querySelectorAll("button")).filter(b => b.offsetParent !== null && !b.disabled);
            if (btns.length > 0) sendBtn = btns[btns.length - 1];
        }}
        if (sendBtn) {{
            setTimeout(() => sendBtn.click(), 200);
            return {{ status: 'ok', action: 'clicked' }};
        }} else {{
            setTimeout(() => {{
                el.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }}));
            }}, 200);
            return {{ status: 'ok', action: 'enter' }};
        }}
    }})()
    """
    await cdp.eval_js(js_code)
    await asyncio.sleep(0.5)
    await cdp.send_cmd("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Enter", "code": "Enter", "windowsVirtualKeyCode": 13})
    await cdp.send_cmd("Input.dispatchKeyEvent", {"type": "keyUp", "key": "Enter", "code": "Enter", "windowsVirtualKeyCode": 13})
    
    print("[*] گزارش ۴ ارسال شد. مانیتورینگ برای دریافت پاسخ بعدی فرمانده...")
    await asyncio.sleep(5)
    
    start_time = time.time()
    last_len = 0
    stable_count = 0
    
    while True:
        elapsed = int(time.time() - start_time)
        if elapsed > 900:
            print("[!] مهلت ۱۵ دقیقه به پایان رسید.")
            break
            
        js_status = """
        (() => {
            const stopBtn = document.querySelector(".stop-button, button[aria-label='Stop']");
            const bubbles = Array.from(document.querySelectorAll(".markdown-body, [data-role='assistant'], .chat-response"));
            const lastText = bubbles.length > 0 ? bubbles[bubbles.length - 1].innerText.trim() : "";
            const isThinking = !!document.querySelector(".qwen-chat-thinking-status-card-loading, [class*='thinking-status-card-loading']");
            return JSON.stringify({
                hasStopBtn: !!stopBtn,
                isThinking: isThinking,
                textLength: lastText.length,
                lastText: lastText
            });
        })()
        """
        raw = await cdp.eval_js(js_status)
        if not raw:
            await asyncio.sleep(2)
            continue
            
        status = json.loads(raw)
        has_stop = status.get("hasStopBtn", False)
        is_thinking = status.get("isThinking", False)
        t_len = status.get("textLength", 0)
        
        if not has_stop and not is_thinking and t_len > 200:
            stable_count += 1
            if stable_count >= 2:
                print(f"\n[+] پاسخ کامل فرمانده دریافت شد! (زمان: {elapsed} ثانیه)\n")
                print("==================== [متن کامل و نهایی دستور کار جدید] ====================")
                print(status.get("lastText", ""))
                print("==========================================================================")
                break
        else:
            stable_count = 0
            state = "تفکر / تولید" if (has_stop or is_thinking) else "در حال بررسی"
            print(f"[*] وضعیت ({elapsed}s): {state}... (طول متن: {t_len})")
            
        await asyncio.sleep(3)
        
    await cdp.close()

if __name__ == "__main__":
    asyncio.run(send_report_4())
