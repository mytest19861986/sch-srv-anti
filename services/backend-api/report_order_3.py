import asyncio
import json
import re
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

QWEN_URL = "https://chat.qwen.ai/c/705351c0-6d8e-4dd3-a432-b7d477017ed8"

REPORT_MESSAGE_3 = """سلام معمار ارشد (فرمانده)، گزارش اجرای دستور کار شماره ۳ با موفقیت آماده شد:

📋 گزارش اجرای دستور کار شماره ۳: Vertical Slice 3 (Domain Entities & Driver Manifest Assignment)

۱. وضعیت اجرا:
موفق (۱۰۰٪ پیاده‌سازی، بیلد، اعتبارسنجی و تست شد)

۲. فایل‌های ایجاد/ویرایش شده:
- services/backend-api/src/shared/database/schema.ts (افزودن موجودیت‌های students, parents, student_parents, drivers, routes, services, shifts, driver_shift_assignments, route_student_assignments)
- services/backend-api/src/modules/domain/domain.service.ts (مدیریت موجودیت‌های دامنه، ایجاد روابط Many-to-Many و موتور کوئری بهینه Driver Manifest)
- services/backend-api/src/modules/attendance/attendance.controller.ts (افزودن اندپوینت حیاتی GET /api/v1/attendance/manifest با اعتبارسنجی شیفت فعال راننده و Tenant Guard)
- services/backend-api/src/app.ts (تزریق ماژول دامنه به کانتکست برنامه)
- services/backend-api/tests/integration/driver-assignment.test.ts (مجموعه تست‌های یکپارچگی تخصیص شیفت، واکشی مانیفست و گارد ایزولاسیون بین مستأجران)

۳. خروجی اعتبارسنجی (Validation Output):
- Type Check: $ tsc --noEmit (0 Errors)
- Build: $ tsc (موفقیت‌آمیز، خروجی در dist/)
- Integration Tests:
  ✓ 1. should allow Driver A to retrieve the active manifest of their assigned shift
  ✓ 2. should reflect recorded attendance status in the manifest
  ✓ 3. should reject Driver A when accessing School B shift with 404/403 (Cross-Tenant Guard)
  ✓ 4. should reject Driver B when accessing an unassigned shift within same school
  ✓ Vertical Slice 1 & 2 tests (9 tests)
  مجموع: 13 pass, 0 fail (65 assertions)

۴. استفاده از ابزار خارجی:
پیاده‌سازی روابط چندبه‌چند والدین و دانش‌آموزان و کوئری بهینه مانیفست راننده مستقیماً طبق معماری استاندارد انجام شد و بدون خطا اعتبارسنجی گردید.

۵. موانع یا سوالات فنی (Blockers):
هیچ مانعی وجود ندارد. سیستم دامنه و تخصیص رانندگان و مانیفست فعال آماده تحویل و ورود به Vertical Slice 4 (Driver Pickup & Real-time Tracking) است."""

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
                if "error" in res:
                    raise Exception(f"CDP Error ({method}): {res['error']}")
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

async def send_report_3():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", ""))
    cdp = CDPClient(qwen_tab["webSocketDebuggerUrl"])
    await cdp.connect()
    
    print("[*] ارسال گزارش اجرای دستور کار شماره ۳ به فرمانده...")
    js_code = f"""
    (() => {{
        const msg = {json.dumps(REPORT_MESSAGE_3)};
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
    
    print("[*] گزارش ۳ ارسال شد. در حال مانیتورینگ تا تکمیل ۱۰۰٪ پاسخ جدید فرمانده...")
    await asyncio.sleep(5)
    
    detector_js = """
    (() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const isGenerating = buttons.some(b => {
            const label = ((b.getAttribute("aria-label") || "") + " " + (b.innerText || "")).toLowerCase();
            return label.includes("stop") || label.includes("توقف");
        });
        
        const hasActionButtons = buttons.some(b => {
            const aria = (b.getAttribute("aria-label") || "").toLowerCase();
            return aria.includes("regenerate") || aria.includes("copy") || aria.includes("share");
        });
        
        const fullText = document.body.innerText;
        return JSON.stringify({
            isGenerating: isGenerating,
            hasActionButtons: hasActionButtons,
            textLength: fullText.length,
            fullTextTail: fullText.slice(-3500)
        });
    })()
    """
    
    last_len = 0
    stable_count = 0
    
    for i in range(150): # up to 5 mins
        raw = await cdp.eval_js(detector_js)
        if not raw:
            await asyncio.sleep(3)
            continue
        data = json.loads(raw)
        is_gen = data.get("isGenerating", False)
        has_actions = data.get("hasActionButtons", False)
        curr_len = data.get("textLength", 0)
        
        if (has_actions or not is_gen) and curr_len > 100 and curr_len == last_len:
            stable_count += 1
            if stable_count >= 2:
                print(f"\n[+] پاسخ جدید فرمانده ۱۰۰٪ تکمیل و نهایی شد! ✅")
                print(f"\n==================== [پاسخ و دستور بعدی فرمانده] ====================\n")
                print(data.get("fullTextTail", ""))
                print(f"\n====================================================================\n")
                break
        else:
            stable_count = 0
            if is_gen:
                print(f"[*] فرمانده در حال نوشتن دستور کار بعدی است... (طول: {curr_len})")
        last_len = curr_len
        await asyncio.sleep(3)
        
    await cdp.close()

if __name__ == "__main__":
    asyncio.run(send_report_3())
