import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1920
HEIGHT = 1080
FPS = 30
TOTAL_SECONDS = 60
TOTAL_FRAMES = FPS * TOTAL_SECONDS

DOCS_DIR = r"g:\project\TEST\1\docs"
SCREENSHOTS_DIR = os.path.join(DOCS_DIR, "screenshots")
OUTPUT_VIDEO = os.path.join(DOCS_DIR, "demo-video.mp4")

# Load existing screenshots if available
def load_img(name):
    p = os.path.join(SCREENSHOTS_DIR, name)
    if os.path.exists(p):
        return Image.open(p).convert("RGB")
    return None

img_login = load_img("school-web-login.png")
img_overview = load_img("school-overview-v2.png")
img_events = load_img("school-events-report.png")
img_audit = load_img("school-audit-log.png")

# Font helpers
try:
    font_large = ImageFont.truetype("arial.ttf", 42)
    font_sub = ImageFont.truetype("arial.ttf", 26)
    font_title = ImageFont.truetype("arial.ttf", 52)
except:
    font_large = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_title = ImageFont.load_default()

def draw_text_centered(draw, text, y, font, fill=(255, 255, 255)):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    x = (WIDTH - w) // 2
    draw.text((x, y), text, font=font, fill=fill)

def create_base_frame(t):
    # Dark modern slate gradient background
    img = Image.new("RGB", (WIDTH, HEIGHT), (15, 23, 42))
    draw = ImageDraw.Draw(img)
    return img, draw

def render_scene_1(progress):
    # 0 - 5s: School Login
    img, draw = create_base_frame(progress)
    if img_login:
        resized = img_login.resize((1500, 840), Image.Resampling.LANCZOS)
        img.paste(resized, (210, 80))
    else:
        draw.rectangle([210, 80, 1710, 920], fill=(30, 41, 59), outline=(56, 189, 248), width=2)
    
    # Subtitle bar
    draw.rounded_rectangle([250, 960, 1670, 1040], radius=15, fill=(2, 6, 23, 220), outline=(14, 165, 233), width=2)
    draw_text_centered(draw, "سامانه هوشمند سرویس یار — ورود امن و Zero-Trust کادر اداری مدرسه", 980, font_large, (224, 242, 254))
    return img

def render_scene_2(progress):
    # 5 - 15s: School Overview v2 Dashboard
    img, draw = create_base_frame(progress)
    if img_overview:
        resized = img_overview.resize((1600, 850), Image.Resampling.LANCZOS)
        img.paste(resized, (160, 70))
    else:
        draw.rectangle([160, 70, 1760, 920], fill=(30, 41, 59))
        
    draw.rounded_rectangle([250, 960, 1670, 1040], radius=15, fill=(2, 6, 23, 220), outline=(16, 185, 129), width=2)
    draw_text_centered(draw, "پایش بلادرنگ شیفت صبحگاهی: ۵ شاخص آماری، نوار سگمنتی پیشرفت و چارت ساعتی تردد", 980, font_large, (209, 250, 229))
    return img

def render_scene_3(progress):
    # 15 - 25s: Driver App (Offline Event Record)
    img, draw = create_base_frame(progress)
    
    # Draw Phone Bezel for Driver App
    draw.rounded_rectangle([660, 80, 1260, 920], radius=35, fill=(2, 6, 23), outline=(51, 65, 85), width=6)
    draw.rounded_rectangle([680, 100, 1240, 900], radius=25, fill=(15, 23, 42))
    
    # Header
    draw.rectangle([680, 100, 1240, 170], fill=(30, 41, 59))
    draw.text((710, 125), "سرویس یار - راننده (حالت آفلاین)", font=font_sub, fill=(251, 191, 36))
    
    # Manifest Card
    draw.rounded_rectangle([700, 200, 1220, 320], radius=15, fill=(30, 41, 59), outline=(245, 158, 11), width=2)
    draw.text((720, 220), "دانش‌آموز: سارا تهرانی (ایستگاه ونک)", font=font_sub, fill=(255, 255, 255))
    draw.text((720, 265), "وضعیت: در صف ارسال (Offline Queued)", font=font_sub, fill=(251, 191, 36))
    
    # Button
    draw.rounded_rectangle([720, 360, 1200, 430], radius=12, fill=(16, 185, 129))
    draw.text((880, 380), "ثبت سوار شد (PICKED_UP)", font=font_sub, fill=(255, 255, 255))

    draw.rounded_rectangle([250, 960, 1670, 1040], radius=15, fill=(2, 6, 23, 220), outline=(245, 158, 11), width=2)
    draw_text_centered(draw, "کلاینت موبایل رانندگان — ثبت قطعی رویدادهای سوار/پیاده شدن حتی در نقاط کور اینترنت", 980, font_large, (254, 243, 199))
    return img

def render_scene_4(progress):
    # 25 - 35s: Batch Sync & Outbox Processing
    img, draw = create_base_frame(progress)
    
    # Phone Reconnected
    draw.rounded_rectangle([660, 80, 1260, 920], radius=35, fill=(2, 6, 23), outline=(16, 185, 129), width=6)
    draw.rounded_rectangle([680, 100, 1240, 900], radius=25, fill=(15, 23, 42))
    
    draw.rectangle([680, 100, 1240, 170], fill=(6, 78, 59))
    draw.text((710, 125), "اتصال مجدد برقرار شد — همگام‌سازی", font=font_sub, fill=(110, 231, 183))
    
    draw.rounded_rectangle([700, 200, 1220, 320], radius=15, fill=(6, 78, 59), outline=(16, 185, 129), width=2)
    draw.text((720, 220), "دانش‌آموز: سارا تهرانی", font=font_sub, fill=(255, 255, 255))
    draw.text((720, 265), "وضعیت: همگام‌سازی شد (Synced 200 OK)", font=font_sub, fill=(110, 231, 183))
    
    draw.rounded_rectangle([250, 960, 1670, 1040], radius=15, fill=(2, 6, 23, 220), outline=(14, 165, 233), width=2)
    draw_text_centered(draw, "همگام‌سازی دسته‌ای خودکار + پردازش صف Outbox و ارسال آنی پوش نوتیفیکیشن", 980, font_large, (224, 242, 254))
    return img

def render_scene_5(progress):
    # 35 - 45s: Parent App (Timeline & Notification)
    img, draw = create_base_frame(progress)
    
    # Phone Bezel for Parent
    draw.rounded_rectangle([660, 80, 1260, 920], radius=35, fill=(2, 6, 23), outline=(99, 102, 241), width=6)
    draw.rounded_rectangle([680, 100, 1240, 900], radius=25, fill=(15, 23, 42))
    
    draw.rectangle([680, 100, 1240, 170], fill=(49, 46, 129))
    draw.text((710, 125), "سرویس یار - اولیا و والدین", font=font_sub, fill=(199, 210, 254))
    
    # Live Status Card
    draw.rounded_rectangle([700, 200, 1220, 360], radius=15, fill=(30, 41, 59), outline=(16, 185, 129), width=2)
    draw.text((720, 220), "فرزند: سارا تهرانی (پایه چهارم)", font=font_sub, fill=(255, 255, 255))
    draw.text((720, 265), "وضعیت فعلی: سوار سرویس شد (در مسیر)", font=font_sub, fill=(52, 211, 153))
    draw.text((720, 310), "زمان ثبت: ۰۷:۱۵:۲۴ توسط راننده علی رضایی", font=font_sub, fill=(148, 163, 184))

    draw.rounded_rectangle([250, 960, 1670, 1040], radius=15, fill=(2, 6, 23, 220), outline=(99, 102, 241), width=2)
    draw_text_centered(draw, "آرامش خاطر والدین با مشاهده زنده خط زمانی، نقشه خودرو و تایید لحظه‌ای سوار شدن", 980, font_large, (224, 231, 255))
    return img

def render_scene_6(progress):
    # 45 - 55s: School Audit Log & Reports
    img, draw = create_base_frame(progress)
    if img_audit:
        resized = img_audit.resize((1600, 850), Image.Resampling.LANCZOS)
        img.paste(resized, (160, 70))
    else:
        draw.rectangle([160, 70, 1760, 920], fill=(30, 41, 59))
        
    draw.rounded_rectangle([250, 960, 1670, 1040], radius=15, fill=(2, 6, 23, 220), outline=(168, 85, 247), width=2)
    draw_text_centered(draw, "شفافیت و امنیت ۱۰۰٪ — ثبت غیرقابل دستکاری کلیه لاگ‌های حسابرسی و رخدادها", 980, font_large, (243, 232, 255))
    return img

def render_scene_7(progress):
    # 55 - 60s: Outro & Logo
    img, draw = create_base_frame(progress)
    
    draw.rounded_rectangle([560, 260, 1360, 780], radius=30, fill=(2, 6, 23, 240), outline=(14, 165, 233), width=3)
    
    draw_text_centered(draw, "سرویس یار (ServiceYar)", 350, font_title, (14, 165, 233))
    draw_text_centered(draw, "سامانه جامع و هوشمند مدیریت ناوگان سرویس مدارس کشور", 460, font_large, (255, 255, 255))
    draw_text_centered(draw, "www.serviceyar.ir", 560, font_large, (56, 189, 248))
    draw_text_centered(draw, "معماری مقیاس‌پذیر | آفلاین‌محور | Zero-Trust Multi-Tenancy", 650, font_sub, (148, 163, 184))

    draw.rounded_rectangle([250, 960, 1670, 1040], radius=15, fill=(2, 6, 23, 220), outline=(14, 165, 233), width=2)
    draw_text_centered(draw, "سرویس یار — گامی نو در هوشمندسازی و امنیت سفرهای دانش‌آموزی", 980, font_large, (224, 242, 254))
    return img

def generate_video():
    print(f"[*] Starting rendering {TOTAL_SECONDS}s demo video to {OUTPUT_VIDEO}...", flush=True)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, FPS, (WIDTH, HEIGHT))

    for frame_idx in range(TOTAL_FRAMES):
        sec = frame_idx / FPS
        progress = frame_idx / TOTAL_FRAMES
        
        if sec < 5.0:
            frame_img = render_scene_1(sec / 5.0)
        elif sec < 15.0:
            frame_img = render_scene_2((sec - 5.0) / 10.0)
        elif sec < 25.0:
            frame_img = render_scene_3((sec - 15.0) / 10.0)
        elif sec < 35.0:
            frame_img = render_scene_4((sec - 25.0) / 10.0)
        elif sec < 45.0:
            frame_img = render_scene_5((sec - 35.0) / 10.0)
        elif sec < 55.0:
            frame_img = render_scene_6((sec - 45.0) / 10.0)
        else:
            frame_img = render_scene_7((sec - 55.0) / 5.0)
            
        # Draw Progress Bar at very top
        d = ImageDraw.Draw(frame_img)
        bar_w = int(WIDTH * progress)
        d.rectangle([0, 0, bar_w, 6], fill=(14, 165, 233))
        
        # Convert PIL to CV2 frame (BGR)
        cv_frame = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGB2BGR)
        out.write(cv_frame)
        
        if frame_idx % 150 == 0:
            print(f"[+] Rendered frame {frame_idx}/{TOTAL_FRAMES} ({int(sec)}s)...", flush=True)

    out.release()
    file_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print(f"[✔] Video rendering complete! Output: {OUTPUT_VIDEO} ({file_size_mb:.2f} MB)", flush=True)

if __name__ == "__main__":
    generate_video()
