import urllib.request
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_url(name, url, method="GET", data=None):
    headers = {'User-Agent': 'Mozilla/5.0'}
    t0 = time.time()
    try:
        req_data = json.dumps(data).encode('utf-8') if data else None
        if data:
            headers['Content-Type'] = 'application/json'
        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=4) as response:
            latency = int((time.time() - t0) * 1000)
            return {"name": name, "url": url, "status": response.getcode(), "ok": True, "latency": latency}
    except Exception as e:
        latency = int((time.time() - t0) * 1000)
        return {"name": name, "url": url, "status": str(e), "ok": False, "latency": latency}

print("=" * 85)
print("🚀 SMOKE TEST: SAMANEH SERVICE YAR RELEASE v1.2.0 (ALL 9 CORE SERVICE GATES)")
print("=" * 85)

endpoints = [
    ("1. Backend API Live Health", "http://127.0.0.1:3000/health/live", "GET", None),
    ("2. Backend API Ready Health", "http://127.0.0.1:3000/health/ready", "GET", None),
    ("3. Super Admin Overview (Port 3002)", "http://127.0.0.1:3002", "GET", None),
    ("4. Super Admin Manage View (Port 3002)", "http://127.0.0.1:3002/tenants/tenant-school-mehr/manage", "GET", None),
    ("5. School Web Dashboard (Port 3001)", "http://127.0.0.1:3001", "GET", None),
    ("6. School Web Students (Port 3001)", "http://127.0.0.1:3001/students", "GET", None),
    ("7. School Web Drivers (Port 3001)", "http://127.0.0.1:3001/drivers", "GET", None),
    ("8. Wi-Fi LAN Backend (192.168.1.110:3000)", "http://192.168.1.110:3000/health/live", "GET", None),
    ("9. Wi-Fi LAN School Web (192.168.1.110:3001)", "http://192.168.1.110:3001", "GET", None),
]

all_ok = True
for name, url, method, data in endpoints:
    res = test_url(name, url, method, data)
    if not res["ok"]:
        all_ok = False
    icon = "✅ HEALTHY" if res["ok"] else "❌ FAILED"
    print(f"[{icon:10}] {name:40} | Status: {res['status']:3} | Latency: {res['latency']:3}ms")

print("=" * 85)
print(f"Smoke Test Verdict: {'🎉 ALL 9 SERVICES 100% HEALTHY' if all_ok else '⚠️ SOME SERVICES FAILED'}")
print("=" * 85)
