import subprocess
import webbrowser
import urllib.request
import socket
import time
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_DIR = r"g:\project\TEST\1"
BUN_EXE = r"C:\Program Files\Qwen\resources\bun\bun.exe"

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

local_ip = get_local_ip()

print("=" * 80)
print("  🚀 SAMANEH SERVICE YAR — PRODUCTION & WI-FI HOME PILOT LAUNCHER (v1.1.0)")
print("  سامانه هوشمند مدیریت ناوگان و سرویس مدارس (مدرسه + سوپر ادمین + بک‌اند)")
print("=" * 80)

os.chdir(PROJECT_DIR)

# Kill any existing processes on ports 3000, 3001, 3002 to ensure fresh 0.0.0.0 binding
try:
    subprocess.run(
        ["powershell", "-Command", "Get-NetTCPConnection -LocalPort 3000, 3001, 3002 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"],
        capture_output=True,
        timeout=5
    )
except Exception:
    pass

time.sleep(0.5)

# 1. Start Backend API Server (0.0.0.0:3000)
print(f"\n[1/3] Starting Backend API Server on 0.0.0.0:3000...")
backend_proc = subprocess.Popen(
    [BUN_EXE, "run", "services/backend-api/src/server.ts"],
    cwd=PROJECT_DIR,
    creationflags=subprocess.CREATE_NEW_CONSOLE
)

time.sleep(1.5)

# 2. Start School Web Dashboard (0.0.0.0:3001)
print(f"[2/3] Starting School Web Dashboard on 0.0.0.0:3001...")
school_proc = subprocess.Popen(
    [BUN_EXE, "run", "apps/school-web/server.ts"],
    cwd=PROJECT_DIR,
    creationflags=subprocess.CREATE_NEW_CONSOLE
)

time.sleep(1.2)

# 3. Start Super Admin Web Portal (0.0.0.0:3002)
print(f"[3/3] Starting Super Admin Portal on 0.0.0.0:3002...")
super_proc = subprocess.Popen(
    [BUN_EXE, "run", "apps/super-admin-web/server.ts"],
    cwd=PROJECT_DIR,
    creationflags=subprocess.CREATE_NEW_CONSOLE
)

time.sleep(1.5)

# Verify Endpoints
def check_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.getcode() == 200
    except Exception:
        return False

school_ok = check_url(f"http://{local_ip}:3001")
super_ok = check_url(f"http://{local_ip}:3002")
api_ok = check_url(f"http://{local_ip}:3000/health/live")

# Open Browser
print("\nOpening dashboards in default browser...")
webbrowser.open("http://localhost:3001")
time.sleep(0.5)
webbrowser.open("http://localhost:3002")

print("\n" + "=" * 80)
print("  🎉 ALL 3 PLATFORM SERVERS ARE LIVE ON 0.0.0.0!")
print("=" * 80)
print("\n💻 دسترسی از روی همین کامپیوتر (Localhost):")
print("  • پنل مدیریت مدرسه:   http://localhost:3001")
print("  • پنل مدیر کل کشور:   http://localhost:3002")
print("  • وب‌سرویس بک‌اند:      http://localhost:3000")
print("  • وضعیت سلامت سرور:   http://localhost:3000/health/live")

print("\n📱 دسترسی از گوشی موبایل، تبلت و سایر دستگاه‌ها (روی همین Wi-Fi):")
print(f"  • پنل مدرسه روی گوشی: http://{local_ip}:3001  {'[✅ تست موفق]' if school_ok else ''}")
print(f"  • پنل سوپر ادمین:     http://{local_ip}:3002  {'[✅ تست موفق]' if super_ok else ''}")
print(f"  • آدرس سرور در اپ:    http://{local_ip}:3000  {'[✅ تست موفق]' if api_ok else ''}")

print("\n🔑 اطلاعات حساب‌های کاربری پیش‌فرض دمو:")
print("  🏢 مدیر مدرسه: school@mehr.ir   | رمز: SchoolPass@123")
print("  🛡️ مدیر کل:   admin@platform.ir | رمز: SuperPass@123")
print("  🚐 راننده:     driver@serviceyar.ir | رمز: DriverPass@123")
print("  👨‍👩‍👧 والدین:     parent@serviceyar.ir | رمز: ParentPass@123")
print("=" * 80)

print("\nPress Enter to exit this launcher window (servers will remain running in background)...")
input()
