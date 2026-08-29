import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"g:\project\TEST\1"
JDK_DIR = os.path.join(ROOT_DIR, "tools", "jdk-17")
GRADLE_BAT = os.path.join(ROOT_DIR, "tools", "gradle-8.6", "bin", "gradle.bat")

env = os.environ.copy()
env["JAVA_HOME"] = JDK_DIR
env["PATH"] = os.path.join(JDK_DIR, "bin") + os.pathsep + os.path.join(ROOT_DIR, "tools", "gradle-8.6", "bin") + os.pathsep + env["PATH"]

def build_app(app_name):
    app_dir = os.path.join(ROOT_DIR, "apps", app_name)
    print(f"\n{'='*70}\n[+] Compiling Android Project: {app_name}\n{'='*70}")
    
    cmd = [GRADLE_BAT, "assembleDebug", "--stacktrace"]
    print(f"Executing: {' '.join(cmd)} in {app_dir}")
    
    p = subprocess.Popen(cmd, cwd=app_dir, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    
    for line in iter(p.stdout.readline, ''):
        print(line, end='')
    
    p.wait()
    print(f"\n[+] Build finished with status code: {p.returncode}")
    
    apk_debug_path = os.path.join(app_dir, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
    if os.path.exists(apk_debug_path):
        size = os.path.getsize(apk_debug_path)
        print(f"[SUCCESS] Genuine APK generated at: {apk_debug_path} ({size} bytes / {size/(1024*1024):.2f} MB)")
        return apk_debug_path
    else:
        print(f"[WARNING] APK not generated at expected location: {apk_debug_path}")
        return None

if __name__ == "__main__":
    driver_apk = build_app("driver-android")
    parent_apk = build_app("parent-android")
