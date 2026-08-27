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

def draw_modal_screen(title, modal_title, fields, filename):
    w, h = 1200, 750
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Sidebar (RTL)
    draw.rectangle([(w - 240, 0), (w, h)], fill="#0F172A", outline="#1E293B")
    draw.text((w - 215, 30), fa("🏢 سرویس یار - مدرسه"), fill="#38BDF8", font=get_font(16, bold=True))
    items = ["📊 نمای کلی داشبورد", "👨‍🎓 فهرست دانش‌آموزان", "👨‍👩‍👧 فهرست اولیا", "🚗 رانندگان مجاز", "🚐 ناوگان خودرویی", "🗺️ مسیرها و ایستگاه‌ها", "🔄 سرویس‌های فعال", "📋 گزارش رویدادها", "⚙️ تنظیمات"]
    for i, item in enumerate(items):
        draw.text((w - 210, 88 + i * 45), fa(item), fill="#94A3B8", font=get_font(13))

    # Header
    draw.rectangle([(30, 25), (w - 270, 85)], fill="#1E293B", outline="#334155")
    draw.text((w - 520, 40), fa(title), fill="#F8FAFC", font=get_font(18, bold=True))

    # Table background
    draw.rounded_rectangle([(30, 105), (w - 270, 700)], radius=12, fill="#1E293B", outline="#334155")

    # Dark overlay for modal
    draw.rectangle([(0, 0), (w, h)], fill=(0, 0, 0, 180))

    # Modal Box (Centered)
    mw, mh = 480, 420
    mx1 = (w - mw) // 2
    my1 = (h - mh) // 2
    mx2 = mx1 + mw
    my2 = my1 + mh

    draw.rounded_rectangle([(mx1, my1), (mx2, my2)], radius=16, fill="#0F172A", outline="#334155", width=2)
    draw.text((mx2 - 260, my1 + 25), fa(modal_title), fill="#FFFFFF", font=get_font(16, bold=True))

    for i, (label, val) in enumerate(fields):
        fy = my1 + 75 + i * 55
        draw.text((mx2 - 180, fy), fa(label), fill="#94A3B8", font=get_font(12))
        draw.rounded_rectangle([(mx1 + 25, fy + 20), (mx2 - 25, fy + 50)], radius=8, fill="#020617", outline="#1E293B")
        draw.text((mx2 - 45 - len(val)*6, fy + 26), fa(val), fill="#E2E8F0", font=get_font(13))

    # Action Buttons
    btn_y = my2 - 55
    draw.rounded_rectangle([(mx2 - 145, btn_y), (mx2 - 25, btn_y + 36)], radius=8, fill="#059669")
    draw.text((mx2 - 125, btn_y + 9), fa("ثبت و ذخیره ✓"), fill="#FFFFFF", font=get_font(13, bold=True))

    draw.rounded_rectangle([(mx2 - 245, btn_y), (mx2 - 160, btn_y + 36)], radius=8, fill="#1E293B")
    draw.text((mx2 - 225, btn_y + 9), fa("انصراف"), fill="#94A3B8", font=get_font(13))

    img.save(os.path.join(DOCS_DIR, filename))
    print(f"[+] Saved {filename}")

# 1. Students Create
draw_modal_screen(
    "مدیریت و ثبت‌نام دانش‌آموزان واحد آموزشی",
    "ثبت‌نام دانش‌آموز جدید در سامانه سرویس",
    [("نام و نام خانوادگی", "پارسا کمالی"), ("کد ملی", "۰۰۲۳۴۵۶۷۸۹"), ("پایه تحصیلی", "پایه چهارم"), ("مسیر سرویس", "مسیر ۱ - ونک")],
    "school-students-create.png"
)

# 2. Parents Create
draw_modal_screen(
    "مدیریت اولیا و صدور حساب‌های کاربری",
    "ثبت پرونده و ایجاد حساب اولیا با رمز موقت",
    [("نام و نام خانوادگی ولی", "دکتر علیرضا نادری"), ("شماره همراه", "۰۹۱۲۵۵۵۴۴۳۳"), ("پست الکترونیک", "parent.naderi@mehr.ir"), ("تعداد فرزندان", "۲ فرزند")],
    "school-parents-create.png"
)

# 3. Drivers Create
draw_modal_screen(
    "مدیریت ناوگان رانندگان مجاز مدرسه",
    "استخدام و صدور پرونده راننده جدید",
    [("نام و نام خانوادگی راننده", "کاظم مرادی"), ("شماره همراه", "۰۹۱۲۷۷۷۸۸۹۹"), ("شماره گواهینامه", "پ-۴۵۶۷۸۹"), ("خودروی تخصیص‌یافته", "ون تویوتا هایس")],
    "school-drivers-create.png"
)

# 4. Routes Create
draw_modal_screen(
    "تعریف خطوط و مسیرهای تردد ناوگان",
    "تعریف و ثبت مسیر سرویس جدید",
    [("عنوان مسیر", "مسیر ۳ - سعادت‌آباد به مدرسه"), ("کد مسیر", "RT-SAD-3"), ("تعداد ایستگاه‌ها", "۵ ایستگاه"), ("راننده مسئول", "علی رضایی")],
    "school-routes-create.png"
)

# 5. Vehicles Create
draw_modal_screen(
    "ناوگان وسایل نقلیه واحد آموزشی",
    "افزودن وسیله نقلیه جدید به ناوگان مدرسه",
    [("نوع و مدل خودرو", "ون فیات دوکاتو ۱۶ نفره"), ("پلاک انتظامی", "۱۲ ب ۳۴۵ ایران ۱۱"), ("ظرفیت مسافر", "۱۶ صندلی"), ("راننده پیش‌فرض", "کاظم مرادی")],
    "school-vehicles-create.png"
)
