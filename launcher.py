import subprocess
import webbrowser
import time
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_DIR = r"g:\project\TEST\1"
BUN_EXE = r"C:\Program Files\Qwen\resources\bun\bun.exe"

print("=" * 70)
print("  🚀 SAMANEH SERVICE YAR — 1-CLICK LAUNCHER")
print("  سامانه مدیریت ناوگان سرویس مدارس")
print("=" * 70)

os.chdir(PROJECT_DIR)

# 1. Start Backend API Server
print("\n[1/3] Starting Backend API on http://127.0.0.1:3000...")
backend_process = subprocess.Popen(
    [BUN_EXE, "run", "services/backend-api/src/server.ts"],
    cwd=PROJECT_DIR,
    creationflags=subprocess.CREATE_NEW_CONSOLE
)

time.sleep(1.5)

# 2. Start School Web Server
print("[2/3] Starting School Web Dashboard on http://127.0.0.1:3001...")
web_process = subprocess.Popen(
    [BUN_EXE, "run", "apps/school-web/server.ts"],
    cwd=PROJECT_DIR,
    creationflags=subprocess.CREATE_NEW_CONSOLE
)

time.sleep(2.0)

# 3. Open Browser
target_url = "http://localhost:3001"
print(f"[3/3] Opening browser at {target_url}...")
webbrowser.open(target_url)

print("\n" + "=" * 70)
print("  ✅ All services started successfully!")
print("  • School Dashboard: http://localhost:3001")
print("  • Backend API:      http://localhost:3000")
print("  • Health Check:     http://localhost:3000/health/live")
print("=" * 70)
print("\nPress Enter to exit this launcher window (servers will remain active)...")
input()
