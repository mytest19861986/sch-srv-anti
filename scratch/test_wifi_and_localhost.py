import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_endpoint(name, url, method="GET", data=None):
    headers = {'User-Agent': 'Mozilla/5.0'}
    t0 = time.time()
    try:
        req_data = json.dumps(data).encode('utf-8') if data else None
        if data:
            headers['Content-Type'] = 'application/json'
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=4) as response:
            latency = int((time.time() - t0) * 1000)
            return {
                "name": name,
                "url": url,
                "status": response.getcode(),
                "ok": True,
                "latency_ms": latency
            }
    except Exception as e:
        latency = int((time.time() - t0) * 1000)
        return {
            "name": name,
            "url": url,
            "status": str(e),
            "ok": False,
            "latency_ms": latency
        }

print("=" * 80)
print("🔍 تست جامع دسترسی از Localhost و از طریق شبکه Wi-Fi موبایل (192.168.1.110)")
print("=" * 80)

endpoints = [
    ("Backend API (Localhost)", "http://127.0.0.1:3000/health/live", "GET", None),
    ("School Web (Localhost)", "http://127.0.0.1:3001", "GET", None),
    ("Super Admin Web (Localhost)", "http://127.0.0.1:3002", "GET", None),
    ("Backend API (Wi-Fi LAN)", "http://192.168.1.110:3000/health/live", "GET", None),
    ("School Web (Wi-Fi LAN)", "http://192.168.1.110:3001", "GET", None),
    ("Super Admin Web (Wi-Fi LAN)", "http://192.168.1.110:3002", "GET", None)
]

for name, url, method, data in endpoints:
    res = test_endpoint(name, url, method, data)
    icon = "✅ فعال (200 OK)" if res["ok"] else "❌ خطا"
    print(f"[{icon:15}] {name:30} | {url:36} | {res['latency_ms']}ms")

print("=" * 80)
