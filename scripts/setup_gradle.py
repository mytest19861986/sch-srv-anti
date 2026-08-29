import urllib.request
import zipfile
import os
import shutil
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"g:\project\TEST\1"
TOOLS_DIR = os.path.join(ROOT_DIR, "tools")
GRADLE_DIR = os.path.join(TOOLS_DIR, "gradle-8.6")
GRADLE_ZIP = os.path.join(TOOLS_DIR, "gradle86.zip")

GRADLE_URL = "https://services.gradle.org/distributions/gradle-8.6-bin.zip"

if not os.path.exists(os.path.join(GRADLE_DIR, "bin", "gradle.bat")):
    print(f"[1/2] Downloading Portable Gradle 8.6 from services.gradle.org...")
    req = urllib.request.Request(GRADLE_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req) as response, open(GRADLE_ZIP, 'wb') as out_file:
        total_size = int(response.info().get('Content-Length', 0))
        downloaded = 0
        block_size = 1024 * 1024  # 1MB
        
        while True:
            buffer = response.read(block_size)
            if not buffer:
                break
            downloaded += len(buffer)
            out_file.write(buffer)
            if total_size > 0:
                percent = downloaded * 100 / total_size
                print(f"\rDownloading Gradle 8.6: {percent:.1f}% ({downloaded // (1024*1024)}MB / {total_size // (1024*1024)}MB)", end="")
                
    print("\n[+] Download complete. Extracting Gradle 8.6...")
    temp_extract = os.path.join(TOOLS_DIR, "temp_gradle")
    os.makedirs(temp_extract, exist_ok=True)
    
    with zipfile.ZipFile(GRADLE_ZIP, 'r') as zip_ref:
        zip_ref.extractall(temp_extract)
        
    extracted_root = os.path.join(temp_extract, "gradle-8.6")
    if os.path.exists(extracted_root):
        if os.path.exists(GRADLE_DIR):
            shutil.rmtree(GRADLE_DIR)
        shutil.move(extracted_root, GRADLE_DIR)
        
    shutil.rmtree(temp_extract, ignore_errors=True)
    if os.path.exists(GRADLE_ZIP):
        os.remove(GRADLE_ZIP)
    print(f"[+] Gradle 8.6 installed at: {GRADLE_DIR}")
else:
    print(f"[+] Gradle 8.6 ready at: {GRADLE_DIR}")

# Verify Gradle with Java 17
jdk_dir = os.path.join(TOOLS_DIR, "jdk-17")
gradle_bat = os.path.join(GRADLE_DIR, "bin", "gradle.bat")

env = os.environ.copy()
env["JAVA_HOME"] = jdk_dir
env["PATH"] = os.path.join(jdk_dir, "bin") + os.pathsep + os.path.join(GRADLE_DIR, "bin") + os.pathsep + env["PATH"]

res = subprocess.run([gradle_bat, "-v"], env=env, capture_output=True, text=True)
print("[+] Gradle Version:\n", res.stdout)
