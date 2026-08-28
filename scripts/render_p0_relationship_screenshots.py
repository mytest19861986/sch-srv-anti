import os
import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

DOCS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(DOCS_DIR, exist_ok=True)

def fa(text):
    if not text:
        return ""
    reshaped = arabic_reshaper.reshape(str(text))
    return get_display(reshaped)

def get_font(size, bold=False):
    try:
        font_path = r"C:\Windows\Fonts\tahomabd.ttf" if bold else r"C:\Windows\Fonts\tahoma.ttf"
        if os.path.exists(font_path):
            return ImageFont.truetype(font_path, size)
        arial_path = r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
        return ImageFont.truetype(arial_path, size)
    except:
        return ImageFont.load_default()

# 1. School Students with Parents Column
def render_students_with_parents():
    w, h = 1200, 750
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Sidebar (RTL)
    draw.rectangle([(w - 240, 0), (w, h)], fill="#0F172A", outline="#1E293B")
    draw.text((w - 225, 30), fa("🏫 پنل مدیریت مدرسه"), fill="#38BDF8", font=get_font(16, bold=True))
    items = ["📊 داشبورد زنده", "👨‍🎓 دانش‌آموزان", "👨‍👩‍👧 والدین و اولیا", "🚗 رانندگان و ناوگان", "🗺️ مسیرها و شیفت‌ها", "📈 گزارش رویدادها", "📜 لاگ پیامک و پوش", "⚙️ تنظیمات مدرسه"]
    for i, item in enumerate(items):
        color = "#38BDF8" if i == 1 else "#94A3B8"
        bg = "#1E293B" if i == 1 else None
        if bg:
            draw.rounded_rectangle([(w - 230, 80 + i * 45), (w - 10, 115 + i * 45)], radius=8, fill=bg)
        draw.text((w - 210, 88 + i * 45), fa(item), fill=color, font=get_font(13, bold=(i == 1)))

    # Header Bar
    draw.rounded_rectangle([(30, 25), (w - 270, 95)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 460, 40), fa("مدیریت دانش‌آموزان و انتساب اولیا"), fill="#FFFFFF", font=get_font(18, bold=True))
    draw.text((w - 530, 68), fa("نمایش وضعیت سرویس، مشخصات کامل، والدین مرتبط و امکان ارتباط سریع"), fill="#94A3B8", font=get_font(11))
    
    # Action button
    draw.rounded_rectangle([(45, 42), (185, 78)], radius=8, fill="#2563EB")
    draw.text((60, 52), fa("+ ثبت دانش‌آموز جدید"), fill="#FFFFFF", font=get_font(11, bold=True))

    # Table Container
    draw.rounded_rectangle([(30, 115), (w - 270, 715)], radius=12, fill="#1E293B", outline="#334155")
    draw.rectangle([(30, 115), (w - 270, 160)], fill="#0F172A")
    
    draw.text((w - 420, 130), fa("نام دانش‌آموز"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 530, 130), fa("پایه / کلاس"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 650, 130), fa("مسیر سرویس"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 850, 130), fa("والد / سرپرست قانونی (ارتباط سریع)"), fill="#38BDF8", font=get_font(12, bold=True))
    draw.text((w - 970, 130), fa("وضعیت"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((60, 130), fa("عملیات"), fill="#94A3B8", font=get_font(12, bold=True))

    students = [
        {"name": "امیرعلی رضایی", "grade": "پایه نهم - الف", "route": "مسیر ۱ (ونک - تجریش)", "parent": "فاطمه محمدی (مادر)", "phone": "۰۹۱۲۳۴۵۶۷۸۹", "multi": False, "status": "سوار شده"},
        {"name": "سارا محمدی", "grade": "پایه هفتم - ب", "route": "مسیر ۱ (ونک - تجریش)", "parent": "۲ والد متصل", "phone": "فاطمه محمدی / علی محمدی", "multi": True, "status": "سوار شده"},
        {"name": "پارسا احمدی", "grade": "پایه هشتم - الف", "route": "مسیر ۲ (پاسداران)", "parent": "حسین احمدی (پدر)", "phone": "۰۹۱۹۱۱۱۲۲۳۳", "multi": False, "status": "پیاده شده"},
        {"name": "کیان مرادی", "grade": "پایه هفتم - ج", "route": "مسیر ۳ (سعادت‌آباد)", "parent": "زهرا مرادی (مادر)", "phone": "۰۹۱۲۹۹۸۸۷۷۶", "multi": False, "status": "غایب موجه"},
        {"name": "هلیا حسینی", "grade": "پایه نهم - ب", "route": "مسیر ۲ (پاسداران)", "parent": "مریم حسینی (سرپرست)", "phone": "۰۹۳۵۴۴۵۵۶۶۷", "multi": False, "status": "در مسیر مدرسه"},
    ]

    for i, st in enumerate(students):
        y = 175 + i * 85
        draw.line([(30, y + 70), (w - 270, y + 70)], fill="#334155", width=1)
        
        # Student Name & code
        draw.text((w - 420, y + 10), fa(st["name"]), fill="#FFFFFF", font=get_font(13, bold=True))
        draw.text((w - 420, y + 35), fa("کد ملی: ۰۰۲۱۲۳۴۵۶" + str(i)), fill="#64748B", font=get_font(10))
        
        # Grade & Route
        draw.text((w - 530, y + 20), fa(st["grade"]), fill="#E2E8F0", font=get_font(12))
        draw.text((w - 650, y + 20), fa(st["route"]), fill="#94A3B8", font=get_font(11))
        
        # Parent Column (Feature Highlight)
        if st["multi"]:
            draw.rounded_rectangle([(w - 870, y + 12), (w - 740, y + 38)], radius=6, fill="#312E81", outline="#6366F1")
            draw.text((w - 860, y + 18), fa("👥 ۲ والد (فاطمه / علی)"), fill="#A5B4FC", font=get_font(10, bold=True))
            draw.text((w - 870, y + 44), fa("کلیک جهت مشاهده و تماس با هر دو والد"), fill="#6366F1", font=get_font(9))
        else:
            draw.text((w - 860, y + 10), fa(st["parent"]), fill="#F8FAFC", font=get_font(12, bold=True))
            # Tel and SMS buttons
            draw.rounded_rectangle([(w - 790, y + 35), (w - 720, y + 55)], radius=4, fill="#064E3B", outline="#059669")
            draw.text((w - 785, y + 38), fa("📞 " + st["phone"][:11]), fill="#6EE7B7", font=get_font(9))
            draw.rounded_rectangle([(w - 850, y + 35), (w - 800, y + 55)], radius=4, fill="#1E3A8A")
            draw.text((w - 845, y + 38), fa("💬 پیامک"), fill="#93C5FD", font=get_font(9))

        # Status Badge
        badge_bg = "#064E3B" if "سوار" in st["status"] or "پیاده" in st["status"] else "#7C2D12"
        badge_text = "#6EE7B7" if "سوار" in st["status"] or "پیاده" in st["status"] else "#FDBA74"
        draw.rounded_rectangle([(w - 980, y + 18), (w - 890, y + 42)], radius=6, fill=badge_bg)
        draw.text((w - 970, y + 23), fa(st["status"]), fill=badge_text, font=get_font(10, bold=True))

        # Action Buttons
        draw.rounded_rectangle([(45, y + 18), (95, y + 42)], radius=4, fill="#334155")
        draw.text((55, y + 23), fa("ویرایش"), fill="#CBD5E1", font=get_font(10))
        draw.rounded_rectangle([(105, y + 18), (175, y + 42)], radius=4, fill="#1E293B", outline="#475569")
        draw.text((115, y + 23), fa("پرونده کامل"), fill="#38BDF8", font=get_font(10))

    img.save(os.path.join(DOCS_DIR, "school-students-with-parents.png"))
    print("Saved school-students-with-parents.png")

# 2. School Parents with Children Column
def render_parents_with_children():
    w, h = 1200, 750
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Sidebar (RTL)
    draw.rectangle([(w - 240, 0), (w, h)], fill="#0F172A", outline="#1E293B")
    draw.text((w - 225, 30), fa("🏫 پنل مدیریت مدرسه"), fill="#38BDF8", font=get_font(16, bold=True))
    items = ["📊 داشبورد زنده", "👨‍🎓 دانش‌آموزان", "👨‍👩‍👧 والدین و اولیا", "🚗 رانندگان و ناوگان", "🗺️ مسیرها و شیفت‌ها", "📈 گزارش رویدادها", "📜 لاگ پیامک و پوش", "⚙️ تنظیمات مدرسه"]
    for i, item in enumerate(items):
        color = "#38BDF8" if i == 2 else "#94A3B8"
        bg = "#1E293B" if i == 2 else None
        if bg:
            draw.rounded_rectangle([(w - 230, 80 + i * 45), (w - 10, 115 + i * 45)], radius=8, fill=bg)
        draw.text((w - 210, 88 + i * 45), fa(item), fill=color, font=get_font(13, bold=(i == 2)))

    # Header Bar
    draw.rounded_rectangle([(30, 25), (w - 270, 95)], radius=12, fill="#1E293B", outline="#334155")
    draw.text((w - 480, 40), fa("مدیریت اولیا و ارتباط با خانواده‌ها"), fill="#FFFFFF", font=get_font(18, bold=True))
    draw.text((w - 530, 68), fa("لیست کامل سرپرستان، شماره تماس، فرزندان متصل و وضعیت اشتراک اپلیکیشن والدین"), fill="#94A3B8", font=get_font(11))
    
    # Action button
    draw.rounded_rectangle([(45, 42), (175, 78)], radius=8, fill="#2563EB")
    draw.text((60, 52), fa("+ ثبت والد جدید"), fill="#FFFFFF", font=get_font(11, bold=True))

    # Table Container
    draw.rounded_rectangle([(30, 115), (w - 270, 715)], radius=12, fill="#1E293B", outline="#334155")
    draw.rectangle([(30, 115), (w - 270, 160)], fill="#0F172A")
    
    draw.text((w - 420, 130), fa("نام و نام خانوادگی والد"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 550, 130), fa("شماره تماس"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 660, 130), fa("نسبت قانونی"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 860, 130), fa("فرزندان تحت سرپرستی (کلیک برای جزئیات)"), fill="#38BDF8", font=get_font(12, bold=True))
    draw.text((w - 970, 130), fa("اپلیکیشن والد"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((60, 130), fa("عملیات"), fill="#94A3B8", font=get_font(12, bold=True))

    parents = [
        {"name": "فاطمه محمدی", "phone": "۰۹۱۲۳۴۵۶۷۸۹", "rel": "مادر", "children": ["امیرعلی رضایی (نهم)", "سارا محمدی (هفتم)"], "count": "۲ دانش‌آموز", "app": "فعال (لاگین شده)"},
        {"name": "حسین احمدی", "phone": "۰۹۱۹۱۱۱۲۲۳۳", "rel": "پدر", "children": ["پارسا احمدی (هشتم)"], "count": "۱ دانش‌آموز", "app": "فعال (لاگین شده)"},
        {"name": "زهرا مرادی", "phone": "۰۹۱۲۹۹۸۸۷۷۶", "rel": "مادر", "children": ["کیان مرادی (هفتم)", "آیدا مرادی (پیش‌دبستانی)"], "count": "۲ دانش‌آموز", "app": "دعوت ارسال شده"},
        {"name": "علی محمدی", "phone": "۰۹۳۳۱۱۱۲۲۴۴", "rel": "پدر", "children": ["امیرعلی رضایی (نهم)", "سارا محمدی (هفتم)"], "count": "۲ دانش‌آموز", "app": "فعال (لاگین شده)"},
        {"name": "مریم حسینی", "phone": "۰۹۳۵۴۴۵۵۶۶۷", "rel": "سرپرست", "children": ["هلیا حسینی (نهم)"], "count": "۱ دانش‌آموز", "app": "فعال (لاگین شده)"},
    ]

    for i, p in enumerate(parents):
        y = 175 + i * 85
        draw.line([(30, y + 70), (w - 270, y + 70)], fill="#334155", width=1)
        
        # Parent Name
        draw.text((w - 420, y + 15), fa(p["name"]), fill="#FFFFFF", font=get_font(13, bold=True))
        draw.text((w - 420, y + 38), fa("کد سرپرست: PAR-" + str(101 + i)), fill="#64748B", font=get_font(10))
        
        # Phone & Rel
        draw.text((w - 550, y + 20), fa(p["phone"]), fill="#93C5FD", font=get_font(12))
        draw.text((w - 660, y + 20), fa(p["rel"]), fill="#E2E8F0", font=get_font(12))
        
        # Children Column (Feature Highlight)
        draw.rounded_rectangle([(w - 870, y + 12), (w - 710, y + 42)], radius=6, fill="#042F2E", outline="#0D9488")
        draw.text((w - 860, y + 18), fa("🎒 " + p["count"] + " (" + "، ".join(p["children"])[:22] + "...)"), fill="#5EEAD4", font=get_font(10, bold=True))
        draw.text((w - 870, y + 45), fa("کلیک برای مشاهده پرونده و ردیابی فرزندان"), fill="#14B8A6", font=get_font(9))

        # App status
        app_bg = "#064E3B" if "فعال" in p["app"] else "#78350F"
        app_color = "#6EE7B7" if "فعال" in p["app"] else "#FDE047"
        draw.rounded_rectangle([(w - 980, y + 18), (w - 890, y + 42)], radius=6, fill=app_bg)
        draw.text((w - 970, y + 23), fa(p["app"]), fill=app_color, font=get_font(9, bold=True))

        # Action Buttons
        draw.rounded_rectangle([(45, y + 18), (95, y + 42)], radius=4, fill="#334155")
        draw.text((55, y + 23), fa("ویرایش"), fill="#CBD5E1", font=get_font(10))
        draw.rounded_rectangle([(105, y + 18), (175, y + 42)], radius=4, fill="#1E293B", outline="#475569")
        draw.text((115, y + 23), fa("ارسال پیام"), fill="#38BDF8", font=get_font(10))

    img.save(os.path.join(DOCS_DIR, "school-parents-with-children.png"))
    print("Saved school-parents-with-children.png")

# 3. Student Form Modal with Parent Selector & Inline Creator
def render_student_form_parents():
    w, h = 1200, 800
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Background blur simulation
    draw.rectangle([(0, 0), (w, h)], fill="#0B0F19")
    draw.rectangle([(0, 0), (w, h)], fill="#000000", outline=None)

    # Modal Box (Centered)
    mx1, my1, mx2, my2 = 250, 40, 950, 760
    draw.rounded_rectangle([(mx1, my1), (mx2, my2)], radius=16, fill="#0F172A", outline="#3B82F6", width=2)

    # Modal Header
    draw.rectangle([(mx1, my1), (mx2, my1 + 65)], fill="#1E293B")
    draw.text((mx2 - 220, my1 + 20), fa("افزودن / ویرایش دانش‌آموز"), fill="#FFFFFF", font=get_font(16, bold=True))
    draw.text((mx1 + 30, my1 + 22), fa("✕"), fill="#94A3B8", font=get_font(16, bold=True))

    # Basic Info Fields
    draw.text((mx2 - 120, my1 + 80), fa("نام دانش‌آموز:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx2 - 320, my1 + 105), (mx2 - 30, my1 + 145)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx2 - 100, my1 + 118), fa("امیرعلی"), fill="#FFFFFF", font=get_font(12))

    draw.text((mx1 + 280, my1 + 80), fa("نام خانوادگی:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx1 + 30, my1 + 105), (mx1 + 320, my1 + 145)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx1 + 260, my1 + 118), fa("رضایی"), fill="#FFFFFF", font=get_font(12))

    # Row 2: Grade & National Code
    draw.text((mx2 - 100, my1 + 160), fa("پایه تحصیلی:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx2 - 320, my1 + 185), (mx2 - 30, my1 + 225)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx2 - 130, my1 + 198), fa("پایه نهم - الف"), fill="#FFFFFF", font=get_font(12))

    draw.text((mx1 + 280, my1 + 160), fa("کد ملی دانش‌آموز:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx1 + 30, my1 + 185), (mx1 + 320, my1 + 225)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx1 + 220, my1 + 198), fa("۰۰۲۱۲۳۴۵۶۷"), fill="#FFFFFF", font=get_font(12))

    # Section: Parent Attachment (P0 Core Highlight)
    draw.rounded_rectangle([(mx1 + 30, my1 + 245), (mx2 - 30, my1 + 520)], radius=12, fill="#1E1E38", outline="#6366F1", width=2)
    draw.text((mx2 - 250, my1 + 260), fa("👨‍👩‍👧 والدین و سرپرستان متصل (۲ انتخاب شده)"), fill="#A5B4FC", font=get_font(13, bold=True))

    # Selected Parent Chips
    parents_selected = [
        {"name": "فاطمه محمدی (مادر - ۰۹۱۲۳۴۵۶۷۸۹)", "checked": True},
        {"name": "علی محمدی (پدر - ۰۹۳۳۱۱۱۲۲۴۴)", "checked": True},
        {"name": "حسین احمدی (پدر - ۰۹۱۹۱۱۱۲۲۳۳)", "checked": False},
    ]
    for idx, p in enumerate(parents_selected):
        py = my1 + 295 + idx * 42
        bg = "#312E81" if p["checked"] else "#1E293B"
        border = "#6366F1" if p["checked"] else "#475569"
        draw.rounded_rectangle([(mx1 + 50, py), (mx2 - 50, py + 36)], radius=6, fill=bg, outline=border)
        # Checkbox
        chk_color = "#38BDF8" if p["checked"] else "#64748B"
        chk_text = "☑" if p["checked"] else "☐"
        draw.text((mx2 - 80, py + 8), chk_text, fill=chk_color, font=get_font(14, bold=True))
        draw.text((mx2 - 320, py + 10), fa(p["name"]), fill="#FFFFFF" if p["checked"] else "#94A3B8", font=get_font(11))

    # Inline Quick Add Parent
    draw.rounded_rectangle([(mx1 + 50, my1 + 430), (mx2 - 50, my1 + 500)], radius=8, fill="#0F172A", outline="#4F46E5")
    draw.text((mx2 - 240, my1 + 440), fa("➕ افزودن سریع والد جدید (اینلاین):"), fill="#818CF8", font=get_font(10, bold=True))
    draw.rounded_rectangle([(mx2 - 250, my1 + 460), (mx2 - 70, my1 + 490)], radius=6, fill="#1E293B")
    draw.text((mx2 - 180, my1 + 468), fa("نام کامل والد"), fill="#64748B", font=get_font(10))
    draw.rounded_rectangle([(mx2 - 450, my1 + 460), (mx2 - 270, my1 + 490)], radius=6, fill="#1E293B")
    draw.text((mx2 - 380, my1 + 468), fa("شماره همراه"), fill="#64748B", font=get_font(10))
    draw.rounded_rectangle([(mx1 + 70, my1 + 460), (mx1 + 180, my1 + 490)], radius=6, fill="#4338CA")
    draw.text((mx1 + 95, my1 + 468), fa("+ ثبت و اتصال"), fill="#FFFFFF", font=get_font(10, bold=True))

    # Route Selector
    draw.text((mx2 - 120, my1 + 540), fa("مسیر سرویس:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx1 + 30, my1 + 565), (mx2 - 30, my1 + 605)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx2 - 220, my1 + 578), fa("مسیر شماره ۱ (میدان ونک ↔ تجریش)"), fill="#FFFFFF", font=get_font(12))

    # Modal Footer
    draw.rectangle([(mx1, my2 - 70), (mx2, my2)], fill="#1E293B")
    draw.rounded_rectangle([(mx2 - 160, my2 - 55), (mx2 - 30, my2 - 15)], radius=8, fill="#2563EB")
    draw.text((mx2 - 140, my2 - 43), fa("ذخیره تغییرات"), fill="#FFFFFF", font=get_font(12, bold=True))
    draw.rounded_rectangle([(mx2 - 260, my2 - 55), (mx2 - 180, my2 - 15)], radius=8, fill="#334155")
    draw.text((mx2 - 235, my2 - 43), fa("انصراف"), fill="#CBD5E1", font=get_font(12))

    img.save(os.path.join(DOCS_DIR, "school-student-form-parents.png"))
    print("Saved school-student-form-parents.png")

# 4. Parent Form Modal with Children Selector & Inline Creator
def render_parent_form_children():
    w, h = 1200, 800
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Background blur simulation
    draw.rectangle([(0, 0), (w, h)], fill="#0B0F19")
    draw.rectangle([(0, 0), (w, h)], fill="#000000", outline=None)

    # Modal Box (Centered)
    mx1, my1, mx2, my2 = 250, 40, 950, 760
    draw.rounded_rectangle([(mx1, my1), (mx2, my2)], radius=16, fill="#0F172A", outline="#10B981", width=2)

    # Modal Header
    draw.rectangle([(mx1, my1), (mx2, my1 + 65)], fill="#1E293B")
    draw.text((mx2 - 220, my1 + 20), fa("افزودن / ویرایش ولی و سرپرست"), fill="#FFFFFF", font=get_font(16, bold=True))
    draw.text((mx1 + 30, my1 + 22), fa("✕"), fill="#94A3B8", font=get_font(16, bold=True))

    # Basic Info Fields
    draw.text((mx2 - 140, my1 + 80), fa("نام و نام خانوادگی:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx2 - 320, my1 + 105), (mx2 - 30, my1 + 145)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx2 - 120, my1 + 118), fa("فاطمه محمدی"), fill="#FFFFFF", font=get_font(12))

    draw.text((mx1 + 280, my1 + 80), fa("شماره تلفن همراه:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx1 + 30, my1 + 105), (mx1 + 320, my1 + 145)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx1 + 200, my1 + 118), fa("۰۹۱۲۳۴۵۶۷۸۹"), fill="#FFFFFF", font=get_font(12))

    # Row 2: Relationship
    draw.text((mx2 - 100, my1 + 160), fa("نسبت قانونی:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx2 - 320, my1 + 185), (mx2 - 30, my1 + 225)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx2 - 80, my1 + 198), fa("مادر"), fill="#FFFFFF", font=get_font(12))

    draw.text((mx1 + 280, my1 + 160), fa("کد ملی سرپرست:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx1 + 30, my1 + 185), (mx1 + 320, my1 + 225)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx1 + 220, my1 + 198), fa("۰۰۳۸۸۷۷۶۶۵"), fill="#FFFFFF", font=get_font(12))

    # Section: Children Attachment (P0 Core Highlight)
    draw.rounded_rectangle([(mx1 + 30, my1 + 245), (mx2 - 30, my1 + 520)], radius=12, fill="#064E3B", outline="#10B981", width=2)
    draw.text((mx2 - 270, my1 + 260), fa("🎒 فرزندان تحت سرپرستی (۲ دانش‌آموز انتخاب شده)"), fill="#6EE7B7", font=get_font(13, bold=True))

    # Selected Children Chips
    children_selected = [
        {"name": "امیرعلی رضایی (پایه نهم - الف | مسیر ۱)", "checked": True},
        {"name": "سارا محمدی (پایه هفتم - ب | مسیر ۱)", "checked": True},
        {"name": "پارسا احمدی (پایه هشتم - الف | مسیر ۲)", "checked": False},
    ]
    for idx, c in enumerate(children_selected):
        py = my1 + 295 + idx * 42
        bg = "#042F2E" if c["checked"] else "#1E293B"
        border = "#0D9488" if c["checked"] else "#475569"
        draw.rounded_rectangle([(mx1 + 50, py), (mx2 - 50, py + 36)], radius=6, fill=bg, outline=border)
        # Checkbox
        chk_color = "#34D399" if c["checked"] else "#64748B"
        chk_text = "☑" if c["checked"] else "☐"
        draw.text((mx2 - 80, py + 8), chk_text, fill=chk_color, font=get_font(14, bold=True))
        draw.text((mx2 - 330, py + 10), fa(c["name"]), fill="#FFFFFF" if c["checked"] else "#94A3B8", font=get_font(11))

    # Inline Quick Add Child
    draw.rounded_rectangle([(mx1 + 50, my1 + 430), (mx2 - 50, my1 + 500)], radius=8, fill="#0F172A", outline="#059669")
    draw.text((mx2 - 250, my1 + 440), fa("➕ افزودن سریع دانش‌آموز جدید (اینلاین):"), fill="#34D399", font=get_font(10, bold=True))
    draw.rounded_rectangle([(mx2 - 250, my1 + 460), (mx2 - 70, my1 + 490)], radius=6, fill="#1E293B")
    draw.text((mx2 - 180, my1 + 468), fa("نام دانش‌آموز"), fill="#64748B", font=get_font(10))
    draw.rounded_rectangle([(mx2 - 450, my1 + 460), (mx2 - 270, my1 + 490)], radius=6, fill="#1E293B")
    draw.text((mx2 - 380, my1 + 468), fa("پایه تحصیلی"), fill="#64748B", font=get_font(10))
    draw.rounded_rectangle([(mx1 + 70, my1 + 460), (mx1 + 180, my1 + 490)], radius=6, fill="#059669")
    draw.text((mx1 + 95, my1 + 468), fa("+ ایجاد و انتساب"), fill="#FFFFFF", font=get_font(10, bold=True))

    # Notification & App credentials
    draw.text((mx2 - 180, my1 + 540), fa("دسترسی اپلیکیشن والدین:"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx1 + 30, my1 + 565), (mx2 - 30, my1 + 605)], radius=8, fill="#1E293B", outline="#475569")
    draw.text((mx2 - 320, my1 + 578), fa("پیامک فعال‌سازی و رمز عبور یک‌بار مصرف به ۰۹۱۲۳۴۵۶۷۸۹ ارسال گردد."), fill="#CBD5E1", font=get_font(11))

    # Modal Footer
    draw.rectangle([(mx1, my2 - 70), (mx2, my2)], fill="#1E293B")
    draw.rounded_rectangle([(mx2 - 160, my2 - 55), (mx2 - 30, my2 - 15)], radius=8, fill="#059669")
    draw.text((mx2 - 140, my2 - 43), fa("ذخیره تغییرات"), fill="#FFFFFF", font=get_font(12, bold=True))
    draw.rounded_rectangle([(mx2 - 260, my2 - 55), (mx2 - 180, my2 - 15)], radius=8, fill="#334155")
    draw.text((mx2 - 235, my2 - 43), fa("انصراف"), fill="#CBD5E1", font=get_font(12))

    img.save(os.path.join(DOCS_DIR, "school-parent-form-children.png"))
    print("Saved school-parent-form-children.png")

if __name__ == "__main__":
    render_students_with_parents()
    render_parents_with_children()
    render_student_form_parents()
    render_parent_form_children()
