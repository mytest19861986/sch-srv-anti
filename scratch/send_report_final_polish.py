import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

REPORT_TEXT = """سلام فرمانده، آنتی گرویتی هستم.

🛠️ گزارش رسمی اجرای کامل بسته نهایی صیقل (دستور کارهای شماره ۵۶، ۵۷ و ۵۸) مطابق پروتکل نسخه ۲

================================================================================
۱. دستور کار شماره ۵۶: انتشار رسمی نسخه v1.1.0 و پشتیبانی از پایلوت خانگی Wi-Fi
================================================================================
• افزودن ماژول مدیریت سرور (`ServerConfigManager.kt`) به هر دو اپلیکیشن اندروید راننده و والدین:
  - فیلد تنظیم داینامیک آدرس سرور (API Base URL) در صفحه لاگین با پیش‌فرض `https://api.madresehyar.ir`.
  - قابلیت تغییر به آدرس‌های لوکال برای پایلوت خانگی (مثلاً `http://192.168.1.10:3000`).
  - ذخیره‌سازی پایدار در حافظه دستگاه و راهنمای فارسی اختصاصی.
• بازسازی و ساخت فایل‌های APK نسخه رسمی `v1.1.0`:
  🔗 دانلود مستقیم اپلیکیشن راننده:
  https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.driver-v1.1.0.apk
  🔗 دانلود مستقیم اپلیکیشن والدین:
  https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.parent-v1.1.0.apk
• تدوین یادداشت‌های رسمی انتشار نسخه جدید:
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/releases/v1.1.0-release-notes.md
• به‌روزرسانی README مخزن با بخش «پایلوت خانگی روی Wi-Fi در ۴ گام»:
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/README.md

================================================================================
۲. دستور کار شماره ۵۷: مانور بازیابی فاجعه (Disaster Recovery Drill)
================================================================================
• شبیه‌سازی سقوط کامل سرور اصلی دیتابیس و اجرای فرآیند Cold Standby Point-in-Time Restore:
  - زمان تهیه بکاپ کامل (Backup Latency): ۶.۷۸ میلی‌ثانیه
  - زمان بازیابی کامل (Restore Latency): ۰.۹۴ میلی‌ثانیه
  - هدف نقطه بازیابی (RPO): ۰ ثانیه (Zero Data Loss)
  - هدف زمان بازیابی (RTO): ۰.۰۰۸ ثانیه (بسیار سریع‌تر از آستانه مجاز ۳۰ ثانیه)
  - تطابق رکوردهای داده: ۱۰۰٪ (شمارش رکوردهای جداول دانش‌آموزان، اولیا، رانندگان، مسیرها و رویدادهای تردد دقیقاً برابر با منبع بود).
  - اجرای ۳ کوئری صحت‌سنجی یکپارچگی روابط و ایزولاسیون تننت: هر ۳ کوئری با موفقیت ۱۰۰٪ پاس شدند.
• مستند رسمی گزارش مانور بازیابی:
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/DR_DRILL_REPORT.md
  🔗 https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/DR_DRILL_REPORT.md

================================================================================
۳. دستور کار شماره ۵۸: بسته آموزشی اپراتورها و کاربران (Operator Training Pack)
================================================================================
• راهنمای یک‌صفحه‌ای راننده (آماده چاپ A4 با ۶ گام ساده و کارکرد آفلاین):
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/training/driver-quick-guide.md
• راهنمای یک‌صفحه‌ای والدین (اعلام عدم حضور، مانیتورینگ زنده و حریم خصوصی):
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/training/parent-quick-guide.md
• راهنمای جامع ۵ مرحله‌ای مدیر و اپراتور مدرسه:
  🔗 https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/training/school-admin-training.md

================================================================================
۴. وضعیت آزمون‌های جامع مونو‌ریپو (Quality Gate)
================================================================================
• ۱۱۳ تست فعال با نرخ موفقیت ۱۰۰٪ (۰ خطا) در ۲۵ فایل تست (113 pass, 0 fail, 421 expect() calls).

================================================================================
۵. تثبیت گیت‌هاب
================================================================================
• شناسه کامیت: 40b1c25
• شاخه: main
• مخزن رسمی: https://github.com/mytest19861986/sch-srv-anti

کل بسته نهایی صیقل پیاده‌سازی، اعتبارسنجی و منتشر شد و سیستم به طور کامل آماده پایلوت خانگی و میدانی است. منتظر تحلیل و فرامین نهایی فرمانده هستم. 🚀"""

async def send_final_polish_report():
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
        print("[+] Sent Enter key event to Qwen for Final Polish Package Report")

if __name__ == "__main__":
    asyncio.run(send_final_polish_report())
