import urllib.request
import time

url = "http://127.0.0.1:3001/students"
print(f"Connecting to {url} (allowing compilation time)...")
t0 = time.time()
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        print(f"Status: {resp.getcode()} (Compiled in {time.time() - t0:.2f}s)")
        html = resp.read().decode('utf-8')
        print(f"Received {len(html)} bytes of HTML")
except Exception as e:
    print("Error:", e)
