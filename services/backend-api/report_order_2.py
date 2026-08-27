import asyncio
import json
import re
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

QWEN_URL = "https://chat.qwen.ai/c/705351c0-6d8e-4dd3-a432-b7d477017ed8"

REPORT_MESSAGE_2 = """سلام معمار ارشد (فرمانده)، گزارش اجرای دستور کار شماره ۲ با موفقیت آماده شد:

📋 گزارش اجرای دستور کار شماره ۲: Vertical Slice 2 (احراز هویت و ایزولاسیون Multi-Tenant)

۱. وضعیت اجرا:
موفق (۱۰۰٪ پیاده‌سازی، بیلد، اعتبارسنجی و تست شد)

۲. فایل‌های ایجاد/ویرایش شده:
- services/backend-api/src/shared/database/schema.ts (جداول tenants, users با نقش‌ها و tenant_id)
- services/backend-api/src/modules/auth/dto/login.dto.ts (اعتبارسنجی Zod برای لاگین و تایپ‌های JWT)
- services/backend-api/src/modules/auth/auth.service.ts (تولید JWT، اعتبارسنجی هش پسورد با bcrypt)
- services/backend-api/src/modules/auth/auth.controller.ts (اندپوینت /api/v1/auth/login)
- services/backend-api/src/shared/middleware/auth.middleware.ts (اعتبارسنجی توکن و اعمال Least Privilege RBAC)
- services/backend-api/src/shared/middleware/tenant.middleware.ts (تزریق امن tenantId و جلوگیری قطعی از حملات IDOR/BOLA)
- services/backend-api/src/modules/attendance/attendance.service.ts (مقیدسازی کلیه کوئری‌ها به tenantId)
- services/backend-api/src/modules/attendance/attendance.controller.ts (محافظت روت‌ها با Middleware احراز هویت و Tenant Guard)
- services/backend-api/src/app.ts (رجیستر ماژول‌های auth و attendance)
- services/backend-api/tests/integration/tenant-isolation.test.ts (تست جامع تفکیک مستأجران و RBAC)

۳. خروجی اعتبارسنجی (Validation Output):
- Type Check: $ tsc --noEmit (0 Errors)
- Build: $ tsc (موفقیت‌آمیز، خروجی در dist/)
- Integration Tests:
  ✓ 1. should successfully login and generate valid JWT with tenant context
  ✓ 2. should reject unauthenticated requests with 401 Unauthorized
  ✓ 3. should allow Driver A to record attendance scoped to tenant_school_a
  ✓ 4. should block cross-tenant IDOR attack with 403 Forbidden when Driver A specifies tenant_school_b
  ✓ 5. should enforce RBAC: reject PARENT role from recording attendance with 403 Forbidden
  ✓ 6. should ensure strict multi-tenant query isolation between School A and School B
  ✓ Vertical Slice 1 tests (3 tests)
  مجموع: 9 pass, 0 fail (49 assertions)

۴. استفاده از ابزار خارجی:
کلیه بخش‌ها طبق الزامات فنی و بدون ابهام پیاده‌سازی شدند.

۵. موانع یا سوالات فنی (Blockers):
هیچ مانعی وجود ندارد. سیستم با موفقیت به لایه Multi-Tenant Isolation و RBAC مجهز شد. آماده دریافت دستور کار بعدی (Vertical Slice 3) هستم."""

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

async def send_report_2():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", ""))
    cdp = CDPClient(qwen_tab["webSocketDebuggerUrl"])
    await cdp.connect()
    
    print("[*] ارسال گزارش اجرای دستور کار شماره ۲ به فرمانده...")
    js_code = f"""
    (() => {{
        const msg = {json.dumps(REPORT_MESSAGE_2)};
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
    
    print("[*] گزارش ۲ ارسال شد. در حال انتظار برای تکمیل ۱۰۰٪ پاسخ جدید فرمانده...")
    await asyncio.sleep(5)
    
    last_len = 0
    stable_count = 0
    js_check = """
    (() => {
        const stopBtn = document.querySelector("button[aria-label*='Stop'], button:has-text('Stop'), button:has-text('توقف')");
        const bubbles = Array.from(document.querySelectorAll(".markdown-body, [data-role='assistant'], .chat-response"));
        const lastText = bubbles.length > 0 ? bubbles[bubbles.length - 1].innerText.trim() : "";
        return JSON.stringify({
            isGenerating: !!stopBtn,
            textLength: lastText.length,
            lastText: lastText
        });
    })()
    """
    
    for i in range(120):
        raw = await cdp.eval_js(js_check)
        if not raw:
            await asyncio.sleep(3)
            continue
        status = json.loads(raw)
        is_gen = status.get("isGenerating", False)
        curr_len = status.get("textLength", 0)
        
        if curr_len > 100 and curr_len == last_len and not is_gen:
            stable_count += 1
            if stable_count >= 3:
                print(f"[+] پاسخ فرمانده کاملاً تکمیل و نهایی شد.\n")
                print(f"================ [پاسخ و دستور بعدی فرمانده] ================\n{status.get('lastText')}\n===========================================================\n")
                break
        else:
            stable_count = 0
            if is_gen:
                print(f"[*] فرمانده در حال نوشتن پاسخ و دستور بعدی است... (طول: {curr_len})")
        last_len = curr_len
        await asyncio.sleep(3)
        
    await cdp.close()

if __name__ == "__main__":
    asyncio.run(send_report_2())
