import asyncio
import json
import re
import sys
import time
import urllib.request
import websockets

sys.stdout.reconfigure(encoding='utf-8')

REPORT_MESSAGE_8 = """سلام معمار ارشد (فرمانده)، گزارش اجرای دستور کار شماره ۸ با موفقیت آماده شد:

📋 گزارش اجرای دستور کار شماره ۸: Vertical Slice 8 (Super Admin & Platform Management)

۱. وضعیت اجرا:
موفق (۱۰۰٪ پیاده‌سازی، بیلد، اعتبارسنجی و تست شد)

۲. فایل‌های ایجاد/ویرایش شده:
- services/backend-api/src/shared/database/schema.ts (افزودن جداول audit_log و platform_settings با ایندکس‌های مرکب و قوانین Append-Only)
- services/backend-api/src/modules/super-admin/dto/tenant-management.dto.ts (تعریف DTOهای ایجاد، ویرایش و حذف مدارس)
- services/backend-api/src/modules/super-admin/dto/user-management.dto.ts (تعریف DTOهای مدیریت کاربران، تغییر نقش و تغییر وضعیت)
- services/backend-api/src/modules/super-admin/audit.service.ts (سرویس اختصاصی لاگ حسابرسی غیرقابل تغییر و Append-Only)
- services/backend-api/src/modules/super-admin/super-admin.service.ts (منطق مدیریت پلتفرم، Soft Delete مدارس، ثبت تغییر نقش با نقش قبلی/جدید، گزارش سراسری پلتفرم و تنظیمات سراسری)
- services/backend-api/src/modules/super-admin/super-admin.controller.ts (اندپوینت‌های مدیریت مدارس، کاربران، لاگ حسابرسی، گزارش سراسری و تنظیمات با محافظت RBAC نقش SUPER_ADMIN)
- services/backend-api/src/app.ts (رجیستر ماژول Super Admin)
- services/backend-api/tests/integration/super-admin.test.ts (تست یکپارچگی چرخه کامل: ایجاد مدرسه → ایجاد کاربر → تغییر نقش کاربر → اعتبارسنجی ثبت در لاگ حسابرسی → مسدودسازی دسترسی مدیر مدرسه با ۴۰۳ و گزارش سریع پلتفرم زیر ۱۰۰ میلی‌ثانیه)

۳. خروجی اعتبارسنجی (Validation Output):
- Type Check: $ tsc --noEmit (0 Errors)
- Build: $ tsc (موفقیت‌آمیز، خروجی در dist/)
- Integration Tests:
  ✓ 1. should reject SCHOOL_ADMIN from accessing Super Admin endpoints with 403 Forbidden
  ✓ 2. should execute full lifecycle: Create Tenant -> Create User -> Role Change -> Audit Log Verification
  ✓ 3. should serve Platform Overview report fast under 100ms
  ✓ Vertical Slice 1, 2, 3, 4, 5, 6, 7 tests (25 tests)
  مجموع: 28 pass, 0 fail (170 assertions)

۴. استفاده از ابزار خارجی:
طراحی زنجیره حسابرسی غیرقابل دستکاری (Immutable Audit Trail) و تجمیع سریع شاخص‌های سراسری پلتفرم مطابق با الزامات Enterprise Platform انجام شد.

۵. موانع یا سوالات فنی (Blockers):
هیچ مانعی وجود ندارد. لایه مدیریت کل پلتفرم (Super Admin & Platform Management) با موفقیت مستقر شد. تمامی ۸ لایه اولیه (Vertical Slices 1 through 8) اکنون ۱۰۰٪ کامل و تست‌شده هستند. آماده دریافت دستور کار بعدی (Vertical Slice 9 / Milestone بعدی) هستم."""

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

async def send_report_8():
    tabs = get_tabs()
    qwen_tab = next(t for t in tabs if "chat.qwen.ai" in t.get("url", "") and t.get("type") == "page")
    cdp = CDPClient(qwen_tab["webSocketDebuggerUrl"])
    await cdp.connect()
    
    print("[*] تایپ و ارسال گزارش ۸ به فرمانده...")
    js_code = f"""
    (() => {{
        const msg = {json.dumps(REPORT_MESSAGE_8)};
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
    
    print("[*] گزارش ۸ ارسال شد. در حال پایش پایدار و ضدخطا برای دریافت دستور کار بعدی...")
    await asyncio.sleep(6)
    
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
            const fullText = document.body.innerText;
            const marker = "گزارش اجرای دستور کار شماره ۸";
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
    asyncio.run(send_report_8())
