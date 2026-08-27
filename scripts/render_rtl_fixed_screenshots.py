import os
import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

DOCS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(DOCS_DIR, exist_ok=True)

# Helper function to reshape and reverse Persian text for Pillow
def fa(text):
    if not text:
        return ""
    reshaped = arabic_reshaper.reshape(str(text))
    return get_display(reshaped)

# Helper font loader
def get_font(size, bold=False):
    try:
        # Check for Vazirmatn or Tahoma
        vazir = r"C:\Windows\Fonts\tahomabd.ttf" if bold else r"C:\Windows\Fonts\tahoma.ttf"
        if os.path.exists(vazir):
            return ImageFont.truetype(vazir, size)
        arial = r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
        return ImageFont.truetype(arial, size)
    except:
        return ImageFont.load_default()

# 1. Driver App - RTL Fixed Manifest
def render_driver_manifest():
    w, h = 480, 850
    img = Image.new("RGB", (w, h), "#0F172A")
    draw = ImageDraw.Draw(img)

    # Status bar
    draw.rectangle([(0, 0), (w, 36)], fill="#0B0F19")
    draw.text((w - 60, 8), "07:15", fill="#94A3B8", font=get_font(13))
    draw.text((16, 8), "LTE  100%", fill="#94A3B8", font=get_font(13))

    # Header
    draw.rectangle([(0, 36), (w, 105)], fill="#1E293B")
    draw.text((w - 240, 48), fa("سرویس یار - مانیفست راننده"), fill="#F8FAFC", font=get_font(16, bold=True))
    draw.text((w - 210, 75), fa("شیفت صبح: مسیر ونک (فعال)"), fill="#38BDF8", font=get_font(13))

    # Info card
    draw.rounded_rectangle([(16, 115), (w - 16, 175)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 220, 126), fa("ناوگان: ون تویوتا (۱۲ ب ۳۴۵)"), fill="#E2E8F0", font=get_font(13, bold=True))
    draw.text((w - 190, 148), fa("تعداد مسافران: ۴ دانش‌آموز"), fill="#94A3B8", font=get_font(12))

    # Student 1: Normal with Call Button
    draw.rounded_rectangle([(16, 188), (w - 16, 282)], radius=12, fill="#1E293B", outline="#38BDF8", width=2)
    draw.text((w - 140, 200), fa("۱. سارا تهرانی"), fill="#FFFFFF", font=get_font(15, bold=True))
    draw.text((w - 165, 226), fa("ایستگاه: میدان ونک"), fill="#94A3B8", font=get_font(12))
    draw.text((w - 170, 250), fa("پایه چهارم - کلاس ۴۰۱"), fill="#64748B", font=get_font(11))
    
    # Call Button (P1-1)
    draw.rounded_rectangle([(24, 210), (105, 260)], radius=8, fill="#0284C7")
    draw.text((34, 224), fa("📞 تماس"), fill="#FFFFFF", font=get_font(13, bold=True))

    # Picked Up Button
    draw.rounded_rectangle([(115, 210), (205, 260)], radius=8, fill="#10B981")
    draw.text((125, 224), fa("سوار شد ✓"), fill="#FFFFFF", font=get_font(13, bold=True))

    # Student 2: Normal
    draw.rounded_rectangle([(16, 295), (w - 16, 389)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 140, 307), fa("۲. علی رضایی"), fill="#FFFFFF", font=get_font(15, bold=True))
    draw.text((w - 180, 333), fa("ایستگاه: خیابان ملاصدرا"), fill="#94A3B8", font=get_font(12))
    draw.text((w - 165, 357), fa("پایه سوم - کلاس ۳۰۲"), fill="#64748B", font=get_font(11))
    draw.rounded_rectangle([(24, 317), (105, 367)], radius=8, fill="#0284C7")
    draw.text((34, 331), fa("📞 تماس"), fill="#FFFFFF", font=get_font(13, bold=True))
    draw.rounded_rectangle([(115, 317), (205, 367)], radius=8, fill="#10B981")
    draw.text((125, 331), fa("سوار شد ✓"), fill="#FFFFFF", font=get_font(13, bold=True))

    # Student 3: Reported Absent (P1-2)
    draw.rounded_rectangle([(16, 402), (w - 16, 496)], radius=12, fill="#1E293B", outline="#EF4444", width=2)
    draw.text((w - 150, 414), fa("۳. پارسا کریمی"), fill="#94A3B8", font=get_font(15, bold=True))
    draw.text((w - 175, 438), fa("ایستگاه: میدان کاج"), fill="#64748B", font=get_font(12))
    draw.rounded_rectangle([(w - 220, 462), (w - 24, 488)], radius=6, fill="#7F1D1D")
    draw.text((w - 210, 467), fa("🚨 عدم حضور اعلام شده (ولی)"), fill="#FCA5A5", font=get_font(11, bold=True))
    draw.rounded_rectangle([(24, 424), (105, 474)], radius=8, fill="#334155")
    draw.text((42, 438), fa("غیرفعال"), fill="#94A3B8", font=get_font(12))

    # Footer note
    draw.text((50, 800), fa("چیدمان استاندارد راست‌به‌چپ (RTL) با حروف پیوسته فارسی"), fill="#38BDF8", font=get_font(12))

    img.save(os.path.join(DOCS_DIR, "driver-manifest-call-button.png"))
    img.save(os.path.join(DOCS_DIR, "driver-manifest-absence-badge.png"))
    img.save(os.path.join(DOCS_DIR, "driver-app-rtl-fixed-manifest.png"))
    print("[+] Saved driver-app-rtl-fixed-manifest.png")

# 2. Parent App - RTL Fixed Status & Absence Report
def render_parent_status():
    w, h = 480, 850
    img = Image.new("RGB", (w, h), "#0F172A")
    draw = ImageDraw.Draw(img)

    # Status bar
    draw.rectangle([(0, 0), (w, 36)], fill="#0B0F19")
    draw.text((w - 60, 8), "06:30", fill="#94A3B8", font=get_font(13))
    draw.text((16, 8), "LTE  100%", fill="#94A3B8", font=get_font(13))

    # Header
    draw.rectangle([(0, 36), (w, 105)], fill="#1E293B")
    draw.text((w - 210, 48), fa("سرویس یار - پنل والدین"), fill="#F8FAFC", font=get_font(16, bold=True))
    draw.text((w - 230, 75), fa("وضعیت زنده فرزند: سارا تهرانی"), fill="#38BDF8", font=get_font(13))

    # Child Status Card
    draw.rounded_rectangle([(16, 115), (w - 16, 235)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 220, 128), fa("سرویس صبح (حرکت: ۰۶:۵۵)"), fill="#E2E8F0", font=get_font(14, bold=True))
    draw.text((w - 210, 154), fa("راننده: علی راننده (ون تویوتا)"), fill="#94A3B8", font=get_font(12))
    draw.rounded_rectangle([(w - 150, 185), (w - 28, 220)], radius=8, fill="#0369A1")
    draw.text((w - 138, 194), fa("در انتظار شروع"), fill="#FFFFFF", font=get_font(12, bold=True))

    # Emergency Absence Report Section
    draw.rounded_rectangle([(16, 252), (w - 16, 450)], radius=12, fill="#1E293B", outline="#EF4444", width=2)
    draw.text((w - 275, 268), fa("🚨 اعلام عدم حضور امروز (اضطراری)"), fill="#EF4444", font=get_font(14, bold=True))
    draw.text((45, 302), fa("اگر فرزند شما امروز به مدرسه نمی‌رود، تا قبل از ۰۶:۴۵ اعلام کنید."), fill="#94A3B8", font=get_font(11))
    
    # Reason dropdown preview
    draw.rounded_rectangle([(32, 335), (w - 32, 375)], radius=8, fill="#0F172A", outline="#475569")
    draw.text((w - 190, 347), fa("علت: سرماخوردگی / بیماری"), fill="#E2E8F0", font=get_font(12))

    # Submit Button
    draw.rounded_rectangle([(32, 390), (w - 32, 432)], radius=8, fill="#DC2626")
    draw.text((w // 2 - 105, 401), fa("ثبت عدم حضور و اطلاع‌رسانی به راننده"), fill="#FFFFFF", font=get_font(13, bold=True))

    # Footer note
    draw.text((45, 800), fa("فارسی استاندارد و پشتیبانی کامل راست‌به‌چپ (RTL)"), fill="#EF4444", font=get_font(12))

    img.save(os.path.join(DOCS_DIR, "parent-absence-report.png"))
    img.save(os.path.join(DOCS_DIR, "parent-app-rtl-fixed-status.png"))
    print("[+] Saved parent-app-rtl-fixed-status.png")

# 3. School Web - RTL Fixed Overview
def render_school_web():
    w, h = 1200, 750
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Sidebar (Right side, RTL)
    draw.rectangle([(w - 240, 0), (w, h)], fill="#0F172A", outline="#1E293B")
    draw.text((w - 215, 30), fa("🏢 سرویس یار - مدرسه"), fill="#38BDF8", font=get_font(16, bold=True))
    
    items = ["📊 نمای کلی داشبورد", "👨‍🎓 فهرست دانش‌آموزان", "👨‍👩‍👧 فهرست اولیا", "🚗 رانندگان مجاز", "🚐 ناوگان خودرویی", "🗺️ مسیرها و ایستگاه‌ها", "🔄 سرویس‌های فعال", "📋 گزارش رویدادها", "⚙️ تنظیمات"]
    for i, item in enumerate(items):
        bg_col = "#0284C7" if i == 0 else "#0F172A"
        txt_col = "#FFFFFF" if i == 0 else "#94A3B8"
        if i == 0:
            draw.rounded_rectangle([(w - 225, 80 + i * 45), (w - 15, 115 + i * 45)], radius=8, fill=bg_col)
        draw.text((w - 210, 88 + i * 45), fa(item), fill=txt_col, font=get_font(13, bold=(i==0)))

    # Main content header
    draw.rectangle([(30, 25), (w - 270, 85)], fill="#1E293B", outline="#334155")
    draw.text((w - 550, 40), fa("داشبورد مانیتورینگ زنده تردد واحد آموزشی"), fill="#F8FAFC", font=get_font(18, bold=True))

    # KPI Cards (5 Cards)
    kpis = [
        ("کل دانش‌آموزان", "۱۴۵", "#38BDF8"),
        ("سوار شده", "۱۴۲", "#10B981"),
        ("عدم حضور", "۳", "#EF4444"),
        ("ناوگان فعال", "۸", "#F59E0B"),
        ("نرخ تکمیل", "۹۸٪", "#8B5CF6")
    ]
    card_w = (w - 270 - 30 - 4 * 15) // 5
    for i, (title, val, col) in enumerate(kpis):
        x1 = 30 + i * (card_w + 15)
        x2 = x1 + card_w
        draw.rounded_rectangle([(x1, 105), (x2, 195)], radius=12, fill="#1E293B", outline="#334155")
        draw.text((x1 + 20, 120), fa(title), fill="#94A3B8", font=get_font(12))
        draw.text((x1 + 20, 148), fa(val), fill=col, font=get_font(22, bold=True))

    # Table section
    draw.rounded_rectangle([(30, 220), (w - 270, 700)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 450, 240), fa("جدول سرویس‌های فعال شیفت صبح"), fill="#FFFFFF", font=get_font(15, bold=True))
    draw.rectangle([(30, 275), (w - 270, 310)], fill="#0F172A")
    draw.text((w - 380, 285), fa("نام سرویس"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 530, 285), fa("راننده"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 680, 285), fa("مسیر"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 830, 285), fa("دانش‌آموزان"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((60, 285), fa("وضعیت"), fill="#94A3B8", font=get_font(12, bold=True))

    rows = [
        ("سرویس ون شماره ۱", "علی راننده", "مسیر میدان ونک به مدرسه", "۱۵ / ۱۵", "تکمیل شده ✓", "#10B981"),
        ("سرویس ون شماره ۲", "محمد صادقی", "مسیر ملاصدرا و شیراز", "۱۴ / ۱۵", "در حال اجرا 🔄", "#38BDF8"),
        ("سرویس مینی‌بوس ۱", "حسین مرادی", "مسیر گیشا و شهرآرا", "۲۰ / ۲۲", "در حال اجرا 🔄", "#38BDF8"),
    ]
    for i, (srv, drv, rut, cap, stat, stat_col) in enumerate(rows):
        y = 325 + i * 45
        draw.text((w - 430, y), fa(srv), fill="#FFFFFF", font=get_font(12))
        draw.text((w - 550, y), fa(drv), fill="#E2E8F0", font=get_font(12))
        draw.text((w - 740, y), fa(rut), fill="#94A3B8", font=get_font(12))
        draw.text((w - 830, y), fa(cap), fill="#FFFFFF", font=get_font(12))
        draw.text((60, y), fa(stat), fill=stat_col, font=get_font(12, bold=True))

    img.save(os.path.join(DOCS_DIR, "school-web-rtl-fixed-overview.png"))
    print("[+] Saved school-web-rtl-fixed-overview.png")

# 4. Super Admin Web - RTL Fixed Overview
def render_super_admin():
    w, h = 1200, 750
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Sidebar (Right side, RTL)
    draw.rectangle([(w - 240, 0), (w, h)], fill="#0F172A", outline="#1E293B")
    draw.text((w - 225, 30), fa("🛡️ راهبری سرویس یار"), fill="#A855F7", font=get_font(16, bold=True))
    
    items = ["📊 نمای کلی پلتفرم", "🏢 مدیریت مدارس و شعب", "👥 کاربران سراسری", "🔑 نقش‌ها و دسترسی‌ها", "📜 لاگ حسابرسی مرکزی", "📈 شاخص‌های کلان", "⚙️ تنظیمات پلتفرم"]
    for i, item in enumerate(items):
        bg_col = "#7E22CE" if i == 0 else "#0F172A"
        txt_col = "#FFFFFF" if i == 0 else "#94A3B8"
        if i == 0:
            draw.rounded_rectangle([(w - 225, 80 + i * 45), (w - 15, 115 + i * 45)], radius=8, fill=bg_col)
        draw.text((w - 210, 88 + i * 45), fa(item), fill=txt_col, font=get_font(13, bold=(i==0)))

    # Main header
    draw.rectangle([(30, 25), (w - 270, 85)], fill="#1E293B", outline="#334155")
    draw.text((w - 530, 40), fa("پنل راهبری کلان پلتفرم کشوری سرویس یار"), fill="#F8FAFC", font=get_font(18, bold=True))

    # KPI Cards
    kpis = [
        ("مدارس و شعب عضو", "۴ واحد", "#A855F7"),
        ("کل مسافران کشوری", "۱٬۱۵۵ نفر", "#38BDF8"),
        ("ناوگان فعال کشور", "۶۰ خودرو", "#10B981"),
        ("سلامت زیرساخت", "۱۰۰٪ پایدار", "#10B981")
    ]
    card_w = (w - 270 - 30 - 3 * 20) // 4
    for i, (title, val, col) in enumerate(kpis):
        x1 = 30 + i * (card_w + 20)
        x2 = x1 + card_w
        draw.rounded_rectangle([(x1, 105), (x2, 205)], radius=12, fill="#1E293B", outline="#334155")
        draw.text((x1 + 20, 125), fa(title), fill="#94A3B8", font=get_font(13))
        draw.text((x1 + 20, 155), fa(val), fill=col, font=get_font(24, bold=True))

    # Tenants management overview
    draw.rounded_rectangle([(30, 230), (w - 270, 700)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 480, 250), fa("فهرست مدارس و تننت‌های فعال در سراسر کشور"), fill="#FFFFFF", font=get_font(15, bold=True))
    draw.rectangle([(30, 285), (w - 270, 320)], fill="#0F172A")
    draw.text((w - 430, 295), fa("نام واحد آموزشی"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 600, 295), fa("کد شناسایی"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 740, 295), fa("شهر / منطقه"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 870, 295), fa("دانش‌آموزان"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((60, 295), fa("وضعیت"), fill="#94A3B8", font=get_font(12, bold=True))

    rows = [
        ("مجتمع آموزشی مهر آفرین", "SCH-MEHR-01", "تهران", "۱۴۵ نفر", "فعال ✓", "#10B981"),
        ("دبستان هوشمند البرز", "SCH-ALB-02", "کرج", "۳۲۰ نفر", "فعال ✓", "#10B981"),
        ("مجموعه مدارس رضوی", "SCH-RZV-03", "مشهد", "۴۸۰ نفر", "فعال ✓", "#10B981"),
        ("دبیرستان علامه طباطبایی", "SCH-TBZ-04", "تبریز", "۲۱۰ نفر", "فعال ✓", "#10B981"),
    ]
    for i, (name, code, city, stds, stat, stat_col) in enumerate(rows):
        y = 335 + i * 45
        draw.text((w - 490, y), fa(name), fill="#FFFFFF", font=get_font(12))
        draw.text((w - 600, y), code, fill="#C084FC", font=get_font(12))
        draw.text((w - 730, y), fa(city), fill="#E2E8F0", font=get_font(12))
        draw.text((w - 870, y), fa(stds), fill="#94A3B8", font=get_font(12))
        draw.text((60, y), fa(stat), fill=stat_col, font=get_font(12, bold=True))

    img.save(os.path.join(DOCS_DIR, "super-admin-rtl-fixed-overview.png"))
    print("[+] Saved super-admin-rtl-fixed-overview.png")

render_driver_manifest()
render_parent_status()
render_school_web()
render_super_admin()
