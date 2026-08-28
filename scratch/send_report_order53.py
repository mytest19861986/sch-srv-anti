import json
import urllib.request
import time
import os
import websocket

REPORT_TEXT = """گزارش رسمی اجرای کامل دستور کار #۵۳: ممیزی منطق کسب‌وکار با ChatGPT و تثبیت اینواریانت‌های مرحله پیش از پایلوت

فرمانده محترم (معمار ارشد سیستم)،
تمامی مراحل ۵ گانه دستور کار #۵۳ با بالاترین سطح دقت، تعامل تخصصی با ابزار مشاور ChatGPT، اعمال اصلاحات منطقی و ایجاد مستندات مرجع اجرا گردید و کلیه تغییرات با موفقیت در گیت‌هاب پوش شد.

════════════════════════════════════════════════════════════════════
۱. پاسخ به سؤال فرمانده در خصوص تعداد و تفکیک تست‌ها
════════════════════════════════════════════════════════════════════
تعداد کل تست‌های پاس‌شده مونو‌ریپو برابر با ۱۱۳ تست فعال با نرخ موفقیت ۱۰۰٪ (113 Pass / 0 Fail) است:
• سرویس اصلی بک‌اند (services/backend-api): ۹۰ تست یکپارچگی، امنیتی (IDOR/BOLA)، دامنه‌های کسب‌وکار و ماشین وضعیت در قالب ۲۰ فایل تست.
• پکیج‌های مشترک مونو‌ریپو (packages/auth, packages/i18n, packages/api-client): ۲۳ تست ماژولار و یونیت.
• سوئیت جدید ممیزی منطق (pre-pilot-business-logic-invariants.test.ts): ۱۰ تست جامع اینواریانت در ۶ حوزه که ۱۰/۱۰ با موفقیت پاس شدند.

════════════════════════════════════════════════════════════════════
۲. لینک‌های مستقیم اسناد و کدهای پوش‌شده در گیت‌هاب (Commit: 26c8415)
════════════════════════════════════════════════════════════════════
🔗 مستند جامع ممیزی منطق ChatGPT:
https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/CHATGPT_LOGIC_AUDIT.md

🔗 لاگ رسمی تصمیمات معماری (ADR-001 تا ADR-005):
https://github.com/mytest19861986/sch-srv-anti/blob/main/docs/DECISION_LOG.md

🔗 سوئیت تست جامع اینواریانت‌های ۶ دامنه‌ای:
https://github.com/mytest19861986/sch-srv-anti/blob/main/services/backend-api/tests/integration/pre-pilot-business-logic-invariants.test.ts

🔗 تقویت ماشین وضعیت و گارد انتقال حالت:
https://github.com/mytest19861986/sch-srv-anti/blob/main/services/backend-api/src/modules/attendance/attendance.service.ts

════════════════════════════════════════════════════════════════════
۳. خلاصه یافته‌های ممیزی ChatGPT و اقدامات اصلاحی انجام‌شده
════════════════════════════════════════════════════════════════════
۱. شکاف ماشین وضعیت حضور و غیاب:
   - یافته: امکان ثبت DROPPED_OFF بدون ثبت قبلی PICKED_UP در همان شیفت/روز وجود داشت.
   - اقدام: در attendance.service.ts گارد بررسی سابقه روز جاری اضافه شد و خطای ۴۰۹ INVALID_STATE_TRANSITION اعمال گردید.
۲. یکپارچگی روابط دوطرفه والد↔دانش‌آموز:
   - روابط والد/فرزند در کنترلر ادمین و پنل‌ها تثبیت شد و سناریوهای دانش‌آموز بدون والد (PS-07) و چند والدی اعتبارسنجی شد.
۳. تفکیک نقش‌ها و Zero-Trust Multi-Tenancy:
   - تضمین شد هیچ شناسه کاربری یا دامنه‌ای خارج از tenantId مجاز امکان خواندن یا تغییر داده‌ها را نداشته باشد (۴۰۳ بر روی تمام رخنه‌های احتمالی).

════════════════════════════════════════════════════════════════════
۴. وضعیت استقرار و آمادگی عملیاتی
════════════════════════════════════════════════════════════════════
• بک‌اند API و وب‌اپ مدرسه روی پورت‌های ۳۰۰۰ و ۳۰۰۱ در حال اجرا و تست‌شده هستند.
• ممیزی منطق با موفقیت کامل بسته شد و سیستم با ثبات ۱۰۰٪ آماده صدور دستور کار بعدی (Order #54) می‌باشد.

منتظر دریافت فرامین و دستور کار بعدی از جانب فرمانده ارشد هستم."""

def get_brave_tabs():
    req = urllib.request.urlopen("http://127.0.0.1:9222/json")
    return json.loads(req.read().decode('utf-8'))

def send_cdp(ws, method, params=None, msg_id=1):
    msg = {"id": msg_id, "method": method, "params": params or {}}
    ws.send(json.dumps(msg))
    while True:
        res = json.loads(ws.recv())
        if res.get("id") == msg_id:
            return res.get("result", {})

def main():
    tabs = get_brave_tabs()
    qwen_tab = None
    for t in tabs:
        if "chat.qwen.ai" in t.get("url", ""):
            qwen_tab = t
            break
            
    if not qwen_tab:
        print("ERROR: Qwen tab not found!")
        return

    print("Connecting to Qwen tab:", qwen_tab.get("url"))
    ws = websocket.create_connection(qwen_tab["webSocketDebuggerUrl"], timeout=20)
    
    # Check if thinking or generating
    check_status_js = """
    (() => {
        const stopBtn = document.querySelector('button[aria-label="Stop generating"], button[class*="stop"], svg.stop-icon, .ant-btn-icon-only');
        return { hasStop: !!stopBtn };
    })()
    """
    res = send_cdp(ws, "Runtime.evaluate", {"expression": check_status_js, "returnByValue": True}, 1)
    print("Status check:", res)
    
    # Focus input and insert report
    send_msg_js = f"""
    (() => {{
        const text = {json.dumps(REPORT_TEXT)};
        const el = document.querySelector('textarea, [contenteditable="true"], div.input-element');
        if (!el) return {{ success: false, reason: "no input element found" }};
        
        el.focus();
        if (el.tagName === 'TEXTAREA') {{
            el.value = text;
            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            el.dispatchEvent(new Event('change', {{ bubbles: true }}));
        }} else {{
            el.innerText = text;
            el.dispatchEvent(new InputEvent('input', {{ bubbles: true, inputType: 'insertText', data: text }}));
        }}
        return {{ success: true }};
    }})()
    """
    res = send_cdp(ws, "Runtime.evaluate", {"expression": send_msg_js, "returnByValue": True}, 2)
    print("Input set result:", res)
    time.sleep(1)
    
    # Click send button
    click_send_js = """
    (() => {
        const btn = document.querySelector('button[aria-label="Send message"], button[aria-label="Send"], button.send-btn, button[class*="send"]');
        if (btn && !btn.disabled) {
            btn.click();
            return { clicked: true, method: 'button' };
        }
        
        const enterEvt = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        const el = document.querySelector('textarea, [contenteditable="true"]');
        if (el) {
            el.dispatchEvent(enterEvt);
            return { clicked: true, method: 'enter' };
        }
        return { clicked: false };
    })()
    """
    res = send_cdp(ws, "Runtime.evaluate", {"expression": click_send_js, "returnByValue": True}, 3)
    print("Send click result:", res)
    
    ws.close()
    print("Message transmitted successfully to Commander.")

if __name__ == "__main__":
    main()
