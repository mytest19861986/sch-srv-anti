@echo off
chcp 65001 >nul
title 🚀 سامانه جامع مدیریت سرویس مدارس (سرویس یار)
color 0A

echo ==============================================================================
echo   🚐 سامانه هوشمند مدیریت ناوگان و سرویس مدارس (ServiceYar Platform)
echo   نسخه: v1.1.0 | محیط: Local Development & Pilot Mode
echo ==============================================================================
echo.

cd /d "%~dp0"

set BUN_EXE="C:\Program Files\Qwen\resources\bun\bun.exe"
if not exist %BUN_EXE% (
    set BUN_EXE=bun
)

echo [1/3] در حال راه‌اندازی سرور بک‌اند (پورت ۳۰۰۰)...
start "ServiceYar - Backend API [Port 3000]" cmd /k "cd /d "%~dp0" && %BUN_EXE% run services/backend-api/src/server.ts"

timeout /t 2 /nobreak >nul

echo [2/3] در حال راه‌اندازی پنل وب مدرسه (پورت ۳۰۰۱)...
start "ServiceYar - School Web [Port 3001]" cmd /k "cd /d "%~dp0" && %BUN_EXE% run --cwd apps/school-web next dev -H 127.0.0.1 -p 3001"

timeout /t 3 /nobreak >nul

echo [3/3] در حال باز کردن داشبورد مدرسه در مرورگر...
start "" "http://localhost:3001/students"

echo.
echo ==============================================================================
echo   🎉 سامانه با موفقیت اجرا شد و در مرورگر باز گردید!
echo ==============================================================================
echo.
echo   🔗 آدرس‌های دسترسی:
echo   • داشبورد مدرسه (School Admin):   http://localhost:3001
echo   • وب‌سرویس بک‌اند (Backend API):   http://localhost:3000
echo   • وضعیت سلامت سرور (Health Check): http://localhost:3000/health/live
echo.
echo   🔑 اطلاعات حساب‌های کاربری پیش‌فرض:
echo   ----------------------------------------------------------------------------
echo   🏢 مدیر مدرسه: school@mehr.ir        ^| رمز: SchoolPass@123
echo   🛡️ مدیر کل:   admin@platform.ir      ^| رمز: SuperPass@123
echo   🚐 راننده:     driver@serviceyar.ir   ^| رمز: DriverPass@123
echo   👨‍👩‍👧 ولی دانش‌آموز: parent@serviceyar.ir   ^| رمز: ParentPass@123
echo   ----------------------------------------------------------------------------
echo.
pause
