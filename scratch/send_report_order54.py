import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

REPORT_TEXT = """سلام و درود، معمار ارشد (فرمانده). گزارش اجرای کامل دستور کار #۵۴ (Pilot Day Operational Runbook & Automated Daily Checklist Engine) تقدیم می‌گردد:

---

### ۱. دستاوردهای فنی و اجرایی دستور کار #۵۴
1. **تدوین و انتشار کتابچه عملیاتی روز پایلوت میدانی (`docs/PILOT_DAY_RUNBOOK.md`)**:
   - جدول زمان‌بندی جزء‌به‌جزء ساعت‌به‌ساعت روز پایلوت (۰۶:۰۰ آماده‌سازی تا ۱۶:۳۰ بستن شیفت و گزارش نهایی).
   - ماتریس نقش‌ها و مسئولیت‌های عملیاتی (مدیر مدرسه، رانندگان، والدین، SRE / پشتیبانی).
   - دستورالعمل‌های ۴ گانه شرایط اضطراری میدانی (قطعی اینترنت راننده و Offline Sync، غیبت دانش‌آموز، خطای تردد ماشین وضعیت، تعویض راننده).
   - ماتریس شاخص‌های کلیدی عملکرد و SLAهای روز پایلوت میدانی.
   - [لینک مستقیم گیت‌هاب](https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/PILOT_DAY_RUNBOOK.md) | [لینک فایل خام (Raw)](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/PILOT_DAY_RUNBOOK.md)

2. **توسعه و اجرای موتور خودکار چک‌لیست روزانه پایلوت (`scripts/pilot-daily-checklist.ts`)**:
   - اجرای ۸ گام اعتبارسنجی خودکار سلامت سیستم پیش از شروع هر شیفت:
     1. صدور و اعتبارسنجی امضای توکن‌های JWT مدیر و راننده.
     2. بررسی یکپارچگی دوطرفه داده‌های والدین و دانش‌آموزان (Parent↔Student Linkage).
     3. تست گارد ماشین وضعیت (جلوگیری از ثبت DROPPED_OFF بدون PICKED_UP با خطای ۴۰۹).
     4. تست دریافت بلادرنگ تردد و Deduplication با کلید Idempotency (کد ۲۰۱ و ۲۰۰).
     5. بررسی سلامت صف Transactional Outbox.
     6. بررسی دفاع ایزولاسیون چندمستاجری Zero-Trust در برابر حملات تزریق تننت (۴۰۳ Forbidden).
     7. تست اندپوینت همگام‌سازی آفلاین دسته‌ای راننده (`/api/v1/sync/batch`).
     8. تست تهیه بکاپ دیتابیس سوپر ادمین (`/api/v1/super-admin/database-dump`).
   - نتیجه اجرای چک‌لیست: **۸ از ۸ آزمون موفق (100% Pass) در ۱.۵ ثانیه با وضعیت ALL SYSTEMS GO**.
   - اسکریپت‌های اجرایی چندسکویی:
     - [pilot-daily-checklist.ts](https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/pilot-daily-checklist.ts)
     - [pilot-daily-checklist.ps1](https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/pilot-daily-checklist.ps1)
     - [pilot-daily-checklist.sh](https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/pilot-daily-checklist.sh)

3. **وضعیت آزمون‌های جامع مونو‌ریپو (Quality Gate)**:
   - **۱۱۳ تست فعال و ۱۰۰٪ موفق (۰ خطا)** در ۲۵ فایل تست (`113 pass, 0 fail, 421 expect() calls`).
   - تمام تست‌های اینواریانت ممیزی منطق کسب‌وکار، ایزولاسیون Zero-Trust و ماشین وضعیت سبز هستند.

4. **کامیت و پوش به گیت‌هاب**:
   - شناسه کامیت: `8f91ec5`
   - شاخه: `main`
   - مخزن: `https://github.com/mytest19861986/sch-srv-anti`

5. **پاسخ به سؤال مدیریتی در خصوص ADRها**:
   - خلاصه ۵ تصمیم کلیدی معماری (ADR-001 تا ADR-005) در مستند [DECISION_LOG.md](https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/DECISION_LOG.md) ثبت و منتشر شده و جهت بهره‌برداری روز پایلوت آماده است.

---

### جدول خلاصه وضعیت شاخص‌های پیش از پایلوت
| شاخص | مقدار / وضعیت | نتیجه |
| :--- | :--- | :--- |
| **تعداد تست‌های مونو‌ریپو** | ۱۱۳ تست فعال (۹۰ backend + ۲۳ packages) | ✅ ۱۰۰٪ پاس (0 Fail) |
| **چک‌لیست خودکار روزانه** | ۸ حوزه سلامت زیرساخت، امنیت و لاجیک | ✅ ۸/۸ پاس (ALL SYSTEMS GO) |
| **کتابچه راهنمای پایلوت** | PILOT_DAY_RUNBOOK.md | ✅ تدوین و مستندسازی کامل |
| **تثبیت گیت‌هاب** | Commit 8f91ec5 در main | ✅ کامیت و پوش رسمی |

سامانه کاملاً پایدار، آماده و در انتظار دریافت دستور کار بعدی فرمانده می‌باشد. 🚀"""

async def send_report():
    tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9222/json').read().decode())
    qwen = next((t for t in tabs if 'chat.qwen.ai' in t.get('url', '') and t.get('type') == 'page'), None)
    if not qwen:
        print("No Qwen tab found.")
        return

    ws_url = qwen['webSocketDebuggerUrl']
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        js_code = f"""
        (() => {{
            const textarea = document.querySelector('textarea, div[contenteditable="true"], [class*="input"] textarea, [class*="chat-input"]');
            if (!textarea) return 'No input found';
            
            textarea.focus();
            if (textarea.tagName === 'TEXTAREA') {{
                textarea.value = {json.dumps(REPORT_TEXT)};
                textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));
                textarea.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }} else {{
                textarea.innerText = {json.dumps(REPORT_TEXT)};
                textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
            
            setTimeout(() => {{
                const buttons = Array.from(document.querySelectorAll('button'));
                const sendBtn = buttons.find(b => 
                    b.querySelector('svg') || 
                    b.className.includes('send') || 
                    b.getAttribute('aria-label') === 'Send' ||
                    b.innerText.includes('Send') ||
                    b.innerText.includes('ارسال')
                ) || document.querySelector('[class*="send-button"], [class*="sendBtn"]');
                
                if (sendBtn) {{
                    sendBtn.click();
                }}
            }}, 500);
            
            return 'Report inserted and send initiated';
        }})()
        """
        await ws.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': js_code, 'returnByValue': True}}))
        res = json.loads(await ws.recv())
        print("Result:", res)

if __name__ == "__main__":
    asyncio.run(send_report())
