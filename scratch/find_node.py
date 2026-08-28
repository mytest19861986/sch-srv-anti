import os

paths_to_check = [
    r"C:\Program Files\nodejs\node.exe",
    r"C:\Program Files (x86)\nodejs\node.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\node\node.exe"),
    os.path.expandvars(r"%APPDATA%\nvm"),
    os.path.expandvars(r"%LOCALAPPDATA%\fnm_multishells"),
    r"C:\Users\MYIT\AppData\Local\Programs\Python\Python313\python.exe"
]

for p in paths_to_check:
    print(f"{p} exists: {os.path.exists(p)}")

# Also search Program Files for node.exe
print("\nSearching Program Files for node.exe:")
for root, dirs, files in os.walk(r"C:\Program Files"):
    if "node.exe" in files:
        print(os.path.join(root, "node.exe"))
        break
