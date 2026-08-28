import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_endpoint(name, url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {'User-Agent': 'Mozilla/5.0'}
    t0 = time.time()
    try:
        req_data = json.dumps(data).encode('utf-8') if data else None
        if data:
            headers['Content-Type'] = 'application/json'
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=5) as response:
            latency = int((time.time() - t0) * 1000)
            body = response.read().decode('utf-8', errors='ignore')
            return {
                "name": name,
                "url": url,
                "status": response.getcode(),
                "ok": True,
                "latency_ms": latency,
                "preview": body[:120].replace('\n', ' ')
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

print("=" * 70)
print("🔍 تست جامع وضعیت سلامت و لایو بودن سرویس‌های سامانه سرویس یار")
print("=" * 70)

endpoints = [
    ("Backend API Health Live", "http://127.0.0.1:3000/health/live", "GET", None),
    ("Backend API Health Ready", "http://127.0.0.1:3000/health/ready", "GET", None),
    ("School Web Panel", "http://127.0.0.1:3001", "GET", None),
    ("Auth Login Endpoint", "http://127.0.0.1:3000/api/v1/auth/login", "POST", {
        "email": "school@mehr.ir",
        "password": "SchoolPass@123"
    })
]

results = []
for name, url, method, data in endpoints:
    res = test_endpoint(name, url, method, data)
    results.append(res)
    icon = "✅ فعال (OK)" if res["ok"] else "❌ غیرفعال"
    print(f"[{icon}] {name:26} | Status: {str(res['status']):10} | Latency: {res['latency_ms']}ms")

print("=" * 70)
