import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

REPORT_TEXT = """سلام فرمانده، آنتی گرویتی هستم.

🛠️ گزارش رسمی اجرای کامل دستور کار شماره ۵۵ (Production Wire-up Kit, Automated DNS Generator, Nginx Hardening & Pre-Flight Verifier) مطابق پروتکل نسخه ۲

================================================================================
۱. پیاده‌سازی کیت خودکار استقرار پروداکشن (scripts/wireup-setup.ts / .sh / .ps1)
================================================================================
• ابزار خودکار دریافت ورودی‌های مدیر (دامنه + آی‌پی سرور + ارائه‌دهنده هاست):
  ۱. تولید خودکار فایل `.env.production` با کلیدهای رمزنگاری قوی ۲۵۶ بیتی، تفکیک دیتابیس و اندپوینت‌های رسمی.
  ۲. تولید کانفیگ اختصاصی `infrastructure/deploy/nginx-production.conf` با HTTP/2، HSTS، Rate Limiting و ۳ کلاستر Upstream.
  ۳. تولید سند جامع رکوردهای دامنه در `docs/DNS_SETUP.md` با دستورالعمل‌های ایرنیک (nic.ir)، ابر آروان و لیارا.
  ۴. تولید اسکریپت صدور خودکار SSL رایگان Let's Encrypt (`infrastructure/deploy/setup-ssl.sh`).

🔗 لینک فایل‌ها در گیت‌هاب:
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/wireup-setup.ts
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/wireup-setup.ps1
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/wireup-setup.sh

================================================================================
۲. پیاده‌سازی چک‌لیست نهایی کیفیت پروداکشن (scripts/wireup-final-check.ts)
================================================================================
• اجرای ۶ بررسی جامع پیش از ورود ترافیک واقعی:
  ۱. وجود و یکپارچگی تمامی کانفیگ‌ها و مانیفست‌های استقرار.
  ۲. آنتروپی و امنیت کلیدهای JWT و پسوردهای دیتابیس (بدون رمزهای پیش‌فرض).
  ۳. اعتبارسنجی سینتکس Nginx و گاردهای امنیتی وب.
  ۴. انطباق رکوردهای ساب‌دامین‌ها (api, school, admin) و رکوردهای امنیتی ایمیل SPF/DMARC.
  ۵. تست پاسخ‌دهی و احراز هویت سرویس اصلی با کانتکست چندمستاجری.
  ۶. اعتبارسنجی توپولوژی ۵ لایه میکروسرویس‌های Docker Compose.

📊 نتیجه اجرای چک‌لیست:
۶ از ۶ آزمون موفق (100% Pass) در کمتر از ۱ ثانیه با وضعیت ALL SYSTEMS GO.

🔗 لینک فایل‌ها در گیت‌هاب:
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/wireup-final-check.ts
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/wireup-final-check.ps1
https://github.com/mytest19861986/sch-srv-anti/blob/main/scripts/wireup-final-check.sh

================================================================================
۳. مستندات راهنمای سریع و تنظیمات DNS
================================================================================
• تدوین راهنمای جامع ۵ دقیقه‌ای استقرار:
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/WIREUP_QUICKSTART.md
  🔗 https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/WIREUP_QUICKSTART.md
• تدوین راهنمای ثبت رکوردهای دامنه:
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/DNS_SETUP.md
  🔗 https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/DNS_SETUP.md

================================================================================
۴. وضعیت آزمون‌های جامع مونو‌ریپو (Quality Gate)
================================================================================
• ۱۱۳ تست فعال و ۱۰۰٪ موفق (۰ خطا) در ۲۵ فایل تست (113 pass, 0 fail, 421 expect() calls).

================================================================================
۵. تثبیت گیت‌هاب
================================================================================
• شناسه کامیت: c4e24f4
• شاخه: main
• مخزن رسمی: https://github.com/mytest19861986/sch-srv-anti

کیت اتصال پروداکشن (Wire-up Kit) به طور کامل آماده است و به محض اعلام دامنه و آی‌پی هاست توسط مدیر، با یک دستور کل پروژه روی محیط زنده مستقر خواهد شد. منتظر فرامین بعدی فرمانده هستم. 🚀"""

async def send_order55_report():
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
        print("[+] Sent Enter key event to Qwen for Order #55 Report")

if __name__ == "__main__":
    asyncio.run(send_order55_report())
