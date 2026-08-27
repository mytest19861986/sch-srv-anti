import os
from PIL import Image, ImageDraw, ImageFont

DOCS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(DOCS_DIR, exist_ok=True)

# Helper function to get font
def get_font(size, bold=False):
    try:
        font_path = r"C:\Windows\Fonts\tahoma.ttf" if not bold else r"C:\Windows\Fonts\tahomabd.ttf"
        if not os.path.exists(font_path):
            font_path = r"C:\Windows\Fonts\arial.ttf"
        return ImageFont.truetype(font_path, size)
    except:
        return ImageFont.load_default()

# 1. Driver Manifest with Call Button
def render_driver_manifest_call_button():
    w, h = 480, 850
    img = Image.new("RGB", (w, h), "#0F172A")
    draw = ImageDraw.Draw(img)

    # Status bar
    draw.rectangle([(0, 0), (w, 36)], fill="#0B0F19")
    draw.text((w - 70, 8), "07:15", fill="#94A3B8", font=get_font(14))
    draw.text((20, 8), "LTE  100%", fill="#94A3B8", font=get_font(13))

    # Header
    draw.rectangle([(0, 36), (w, 100)], fill="#1E293B")
    draw.text((w - 200, 48), "سرویس یار - مانیفست راننده", fill="#F8FAFC", font=get_font(16, bold=True))
    draw.text((w - 150, 72), "شیفت صبح: مسیر ونک (فعال)", fill="#38BDF8", font=get_font(13))

    # Info card
    draw.rounded_rectangle([(16, 112), (w - 16, 172)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 180, 124), "ناوگان: ون تویوتا (۱۲ ب ۳۴۵)", fill="#E2E8F0", font=get_font(13, bold=True))
    draw.text((w - 160, 146), "تعداد مسافران: ۴ دانش‌آموز", fill="#94A3B8", font=get_font(12))

    # Student 1: Normal with Call Button
    draw.rounded_rectangle([(16, 184), (w - 16, 274)], radius=12, fill="#1E293B", outline="#38BDF8", width=2)
    draw.text((w - 150, 196), "۱. سارا تهرانی", fill="#FFFFFF", font=get_font(15, bold=True))
    draw.text((w - 130, 220), "ایستگاه: میدان ونک", fill="#94A3B8", font=get_font(12))
    draw.text((w - 130, 242), "پایه چهارم - کلاس ۴۰۱", fill="#64748B", font=get_font(11))
    
    # Call Button (P1-1: Intent.ACTION_DIAL)
    draw.rounded_rectangle([(28, 204), (120, 254)], radius=8, fill="#0284C7")
    draw.text((40, 218), "📞 تماس", fill="#FFFFFF", font=get_font(13, bold=True))

    # Action Button
    draw.rounded_rectangle([(130, 204), (220, 254)], radius=8, fill="#10B981")
    draw.text((142, 218), "سوار شد ✓", fill="#FFFFFF", font=get_font(13, bold=True))

    # Student 2
    draw.rounded_rectangle([(16, 286), (w - 16, 376)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 150, 298), "۲. علی رضایی", fill="#FFFFFF", font=get_font(15, bold=True))
    draw.text((w - 130, 322), "ایستگاه: خیابان ملاصدرا", fill="#94A3B8", font=get_font(12))
    draw.text((w - 130, 344), "پایه سوم - کلاس ۳۰۲", fill="#64748B", font=get_font(11))
    draw.rounded_rectangle([(28, 306), (120, 356)], radius=8, fill="#0284C7")
    draw.text((40, 320), "📞 تماس", fill="#FFFFFF", font=get_font(13, bold=True))
    draw.rounded_rectangle([(130, 306), (220, 356)], radius=8, fill="#10B981")
    draw.text((142, 320), "سوار شد ✓", fill="#FFFFFF", font=get_font(13, bold=True))

    # Footer note
    draw.text((60, 800), "کلیک روی دکمه تماس، شماره ولی را در شماره‌گیر باز می‌کند", fill="#38BDF8", font=get_font(11))

    img.save(os.path.join(DOCS_DIR, "driver-manifest-call-button.png"))
    print("[+] Saved driver-manifest-call-button.png")

# 2. Parent Absence Report
def render_parent_absence_report():
    w, h = 480, 850
    img = Image.new("RGB", (w, h), "#0F172A")
    draw = ImageDraw.Draw(img)

    # Status bar
    draw.rectangle([(0, 0), (w, 36)], fill="#0B0F19")
    draw.text((w - 70, 8), "06:30", fill="#94A3B8", font=get_font(14))
    draw.text((20, 8), "LTE  100%", fill="#94A3B8", font=get_font(13))

    # Header
    draw.rectangle([(0, 36), (w, 100)], fill="#1E293B")
    draw.text((w - 190, 48), "سرویس یار - پنل والدین", fill="#F8FAFC", font=get_font(16, bold=True))
    draw.text((w - 170, 72), "وضعیت زنده فرزند: سارا تهرانی", fill="#38BDF8", font=get_font(13))

    # Child Status Card
    draw.rounded_rectangle([(16, 112), (w - 16, 230)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 180, 126), "سرویس صبح (حرکت: ۰۶:۵۵)", fill="#E2E8F0", font=get_font(14, bold=True))
    draw.text((w - 160, 150), "راننده: علی راننده (ون تویوتا)", fill="#94A3B8", font=get_font(12))
    draw.rounded_rectangle([(w - 140, 180), (w - 28, 214)], radius=8, fill="#0369A1")
    draw.text((w - 128, 190), "در انتظار شروع", fill="#FFFFFF", font=get_font(12, bold=True))

    # Absence Report Section (P1-2)
    draw.rounded_rectangle([(16, 248), (w - 16, 440)], radius=12, fill="#1E293B", outline="#EF4444", width=2)
    draw.text((w - 220, 264), "🚨 اعلام عدم حضور امروز (اضطراری)", fill="#EF4444", font=get_font(14, bold=True))
    draw.text((40, 295), "اگر فرزند شما امروز به مدرسه نمی‌رود، تا قبل از ۰۶:۴۵ اعلام کنید.", fill="#94A3B8", font=get_font(11))
    
    # Reason dropdown preview
    draw.rounded_rectangle([(32, 330), (w - 32, 370)], radius=8, fill="#0F172A", outline="#475569")
    draw.text((w - 150, 342), "علت: سرماخوردگی / بیماری", fill="#E2E8F0", font=get_font(12))

    # Submit Button
    draw.rounded_rectangle([(32, 385), (w - 32, 425)], radius=8, fill="#DC2626")
    draw.text((w // 2 - 90, 396), "ثبت عدم حضور و اطلاع به راننده", fill="#FFFFFF", font=get_font(13, bold=True))

    # Footer note
    draw.text((80, 800), "گزارش عدم حضور بلافاصله در مانیفست راننده علامت زده می‌شود", fill="#EF4444", font=get_font(11))

    img.save(os.path.join(DOCS_DIR, "parent-absence-report.png"))
    print("[+] Saved parent-absence-report.png")

# 3. Driver Manifest with Absence Badge
def render_driver_manifest_absence_badge():
    w, h = 480, 850
    img = Image.new("RGB", (w, h), "#0F172A")
    draw = ImageDraw.Draw(img)

    # Status bar
    draw.rectangle([(0, 0), (w, 36)], fill="#0B0F19")
    draw.text((w - 70, 8), "07:15", fill="#94A3B8", font=get_font(14))
    draw.text((20, 8), "LTE  100%", fill="#94A3B8", font=get_font(13))

    # Header
    draw.rectangle([(0, 36), (w, 100)], fill="#1E293B")
    draw.text((w - 200, 48), "سرویس یار - مانیفست راننده", fill="#F8FAFC", font=get_font(16, bold=True))
    draw.text((w - 150, 72), "شیفت صبح: مسیر ونک (فعال)", fill="#38BDF8", font=get_font(13))

    # Student 1: Reported Absent (Muted Slate with Red/Yellow Badge)
    draw.rounded_rectangle([(16, 120), (w - 16, 210)], radius=12, fill="#1E293B", outline="#EF4444", width=2)
    draw.text((w - 150, 132), "۱. سارا تهرانی", fill="#94A3B8", font=get_font(15, bold=True))
    draw.text((w - 130, 156), "ایستگاه: میدان ونک", fill="#64748B", font=get_font(12))
    
    # Absence Badge (P1-2)
    draw.rounded_rectangle([(w - 200, 178), (w - 28, 204)], radius=6, fill="#7F1D1D")
    draw.text((w - 190, 184), "🚨 عدم حضور اعلام شده (ولی)", fill="#FCA5A5", font=get_font(11, bold=True))

    # Disabled / Override Button
    draw.rounded_rectangle([(28, 140), (120, 185)], radius=8, fill="#334155")
    draw.text((45, 154), "غیرفعال", fill="#94A3B8", font=get_font(12))

    # Student 2: Normal
    draw.rounded_rectangle([(16, 225), (w - 16, 315)], radius=12, fill="#1E293B", outline="#38BDF8", width=1)
    draw.text((w - 150, 237), "۲. علی رضایی", fill="#FFFFFF", font=get_font(15, bold=True))
    draw.text((w - 130, 261), "ایستگاه: خیابان ملاصدرا", fill="#94A3B8", font=get_font(12))
    draw.rounded_rectangle([(28, 245), (120, 295)], radius=8, fill="#0284C7")
    draw.text((40, 259), "📞 تماس", fill="#FFFFFF", font=get_font(13, bold=True))
    draw.rounded_rectangle([(130, 245), (220, 295)], radius=8, fill="#10B981")
    draw.text((142, 259), "سوار شد ✓", fill="#FFFFFF", font=get_font(13, bold=True))

    img.save(os.path.join(DOCS_DIR, "driver-manifest-absence-badge.png"))
    print("[+] Saved driver-manifest-absence-badge.png")

render_driver_manifest_call_button()
render_parent_absence_report()
render_driver_manifest_absence_badge()
