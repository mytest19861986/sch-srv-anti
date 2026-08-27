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

# 1. Super Admin Manage Tenant
def render_manage_tenant():
    w, h = 1200, 750
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Sidebar (RTL)
    draw.rectangle([(w - 240, 0), (w, h)], fill="#0F172A", outline="#1E293B")
    draw.text((w - 225, 30), fa("🛡️ راهبری سرویس یار"), fill="#A855F7", font=get_font(16, bold=True))
    items = ["📊 نمای کلی پلتفرم", "🏢 مدیریت مدارس و شعب", "👥 کاربران سراسری", "🔑 نقش‌ها و دسترسی‌ها", "📜 لاگ حسابرسی مرکزی", "📈 شاخص‌های کلان", "⚙️ تنظیمات پلتفرم"]
    for i, item in enumerate(items):
        draw.text((w - 210, 88 + i * 45), fa(item), fill="#94A3B8", font=get_font(13))

    # Purple Banner (Super Admin Override Mode)
    draw.rounded_rectangle([(30, 25), (w - 270, 115)], radius=12, fill="#3B0764", outline="#7E22CE", width=2)
    draw.rounded_rectangle([(w - 520, 36), (w - 290, 58)], radius=6, fill="#581C87")
    draw.text((w - 510, 40), fa("حالت راهبری کل (SUPER ADMIN OVERRIDE)"), fill="#F3E8FF", font=get_font(10, bold=True))
    draw.text((w - 560, 68), fa("دسترسی و مدیریت جامع داده‌های مجتمع مهر آفرین"), fill="#FFFFFF", font=get_font(16, bold=True))
    draw.text((w - 740, 92), fa("تمامی عملیات‌های حذف و ویرایش با شناسه Super Admin در Audit Log ثبت می‌شود."), fill="#D8B4FE", font=get_font(11))

    # Tabs
    draw.rounded_rectangle([(30, 130), (190, 165)], radius=8, fill="#7E22CE")
    draw.text((50, 140), fa("👨‍🎓 مدیریت دانش‌آموزان (۳)"), fill="#FFFFFF", font=get_font(12, bold=True))
    draw.rounded_rectangle([(200, 130), (340, 165)], radius=8, fill="#1E293B")
    draw.text((220, 140), fa("🚗 مدیریت رانندگان (۲)"), fill="#94A3B8", font=get_font(12))

    # Table
    draw.rounded_rectangle([(30, 180), (w - 270, 700)], radius=12, fill="#1E293B", outline="#334155")
    draw.rectangle([(30, 180), (w - 270, 220)], fill="#0F172A")
    draw.text((w - 420, 192), fa("نام دانش‌آموز"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 550, 192), fa("پایه"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 680, 192), fa("مسیر سرویس"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((w - 850, 192), fa("ولی مرتبط"), fill="#94A3B8", font=get_font(12, bold=True))
    draw.text((60, 192), fa("عملیات راهبری (Super Admin)"), fill="#94A3B8", font=get_font(12, bold=True))

    rows = [
        ("امیرعلی رضایی", "پایه ششم", "مسیر ۱ - ونک", "علی رضایی (۰۹۱۲۱۱۱۲۲۳۳)"),
        ("سارا محمدی", "پایه چهارم", "مسیر ۱ - ونک", "حسن محمدی (۰۹۱۲۲۲۲۳۳۴۴)"),
        ("کیان تهرانی", "پایه سوم", "مسیر ۱ - ونک", "محمد تهرانی (۰۹۱۲۵۵۵۶۶۷۷)")
    ]
    for i, (name, grade, route, parent) in enumerate(rows):
        y = 240 + i * 50
        draw.text((w - 440, y), fa(name), fill="#FFFFFF", font=get_font(13))
        draw.text((w - 550, y), fa(grade), fill="#E2E8F0", font=get_font(12))
        draw.text((w - 710, y), fa(route), fill="#C084FC", font=get_font(12))
        draw.text((w - 920, y), fa(parent), fill="#94A3B8", font=get_font(11))
        
        # Action buttons
        draw.rounded_rectangle([(140, y - 6), (220, y + 22)], radius=6, fill="#334155")
        draw.text((150, y - 2), fa("✏️ ویرایش"), fill="#FFFFFF", font=get_font(11))
        
        draw.rounded_rectangle([(40, y - 6), (130, y + 22)], radius=6, fill="#7F1D1D")
        draw.text((48, y - 2), fa("🗑 حذف با دلیل"), fill="#FCA5A5", font=get_font(11, bold=True))

    img.save(os.path.join(DOCS_DIR, "super-admin-manage-tenant.png"))
    print("[+] Saved super-admin-manage-tenant.png")

# 2. Super Admin Confirm Modal
def render_confirm_modal():
    w, h = 1200, 750
    img = Image.new("RGB", (w, h), "#0B0F19")
    draw = ImageDraw.Draw(img)

    # Base page background
    draw.rectangle([(0, 0), (w, h)], fill="#0F172A")
    draw.rectangle([(0, 0), (w, h)], fill=(0, 0, 0, 180))

    # Modal Box
    mw, mh = 500, 360
    mx1 = (w - mw) // 2
    my1 = (h - mh) // 2
    mx2 = mx1 + mw
    my2 = my1 + mh

    draw.rounded_rectangle([(mx1, my1), (mx2, my2)], radius=16, fill="#0F172A", outline="#DC2626", width=2)
    draw.text((mx2 - 280, my1 + 25), fa("⚠️ تأیید اقدام حساس توسط مدیر کل"), fill="#EF4444", font=get_font(16, bold=True))
    draw.text((mx2 - 380, my1 + 65), fa("آیا از حذف دانش‌آموز «امیرعلی رضایی» از مدرسه مهر آفرین اطمینان دارید؟"), fill="#E2E8F0", font=get_font(12))

    # Reason Textarea
    draw.text((mx2 - 340, my1 + 105), fa("علت اقدام مدیریتی (جهت ثبت در Audit Log سراسری): *"), fill="#94A3B8", font=get_font(11))
    draw.rounded_rectangle([(mx1 + 30, my1 + 130), (mx2 - 30, my1 + 220)], radius=8, fill="#020617", outline="#334155")
    draw.text((mx2 - 420, my1 + 145), fa("درخواست کتبی اولیا مبنی بر جابجایی محل سکونت و تسویه حساب"), fill="#CBD5E1", font=get_font(12))

    # Buttons
    draw.rounded_rectangle([(mx2 - 180, my2 - 60), (mx2 - 30, my2 - 20)], radius=8, fill="#DC2626")
    draw.text((mx2 - 165, my2 - 50), fa("تأیید و اجرای قطعی"), fill="#FFFFFF", font=get_font(13, bold=True))

    draw.rounded_rectangle([(mx2 - 270, my2 - 60), (mx2 - 200, my2 - 20)], radius=8, fill="#1E293B")
    draw.text((mx2 - 250, my2 - 50), fa("انصراف"), fill="#94A3B8", font=get_font(13))

    img.save(os.path.join(DOCS_DIR, "super-admin-confirm-modal.png"))
    print("[+] Saved super-admin-confirm-modal.png")

render_manage_tenant()
render_confirm_modal()
