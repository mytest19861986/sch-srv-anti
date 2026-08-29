import urllib.request
import zipfile
import os
import shutil
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"g:\project\TEST\1"
TOOLS_DIR = os.path.join(ROOT_DIR, "tools")
JDK_DIR = os.path.join(TOOLS_DIR, "jdk-17")
JDK_ZIP = os.path.join(TOOLS_DIR, "openjdk17.zip")

os.makedirs(TOOLS_DIR, exist_ok=True)

# 1. Download OpenJDK 17 if not already downloaded
JDK_URL = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse"

if not os.path.exists(os.path.join(JDK_DIR, "bin", "java.exe")):
    print(f"[1/3] Downloading Portable OpenJDK 17 from Adoptium API...")
    req = urllib.request.Request(JDK_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req) as response, open(JDK_ZIP, 'wb') as out_file:
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
                print(f"\rDownloading JDK 17: {percent:.1f}% ({downloaded // (1024*1024)}MB / {total_size // (1024*1024)}MB)", end="")
    
    print("\n[+] Download complete. Extracting JDK 17...")
    temp_extract = os.path.join(TOOLS_DIR, "temp_jdk")
    os.makedirs(temp_extract, exist_ok=True)
    
    with zipfile.ZipFile(JDK_ZIP, 'r') as zip_ref:
        zip_ref.extractall(temp_extract)
        
    # Find extracted root folder
    subdirs = [os.path.join(temp_extract, d) for d in os.listdir(temp_extract) if os.path.isdir(os.path.join(temp_extract, d))]
    if subdirs:
        extracted_root = subdirs[0]
        if os.path.exists(JDK_DIR):
            shutil.rmtree(JDK_DIR)
        shutil.move(extracted_root, JDK_DIR)
        
    shutil.rmtree(temp_extract, ignore_errors=True)
    if os.path.exists(JDK_ZIP):
        os.remove(JDK_ZIP)
    print(f"[+] Portable OpenJDK 17 installed successfully at: {JDK_DIR}")
else:
    print(f"[+] JDK 17 already ready at: {JDK_DIR}")

# Verify Java
java_bin = os.path.join(JDK_DIR, "bin", "java.exe")
res = subprocess.run([java_bin, "-version"], capture_output=True, text=True)
print("[+] Java Version Output:\n", res.stderr or res.stdout)
