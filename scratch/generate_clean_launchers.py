import os

PYTHON_EXE = r"C:\Users\MYIT\AppData\Local\Programs\Python\Python313\python.exe"
BUN_EXE = r"C:\Program Files\Qwen\resources\bun\bun.exe"
PROJECT_DIR = r"G:\project\TEST\1"
DESKTOP = os.path.expanduser(r"C:\Users\MYIT\Desktop")

# 1. Pure ASCII / Safe Batch Script for Desktop
bat_content = f"""@echo off
title ServiceYar School Transport Platform
color 0A
cls
echo ==============================================================================
echo   ServiceYar School Bus Platform - 1-Click Desktop Launcher
echo ==============================================================================
echo.

cd /d "{PROJECT_DIR}"

echo [1/2] Starting Backend and Web servers...
"{PYTHON_EXE}" -u "{PROJECT_DIR}\\launcher.py"

"""

files_to_write = [
    os.path.join(DESKTOP, "Run_ServiceYar.bat"),
    os.path.join(DESKTOP, "ServiceYar_Launcher.bat"),
    os.path.join(PROJECT_DIR, "Run_ServiceYar.bat")
]

for fpath in files_to_write:
    with open(fpath, "w", encoding="ascii", errors="ignore", newline="\r\n") as f:
        f.write(bat_content)
    print(f"[+] Wrote clean batch launcher to: {fpath}")

# Also create a VBScript launcher (silent / 1-click double-click)
vbs_content = f'''Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "{PROJECT_DIR}"
WshShell.Run """{PYTHON_EXE}""" & " """{PROJECT_DIR}\\launcher.py""", 1, False
'''

vbs_path = os.path.join(DESKTOP, "Run_ServiceYar.vbs")
with open(vbs_path, "w", encoding="ascii", errors="ignore", newline="\r\n") as f:
    f.write(vbs_content)
print(f"[+] Wrote VBScript launcher to: {vbs_path}")
