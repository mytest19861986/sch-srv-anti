import subprocess
import time
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BUN_PATH = r"C:\Program Files\Qwen\resources\bun\bun.exe"
ROOT_DIR = r"g:\project\TEST\1"

def print_banner():
    print("=" * 80)
    print("  🚀 SAMANEH SERVICE YAR — PRODUCTION & WI-FI HOME PILOT LAUNCHER (v1.2.0)")
    print("  سامانه هوشمند مدیریت ناوگان و سرویس مدارس (مدرسه + سوپر ادمین + بک‌اند + اپ راننده و والدین)")
    print("=" * 80)

def main():
    print_banner()

    # 1. Backend API (Port 3000)
    print("\n[1/5] Starting Backend API Server on 0.0.0.0:3000...")
    p_backend = subprocess.Popen(
        [BUN_PATH, "services/backend-api/src/server.ts"],
        cwd=ROOT_DIR,
        env={**os.environ, "PORT": "3000", "HOST": "0.0.0.0"}
    )
    time.sleep(1.5)

    # 2. School Web (Port 3001)
    print("[2/5] Starting School Web Dashboard on 0.0.0.0:3001...")
    p_school = subprocess.Popen(
        [BUN_PATH, "apps/school-web/server.ts"],
        cwd=ROOT_DIR,
        env={**os.environ, "PORT": "3001", "HOST": "0.0.0.0"}
    )
    time.sleep(1.0)

    # 3. Super Admin Web (Port 3002)
    print("[3/5] Starting Super Admin Portal on 0.0.0.0:3002...")
    p_super = subprocess.Popen(
        [BUN_PATH, "apps/super-admin-web/server.ts"],
        cwd=ROOT_DIR,
        env={**os.environ, "PORT": "3002", "HOST": "0.0.0.0"}
    )
    time.sleep(1.0)

    # 4. Driver PWA (Port 3003)
    print("[4/5] Starting Driver PWA on 0.0.0.0:3003...")
    p_driver_pwa = subprocess.Popen(
        [BUN_PATH, "apps/driver-pwa/server.ts"],
        cwd=ROOT_DIR,
        env={**os.environ, "PORT": "3003", "HOST": "0.0.0.0"}
    )
    time.sleep(1.0)

    # 5. Parent PWA (Port 3004)
    print("[5/5] Starting Parent PWA on 0.0.0.0:3004...")
    p_parent_pwa = subprocess.Popen(
        [BUN_PATH, "apps/parent-pwa/server.ts"],
        cwd=ROOT_DIR,
        env={**os.environ, "PORT": "3004", "HOST": "0.0.0.0"}
    )
    time.sleep(1.0)

    print("\n" + "=" * 80)
    print("  🎉 ALL 5 PLATFORM SERVERS & PWAs ARE LIVE ON 0.0.0.0!")
    print("=" * 80)
    print("\n💻 دسترسی از روی همین کامپیوتر (Localhost):")
    print("  • پنل مدیریت مدرسه:   http://localhost:3001")
    print("  • پنل مدیر کل کشور:   http://localhost:3002")
    print("  • اپلیکیشن رانندگان:  http://localhost:3003  (PWA قابل نصب)")
    print("  • اپلیکیشن والدین:    http://localhost:3004  (PWA قابل نصب)")
    print("  • وب‌سرویس بک‌اند:      http://localhost:3000")
    print("  • وضعیت سلامت سرور:   http://localhost:3000/health/live")

    print("\n📱 دسترسی از گوشی موبایل، تبلت و سایر دستگاه‌ها (روی همین Wi-Fi):")
    print("  • 🚐 اپ راننده روی گوشی:  http://192.168.1.110:3003  [نصب مستقیم در Chrome]")
    print("  • 👨‍👩‍👧 اپ والدین روی گوشی:  http://192.168.1.110:3004  [نصب مستقیم در Chrome]")
    print("  • 🏢 پنل مدرسه روی گوشی:  http://192.168.1.110:3001")
    print("  • 🛡️ پنل سوپر ادمین:     http://192.168.1.110:3002")

    print("\n🔑 اطلاعات حساب‌های کاربری پیش‌فرض دمو:")
    print("  🏢 مدیر مدرسه: school@mehr.ir   | رمز: SchoolPass@123")
    print("  🛡️ مدیر کل:   admin@platform.ir | رمز: SuperPass@123")
    print("  🚐 راننده:     driver@serviceyar.ir | رمز: DriverPass@123")
    print("  👨‍👩‍👧 والدین:     parent@serviceyar.ir | رمز: ParentPass@123")
    print("=" * 80 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        for p in [p_backend, p_school, p_super, p_driver_pwa, p_parent_pwa]:
            p.terminate()

if __name__ == "__main__":
    main()
