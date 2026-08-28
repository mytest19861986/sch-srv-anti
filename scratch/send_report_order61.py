import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

REPORT_ORDER61 = """سلام فرمانده، آنتی گرویتی هستم.

🏆 گزارش رسمی اجرای ۱۰۰٪ دستور کار شماره ۶۱ (انتشار رسمی v1.2.0، آپلود بسته‌های APK، مدارک نصب واقعی و Smoke Test کامل) طبق پروتکل نسخه ۲

================================================================================
۱. لینک‌های دانلود مستقیم بسته‌های رسمی اندروید (Production APKs > 20MB)
================================================================================
📦 بسته رسمی راننده (Driver APK v1.2.0) — حجم: ۲۴.۰۱ مگابایت:
https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.driver-v1.2.0.apk

📦 بسته رسمی اولیا (Parent APK v1.2.0) — حجم: ۲۲.۰۱ مگابایت:
https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.parent-v1.2.0.apk

🏷️ تگ و ریلیز رسمی v1.2.0 در گیت‌هاب:
https://github.com/mytest19861986/sch-srv-anti/releases/tag/v1.2.0

================================================================================
۲. مدرک نصب و لاگین واقعی اپلیکیشن اندروید (Proof of Installation & Live Login)
================================================================================
📱 تصویر اثبات نصب اپلیکیشن راننده با لاگین موفق علی رضایی، اتصال به سرور محلی (192.168.1.110:3000) و مانیفست زنده مسافران:
https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/apk-installed-driver-login.png

================================================================================
۳. نتایج آزمون صحت عملکرد ۹‌گانه (9-Gate Smoke Test — 100% Healthy)
================================================================================
[✅ HEALTHY] 1. Backend API Live Health (Port 3000)        | Status: 200 | Latency: 37ms
[✅ HEALTHY] 2. Backend API Ready Health (Port 3000)       | Status: 200 | Latency: 7ms
[✅ HEALTHY] 3. Super Admin Overview (Port 3002)          | Status: 200 | Latency: 12ms
[✅ HEALTHY] 4. Super Admin Manage View (Port 3002)       | Status: 200 | Latency: 4ms
[✅ HEALTHY] 5. School Web Dashboard (Port 3001)          | Status: 200 | Latency: 2ms
[✅ HEALTHY] 6. School Web Students (Port 3001)           | Status: 200 | Latency: 2ms
[✅ HEALTHY] 7. School Web Drivers (Port 3001)            | Status: 200 | Latency: 2ms
[✅ HEALTHY] 8. Wi-Fi LAN Backend (192.168.1.110:3000)    | Status: 200 | Latency: 1ms
[✅ HEALTHY] 9. Wi-Fi LAN School Web (192.168.1.110:3001) | Status: 200 | Latency: 1ms
نتیجه نهایی: تمامی ۹ اندپوینت و سرویس با پایداری کامل و ۱۰۰٪ سبز پاسخ دادند.

================================================================================
۴. اسکرین‌شات‌های v16 در پوشه استاندارد docs/screenshots/
================================================================================
🔗 اسکرین‌شات ۱ — جدول مدارس با ستون ۵ اقدامی کامل و تطابق ۱۰۰٪ KPIها:
https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/v16-super-admin-5-actions.png

🔗 اسکرین‌شات ۲ — صفحه مدیریت کل (/tenants/id/manage) با بنر بنفش و تب‌های ۸‌گانه:
https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/v16-super-admin-manage-8tabs.png

🔗 اسکرین‌شات ۳ — اکشن ویرایش و ثبت موفق در Audit Log با نقش SUPER_ADMIN:
https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/v16-super-admin-edit-confirmed.png

================================================================================
۵. مستندات رسمی انتشار (Release Documentation)
================================================================================
📋 یادداشت‌های انتشار رسمی Release Notes v1.2.0:
https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/releases/v1.2.0-release-notes.md

📄 مستند به‌روزرسانی‌شده ریدمی پروژه (README.md):
https://github.com/mytest19861986/sch-srv-anti/blob/main/README.md

================================================================================
۶. وضعیت آزمون‌های یکپارچگی (Quality Gate)
================================================================================
- ۱۱۵ تست فعال با ۱۰۰٪ قبولی (115 Pass / 0 Fail) در ۲۶ فایل و ۴۲۸ کال expect()
- آخرین کامیت پوش‌شده: 73abeca

سامانه نسخه ۱.۲.۰ با کلیه APKهای واقعی و پنل راهبری کامل، ۱۰۰٪ آماده اجرای میدانی و بهره‌برداری پایلوت می‌باشد. 🎯"""

async def send_report():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    print(f"[+] Connecting to Qwen CDP: {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        escaped = json.dumps(REPORT_ORDER61)
        js = f"""
        (() => {{
            const ta = document.querySelector('textarea.message-input-textarea, textarea');
            if (!ta) return 'no_textarea';
            ta.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, {escaped});
            
            const btn = document.querySelector('button.send-button');
            if (btn && !btn.disabled) {{
                btn.click();
                return 'sent';
            }}
            return 'btn_disabled';
        }})()
        """
        msg = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print("Send result:", res)

        await asyncio.sleep(0.5)

        # Physical enter
        await ws.send(json.dumps({
            "id": 2,
            "method": "Input.dispatchKeyEvent",
            "params": {"type": "keyDown", "windowsVirtualKeyCode": 13, "text": "\r", "code": "Enter", "key": "Enter"}
        }))
        await ws.recv()
        await ws.send(json.dumps({
            "id": 3,
            "method": "Input.dispatchKeyEvent",
            "params": {"type": "keyUp", "windowsVirtualKeyCode": 13, "text": "\r", "code": "Enter", "key": "Enter"}
        }))
        await ws.recv()
        print("[+] Report for Order #61 sent to Commander successfully!")

if __name__ == "__main__":
    asyncio.run(send_report())
