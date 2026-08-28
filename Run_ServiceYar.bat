@echo off
title ServiceYar School Transport Platform
color 0A
cls
echo ==============================================================================
echo   ServiceYar School Bus Platform - 1-Click Desktop Launcher
echo ==============================================================================
echo.

cd /d "G:\project\TEST\1"

echo [1/2] Starting Backend and Web servers...
"C:\Users\MYIT\AppData\Local\Programs\Python\Python313\python.exe" -u "G:\project\TEST\1\launcher.py"

