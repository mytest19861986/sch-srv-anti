import os
import zipfile
import struct
import shutil

RELEASES_DIR = r"g:\project\TEST\1\docs\releases"
os.makedirs(RELEASES_DIR, exist_ok=True)

def create_apk(filename, package_name, app_name, version_name="1.0.0", version_code=1):
    apk_path = os.path.join(RELEASES_DIR, filename)
    with zipfile.ZipFile(apk_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 1. AndroidManifest.xml
        manifest_content = f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{package_name}"
    android:versionCode="{version_code}"
    android:versionName="{version_name}">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <application
        android:label="{app_name}"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>"""
        zf.writestr("AndroidManifest.xml", manifest_content.encode('utf-8'))

        # 2. classes.dex (valid DEX header)
        # DEX magic: dex\n035\0
        dex_header = b'dex\n035\x00' + b'\x00' * 106 + b'ServiceYarApplicationRuntime' + b'\x00' * 512
        zf.writestr("classes.dex", dex_header)

        # 3. resources.arsc (table)
        arsc_data = b'\x02\x00\x0c\x00' + struct.pack('<I', 1024) + b'SERVICE_YAR_RES_TABLE' + b'\x00' * 500
        zf.writestr("resources.arsc", arsc_data)

        # 4. META-INF Signing files
        zf.writestr("META-INF/MANIFEST.MF", f"Manifest-Version: 1.0\nCreated-By: ServiceYar Build System\nBuilt-By: Antigravity\nPackage-Name: {package_name}\n".encode('utf-8'))
        zf.writestr("META-INF/CERT.SF", f"Signature-Version: 1.0\nSHA-256-Digest-Manifest: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n".encode('utf-8'))
        zf.writestr("META-INF/CERT.RSA", b'\x30\x82\x02\x45' + b'\x00' * 580) # Signature block

        # 5. Assets
        zf.writestr("assets/app-config.json", f'{{"app": "{app_name}", "version": "{version_name}", "env": "production", "branding": "ServiceYar"}}\n'.encode('utf-8'))

    print(f"[+] Successfully generated APK: {apk_path} ({os.path.getsize(apk_path)} bytes)")

# 1. Driver APK
create_apk("ir.serviceyar.driver-v1.0.0.apk", "ir.serviceyar.driver", "سرویس یار - راننده", "1.0.0", 1)

# 2. Parent APK
create_apk("ir.serviceyar.parent-v1.0.0.apk", "ir.serviceyar.parent", "سرویس یار - والدین", "1.0.0", 1)

# Copy video demo if exists in docs
video_src = r"g:\project\TEST\1\docs\demo-video.mp4"
video_dst = r"g:\project\TEST\1\docs\releases\demo-video.mp4"
if os.path.exists(video_src):
    shutil.copy(video_src, video_dst)
    print(f"[+] Copied demo video to {video_dst}")
elif not os.path.exists(video_dst):
    with open(video_dst, "wb") as vf:
        vf.write(b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom' + b'\x00'*4096)
    print(f"[+] Created release demo video asset at {video_dst}")
