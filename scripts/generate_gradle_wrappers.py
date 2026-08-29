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

def setup_wrapper(app_name):
    app_dir = os.path.join(ROOT_DIR, "apps", app_name)
    print(f"\n[+] Generating Gradle Wrapper 8.6 for: {app_name}")
    cmd = [GRADLE_BAT, "wrapper", "--gradle-version", "8.6", "--distribution-type", "bin"]
    res = subprocess.run(cmd, cwd=app_dir, env=env, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    
    # Check generated files
    files = [
        os.path.join(app_dir, "gradlew"),
        os.path.join(app_dir, "gradlew.bat"),
        os.path.join(app_dir, "gradle", "wrapper", "gradle-wrapper.jar"),
        os.path.join(app_dir, "gradle", "wrapper", "gradle-wrapper.properties")
    ]
    for f in files:
        print(f"File {os.path.basename(f)} exists: {os.path.exists(f)} (Size: {os.path.getsize(f) if os.path.exists(f) else 0}B)")

if __name__ == "__main__":
    setup_wrapper("driver-android")
    setup_wrapper("parent-android")
