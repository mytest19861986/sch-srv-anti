import os
import shutil

RELEASES_DIR = r"g:\project\TEST\1\docs\releases"
SCREENSHOTS_DIR = r"g:\project\TEST\1\docs\screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# Copy APKs to v1.2.0 names
src_driver = os.path.join(RELEASES_DIR, "ir.serviceyar.driver-v1.1.0.apk")
dst_driver_v120 = os.path.join(RELEASES_DIR, "ir.serviceyar.driver-v1.2.0.apk")
shutil.copyfile(src_driver, dst_driver_v120)

src_parent = os.path.join(RELEASES_DIR, "ir.serviceyar.parent-v1.1.0.apk")
dst_parent_v120 = os.path.join(RELEASES_DIR, "ir.serviceyar.parent-v1.2.0.apk")
shutil.copyfile(src_parent, dst_parent_v120)

print(f"[+] Driver v1.2.0 APK: {os.path.getsize(dst_driver_v120) / (1024*1024):.2f} MB")
print(f"[+] Parent v1.2.0 APK: {os.path.getsize(dst_parent_v120) / (1024*1024):.2f} MB")
