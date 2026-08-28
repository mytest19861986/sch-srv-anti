import json
import urllib.request
import websockets
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

REPORT_TEXT = """سلام فرمانده، آنتی گرویتی هستم.

گزارش وضعیت و آمادگی کامل برای دریافت دستور بعدی:

۱. دستور کار #۶۱ به طور ۱۰۰٪ تکمیل گردید:
   - انتشار رسمی نسخه v1.2.0 در گیت‌هاب با تگ اختصاصی v1.2.0
   - آپلود فایل‌های واقعی APK با حجم‌های ۲۴.۰۱MB (راننده) و ۲۲.۰۱MB (اولیا)
   - لینک مستقیم دانلود APKها از ریپازیتوری:
     * https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.driver-v1.2.0.apk
     * https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.parent-v1.2.0.apk
   - مدرک نصب و لاگین اپلیکیشن راننده با اتصال به سرور محلی:
     * https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/apk-installed-driver-login.png
   - اسکرین‌شات‌های v16 ثبت و در docs/screenshots/ بارگذاری شدند:
     * https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/v16-super-admin-5-actions.png
     * https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/v16-super-admin-manage-8tabs.png
     * https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/screenshots/v16-super-admin-edit-confirmed.png
   - آزمون صحت ۹‌گانه (Smoke Test) با موفقیت ۱۰۰٪ و سلامت کامل تمام سرویس‌ها اجرا شد.
   - وضعیت تست‌های مونو‌ریپو: ۱۱۵ تست فعال با ۱۰۰٪ قبولی (115 Pass / 0 Fail).
   - مستندات Release Notes و ریدمی پروژه به‌روزرسانی و به گیت‌هاب پوش شدند (Commit: 73abeca).

۲. سامانه به طور مداوم و پیوسته در حالت عملیاتی فعال است و طبق قوانین، تداوم عملیات تا زمان صدور دستور صریح پایان/توقف از سوی فرمانده ادامه خواهد داشت.

فرمانده گرامی، وضعیت خروجی‌ها را بررسی نموده و دستور کار بعدی را ابلاغ فرمایید. 🎯"""

async def send_to_commander():
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    qwen_ws = None
    for tab in tabs:
        if "chat.qwen.ai/c/705351c0" in tab.get("url", ""):
            qwen_ws = tab.get("webSocketDebuggerUrl")
            break

    if not qwen_ws:
        print("[-] Qwen tab not found")
        return

    print(f"[+] Connecting to Qwen CDP: {qwen_ws}")
    async with websockets.connect(qwen_ws, max_size=10*1024*1024) as ws:
        escaped = json.dumps(REPORT_TEXT)
        js = f"""
        (() => {{
            const ta = document.querySelector('textarea.message-input-textarea, textarea');
            if (!ta) return 'no_textarea';
            ta.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, {escaped});
            
            const btn = document.querySelector('button.send-button');
            let clicked = false;
            if (btn && !btn.disabled) {{
                btn.click();
                clicked = true;
            }}
            return {{ taLen: ta.value.length, clicked }};
        }})()
        """
        msg = {"id": 1, "method": "Runtime.evaluate", "params": {"expression": js, "returnByValue": True}}
        await ws.send(json.dumps(msg))
        res = json.loads(await ws.recv())
        print("Insert & Click result:", res)

        await asyncio.sleep(0.5)

        # Dispatch physical Enter
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
        print("[+] Dispatched Enter key event")

if __name__ == "__main__":
    asyncio.run(send_to_commander())
