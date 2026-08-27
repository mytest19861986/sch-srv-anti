import asyncio
import json
import re
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

REPORT_MESSAGE_5 = """سلام معمار ارشد (فرمانده)، گزارش اجرای دستور کار شماره ۵ با موفقیت آماده شد:

📋 گزارش اجرای دستور کار شماره ۵: Vertical Slice 5 (Offline-First Driver Sync & Conflict Resolution)

۱. وضعیت اجرا:
موفق (۱۰۰٪ پیاده‌سازی، بیلد، اعتبارسنجی و تست شد)

۲. فایل‌های ایجاد/ویرایش شده:
- services/backend-api/src/shared/database/schema.ts (افزودن جدول sync_metadata برای رهگیری وضعیت همگام‌سازی و لاگ خطاهای دستگاه‌ها)
- services/backend-api/src/modules/sync/dto/batch-sync.dto.ts (تعریف DTO همگام‌سازی دسته‌ای، اعمال محدودیت سخت‌گیرانه سقف ۲۰۰ رویداد در هر بچ و ولیدیشن Zod)
- services/backend-api/src/modules/sync/sync.service.ts (موتور پردازش دسته‌ای با پشتیبانی از Partial Success، تشخیص رویدادهای تکراری و مانیتورینگ تداخل زمانی Chronological Conflict)
- services/backend-api/src/modules/sync/sync.controller.ts (اندپوینت‌های POST /api/v1/sync/batch و GET /api/v1/sync/metadata/:deviceId تحت محافظت Auth و Tenant Guard)
- services/backend-api/src/app.ts (رجیستر ماژول سنک در برنامه)
- services/backend-api/tests/integration/offline-sync.test.ts (تست یکپارچگی سناریوی کامل آفلاین راننده: ۵ رویداد آفلاین → اتصال مجدد → خروجی ۳ created، ۱ duplicate، ۱ conflict و تست Rate Limit سقف ۲۰۰ رویداد)

۳. خروجی اعتبارسنجی (Validation Output):
- Type Check: $ tsc --noEmit (0 Errors)
- Build: $ tsc (موفقیت‌آمیز، خروجی در dist/)
- Integration Tests:
  ✓ 1. should process offline batch with partial success: 3 created, 1 duplicate, 1 conflict
  ✓ 2. should reject batch exceeding 200 events limit with 400 Bad Request
  ✓ Vertical Slice 1, 2, 3, 4 tests (16 tests)
  مجموع: 18 pass, 0 fail (109 assertions)

۴. استفاده از ابزار خارجی:
پیاده‌سازی منطق تشخیص Conflict برای رویدادهای قدیمی‌تر از وضعیت ثبت‌شده و پیاده‌سازی Partial Success با تفکیک وضعیت هر آیتم مستقیماً طبق الزامات معماری انجام شد.

۵. موانع یا سوالات فنی (Blockers):
هیچ مانعی وجود ندارد. لایه آفلاین راننده (Offline Sync Engine) با موفقیت مستقر شد. آماده دریافت دستور کار بعدی (Vertical Slice 6) هستم."""

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

async def send_report_5():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", "") and t.get("type") == "page")
    cdp = CDPClient(qwen_tab["webSocketDebuggerUrl"])
    await cdp.connect()
    
    print("[*] ارسال گزارش ۵ به فرمانده...")
    js_code = f"""
    (() => {{
        const msg = {json.dumps(REPORT_MESSAGE_5)};
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
    
    print("[*] گزارش ۵ ارسال شد. در حال مانیتورینگ برای دریافت پاسخ بعدی...")
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
    asyncio.run(send_report_5())
