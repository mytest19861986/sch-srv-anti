import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

REPORT_TEXT = """سلام فرمانده، آنتی گرویتی هستم.

🛠️ گزارش رسمی اجرای کامل دستور کار شماره ۵۴ (Pilot Day Operational Runbook & Automated Daily Checklist Engine) مطابق پروتکل نسخه ۲

================================================================================
۱. کتابچه راهنمای عملیاتی روز پایلوت میدانی (PILOT_DAY_RUNBOOK.md)
================================================================================
• تدوین جامع سند `docs/PILOT_DAY_RUNBOOK.md` برای فاز اول پایلوت میدانی.
• زمان‌بندی جزء‌به‌جزء ساعت‌به‌ساعت (از ساعت ۰۶:۰۰ پیش از شیفت تا ۱۶:۳۰ بستن شیفت و گزارش نهایی).
• ماتریس وظایف ۴ گانه: مدیر مدرسه، رانندگان، والدین، راهبران فنی (SRE/DevOps).
• پلی‌بوک‌های ۴ گانه مدیریت شرایط اضطراری میدانی (قطعی اینترنت راننده، غیبت دانش‌آموز، خطای تردد، تعویض راننده).
• ماتریس شاخص‌های کلیدی عملکرد و SLAهای تضمین‌شده روز پایلوت.

🔗 لینک مستقیم در گیت‌هاب:
https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/PILOT_DAY_RUNBOOK.md
🔗 لینک فایل خام (Raw):
https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/PILOT_DAY_RUNBOOK.md

================================================================================
۲. توسعه و اجرای موتور خودکار چک‌لیست روزانه پایلوت (scripts/pilot-daily-checklist.ts)
================================================================================
• اجرای ۸ گام اعتبارسنجی خودکار سلامت سیستم پیش از شروع هر شیفت:
  ۱. صدور و اعتبارسنجی امضای توکن‌های JWT مدیر و راننده.
  ۲. بررسی یکپارچگی دوطرفه داده‌های والدین و دانش‌آموزان (Parent↔Student Linkage).
  ۳. تست گارد ماشین وضعیت (جلوگیری از ثبت DROPPED_OFF بدون PICKED_UP با خطای ۴۰۹).
  ۴. تست دریافت بلادرنگ تردد و Deduplication با کلید Idempotency (کد ۲۰۱ و ۲۰۰).
  ۵. بررسی سلامت صف Transactional Outbox.
  ۶. بررسی دفاع ایزولاسیون چندمستاجری Zero-Trust در برابر حملات تزریق تننت (۴۰۳ Forbidden).
  ۷. تست اندپوینت همگام‌سازی آفلاین دسته‌ای راننده (/api/v1/sync/batch).
  ۸. تست تهیه بکاپ دیتابیس سوپر ادمین (/api/v1/super-admin/database-dump).

📊 نتیجه اجرای چک‌لیست:
۸ از ۸ آزمون موفق (100% Pass) در ۱.۵ ثانیه با وضعیت ALL SYSTEMS GO.

🔗 لینک اسکریپت‌ها در گیت‌هاب:
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/pilot-daily-checklist.ts
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/pilot-daily-checklist.ps1
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/pilot-daily-checklist.sh

================================================================================
۳. وضعیت تست‌های جامع مونو‌ریپو (Quality Gate)
================================================================================
• ۱۱۳ تست فعال و ۱۰۰٪ موفق (۰ خطا) در ۲۵ فایل تست (113 pass, 0 fail, 421 expect() calls).
• تمام اینواریانت‌های ممیزی ChatGPT و گاردهای امنیتی سبز و پایدار هستند.

================================================================================
۴. وضعیت استقرار و ثبت در گیت‌هاب
================================================================================
• شناسه کامیت: 8f91ec5
• شاخه: main
• مخزن رسمی: https://github.com/mytest19861986/sch-srv-anti

================================================================================
۵. پاسخ به سؤال مدیریتی در خصوص ADRها
================================================================================
• خلاصه ۵ تصمیم کلیدی معماری (ADR-001 تا ADR-005) در مستند DECISION_LOG.md ثبت و منتشر شده و جهت بهره‌برداری روز پایلوت آماده است.

منتظر دریافت فرامین بعدی از جانب فرمانده ارشد هستم. 🚀"""

async def send_order54_report():
    tabs_data = json.loads(urllib.request.urlopen('http://127.0.0.1:9222/json').read().decode())
    qwen_tab = next((t for t in tabs_data if 'chatwen.ai' in t.get('url', '') or 'chat.qwen.ai' in t.get('url', '')), None)
    if not qwen_tab:
        print("No Qwen tab found.")
        return

    ws_url = qwen_tab['webSocketDebuggerUrl']
    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        msg = {
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {
                "expression": f"""
                (() => {{
                    const el = document.querySelector('textarea.message-input-textarea') || document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
                    if (!el) return 'no_textarea';
                    el.focus();
                    el.value = '';
                    document.execCommand('insertText', false, {json.dumps(REPORT_TEXT)});
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    return 'inserted';
                }})()
                """,
                "returnByValue": True
            }
        }
        await ws.send(json.dumps(msg))
        res_insert = json.loads(await ws.recv())
        print("Insert status:", res_insert)

        await asyncio.sleep(0.8)

        press_enter = {
            "id": 2,
            "method": "Input.dispatchKeyEvent",
            "params": {
                "type": "keyDown",
                "windowsVirtualKeyCode": 13,
                "nativeVirtualKeyCode": 13,
                "macCharCode": 13,
                "unmodifiedText": "\r",
                "text": "\r",
                "key": "Enter",
                "code": "Enter"
            }
        }
        await ws.send(json.dumps(press_enter))
        await ws.recv()

        release_enter = {
            "id": 3,
            "method": "Input.dispatchKeyEvent",
            "params": {
                "type": "keyUp",
                "windowsVirtualKeyCode": 13,
                "nativeVirtualKeyCode": 13,
                "macCharCode": 13,
                "unmodifiedText": "\r",
                "text": "\r",
                "key": "Enter",
                "code": "Enter"
            }
        }
        await ws.send(json.dumps(release_enter))
        await ws.recv()
        print("[+] Sent Enter key event to Qwen for Order #54 Report")

if __name__ == "__main__":
    asyncio.run(send_order54_report())
