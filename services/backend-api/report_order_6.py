import asyncio
import json
import re
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

REPORT_MESSAGE_6 = """سلام معمار ارشد (فرمانده)، گزارش اجرای دستور کار شماره ۶ با موفقیت آماده شد:

📋 گزارش اجرای دستور کار شماره ۶: Vertical Slice 6 (School Dashboard Read Model & Live Aggregation)

۱. وضعیت اجرا:
موفق (۱۰۰٪ پیاده‌سازی، بیلد، اعتبارسنجی و تست شد)

۲. فایل‌های ایجاد/ویرایش شده:
- services/backend-api/src/shared/database/schema.ts (افزودن جدول تجمیعی attendance_daily_summary با ایندکس‌های مرکب tenantId_date_shiftId و tenantId_date_serviceId)
- services/backend-api/src/modules/dashboard/dto/dashboard-query.dto.ts (تعریف DTO کوئری‌های داشبورد، صفحه‌بندی و فیلترینگ و شاخص تازگی داده data_freshness_seconds)
- services/backend-api/src/modules/dashboard/dashboard.service.ts (سرویس مدل خواندن داشبورد با استراتژی عدم اسکن جدول تاریخی و به‌روزرسانی افزایشی Incremental Aggregate)
- services/backend-api/src/modules/dashboard/dashboard.controller.ts (اندپوینت‌های GET /overview، GET /live-services و GET /service-detail/:serviceId تحت نظارت RBAC ویژه مدیر مدرسه)
- services/backend-api/src/modules/notification/outbox-worker.service.ts (اتصال پردازش ناهمگام Worker به موتور به‌روزرسانی افزایشی خلاصه روزانه)
- services/backend-api/src/app.ts (رجیستر ماژول داشبورد)
- services/backend-api/tests/integration/dashboard-read-model.test.ts (تست یکپارچگی ثبت ۵ رویداد حضور → به‌روزرسانی خلاصه روزانه → نمایش آمار دقیق داشبورد → فعال شدن پرچم is_stale: true پس از تأخیر ۳۰ ثانیه‌ای)

۳. خروجی اعتبارسنجی (Validation Output):
- Type Check: $ tsc --noEmit (0 Errors)
- Build: $ tsc (موفقیت‌آمیز، خروجی در dist/)
- Integration Tests:
  ✓ 1. should update daily summary incrementally via worker and serve fast overview & live-services
  ✓ 2. should indicate stale data with is_stale: true when summary has not been updated for > 30s
  ✓ 3. should provide detailed service breakdown with individual student statuses
  ✓ Vertical Slice 1, 2, 3, 4, 5 tests (18 tests)
  مجموع: 21 pass, 0 fail (131 assertions)

۴. استفاده از ابزار خارجی:
طراحی لایه خلاصه روزانه افزایشی و جداسازی کامل مسیر خواندن از مسیر نوشتن (CQRS-lite Read Model) طبق استانداردهای بالای مقیاس‌پذیری انجام شد.

۵. موانع یا سوالات فنی (Blockers):
هیچ مانعی وجود ندارد. لایه داشبورد زنده مدیر مدرسه (School Dashboard Read Model) با موفقیت مستقر شد. آماده دریافت دستور کار بعدی (Vertical Slice 7) هستم."""

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

async def send_report_6():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", "") and t.get("type") == "page")
    cdp = CDPClient(qwen_tab["webSocketDebuggerUrl"])
    await cdp.connect()
    
    print("[*] ارسال گزارش ۶ به فرمانده...")
    js_code = f"""
    (() => {{
        const msg = {json.dumps(REPORT_MESSAGE_6)};
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
    
    print("[*] گزارش ۶ ارسال شد. مانیتورینگ ضدخطا و پایدار پاسخ جدید فرمانده...")
    await asyncio.sleep(6)
    
    start_time = time.time()
    last_len = 0
    stable_count = 0
    
    while True:
        elapsed = int(time.time() - start_time)
        if elapsed > 900:
            print("[!] مهلت ۱۵ دقیقه به پایان رسید.")
            break
            
        # Bulletproof detector: Uses total body text length + stop button
        js_status = """
        (() => {
            const stopBtn = document.querySelector(".stop-button, button[aria-label='Stop']");
            const fullText = document.body.innerText;
            const marker = "گزارش اجرای دستور کار شماره ۶";
            const idx = fullText.lastIndexOf(marker);
            const newText = idx !== -1 ? fullText.slice(idx) : fullText.slice(-2000);
            
            return JSON.stringify({
                hasStopBtn: !!stopBtn,
                fullLength: fullText.length,
                newTextLength: newText.length,
                newText: newText
            });
        })()
        """
        raw = await cdp.eval_js(js_status)
        if not raw:
            await asyncio.sleep(2)
            continue
            
        status = json.loads(raw)
        has_stop = status.get("hasStopBtn", False)
        f_len = status.get("fullLength", 0)
        
        # When stop button is gone and length is stable for 3 consecutive polls (6s)
        if not has_stop and f_len > 1000 and f_len == last_len:
            stable_count += 1
            if stable_count >= 2:
                print(f"\n[+] پاسخ جدید فرمانده ۱۰۰٪ تکمیل و با موفقیت استخراج شد! (زمان: {elapsed}s)\n")
                print("==================== [متن کامل و نهایی دستور کار جدید] ====================")
                print(status.get("newText", ""))
                print("==========================================================================")
                break
        else:
            stable_count = 0
            state = "تفکر / تولید" if has_stop else "در حال بررسی"
            print(f"[*] وضعیت ({elapsed}s): {state}... (طول کل متن: {f_len})")
            
        last_len = f_len
        await asyncio.sleep(3)
        
    await cdp.close()

if __name__ == "__main__":
    asyncio.run(send_report_6())
