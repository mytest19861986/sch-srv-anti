import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = r"g:\project\TEST\1"

FILES_TO_CHECK = [
    ("apps/driver-android/gradle.properties", ["android.useAndroidX=true", "org.gradle.jvmargs"]),
    ("apps/parent-android/gradle.properties", ["android.useAndroidX=true", "org.gradle.jvmargs"]),
    ("apps/driver-android/gradle/wrapper/gradle-wrapper.properties", ["gradle-8.6-bin.zip"]),
    ("apps/parent-android/gradle/wrapper/gradle-wrapper.properties", ["gradle-8.6-bin.zip"]),
    ("apps/driver-android/gradle/wrapper/gradle-wrapper.jar", None),
    ("apps/parent-android/gradle/wrapper/gradle-wrapper.jar", None),
    ("apps/driver-android/gradlew.bat", ["JAVA_HOME", "gradle-wrapper.jar"]),
    ("apps/parent-android/gradlew.bat", ["JAVA_HOME", "gradle-wrapper.jar"]),
    ("apps/driver-android/gradlew", ["JAVA_HOME", "gradle-wrapper.jar"]),
    ("apps/parent-android/gradlew", ["JAVA_HOME", "gradle-wrapper.jar"]),
    ("apps/driver-android/app/build.gradle.kts", ["namespace = \"ir.school.driver\"", "applicationId = \"ir.serviceyar.driver\""]),
    ("apps/parent-android/app/build.gradle.kts", ["namespace = \"ir.school.parent\"", "applicationId = \"ir.serviceyar.parent\""]),
    ("apps/driver-android/app/src/main/AndroidManifest.xml", ["usesCleartextTraffic=\"true\"", "networkSecurityConfig=\"@xml/network_security_config\""]),
    ("apps/parent-android/app/src/main/AndroidManifest.xml", ["usesCleartextTraffic=\"true\"", "networkSecurityConfig=\"@xml/network_security_config\""]),
    ("apps/driver-android/app/src/main/res/xml/network_security_config.xml", ["cleartextTrafficPermitted=\"true\""]),
    ("apps/parent-android/app/src/main/res/xml/network_security_config.xml", ["cleartextTrafficPermitted=\"true\""]),
    ("apps/driver-android/app/src/main/java/ir/school/driver/data/ServerConfig.kt", ["DEFAULT_BASE_URL", "testHealthConnection"]),
    ("apps/parent-android/app/src/main/java/ir/school/parent/data/ServerConfig.kt", ["DEFAULT_BASE_URL", "testHealthConnection"]),
    ("apps/driver-android/app/src/main/java/ir/school/driver/ui/login/LoginScreen.kt", ["FIX-008", "تشخیص اتصال", "testHealthConnection"]),
    ("apps/parent-android/app/src/main/java/ir/school/parent/ui/login/LoginScreen.kt", ["FIX-008", "تشخیص اتصال", "testHealthConnection"]),
    ("apps/driver-android/app/src/main/java/ir/school/driver/di/NetworkModule.kt", ["DynamicHostInterceptor", "Log.d(\"ServiceYar\""]),
    ("apps/parent-android/app/src/main/java/ir/school/parent/di/NetworkModule.kt", ["DynamicHostInterceptor", "Log.d(\"ServiceYar\""]),
    ("docs/ANDROID_BUILD_FIXLOG.md", ["FIX-001", "FIX-002", "FIX-003", "FIX-004", "FIX-007", "FIX-008"]),
]

def verify_all():
    print("=" * 70)
    print("🔍 برسی جامع سلامت و یکپارچگی فایل‌های پروژه (Project Integrity Check)")
    print("=" * 70)
    all_ok = True
    for rel_path, required_keywords in FILES_TO_CHECK:
        full_path = os.path.join(ROOT, rel_path.replace("/", os.sep))
        exists = os.path.exists(full_path)
        size = os.path.getsize(full_path) if exists else 0
        if not exists:
            print(f"❌ مفقود: {rel_path}")
            all_ok = False
            continue
        
        # Check keywords if text file
        content_ok = True
        if required_keywords:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            for kw in required_keywords:
                if kw not in content:
                    print(f"⚠️ کلمه کلیدی '{kw}' در فایل {rel_path} یافت نشد!")
                    content_ok = False
                    all_ok = False
        
        if content_ok:
            print(f"✅ {rel_path:<60} [{size} B] - سالم و کامل")
            
    print("-" * 70)
    if all_ok:
        print("🎉 تمامی ۲۳ فایل کلیدی و تغییرات اعمال‌شده در سلامت ۱۰۰٪ قرار دارند.")
    else:
        print("❌ برخی فایل‌ها یا بخش‌ها ناقص هستند.")

if __name__ == "__main__":
    verify_all()
