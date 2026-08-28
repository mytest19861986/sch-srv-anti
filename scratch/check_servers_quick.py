import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

urls = {
    "Backend API (Health)": "http://127.0.0.1:3000/health/live",
    "School Web (Login)": "http://127.0.0.1:3001/students",
    "Super Admin Web (Login)": "http://127.0.0.1:3002"
}

results = {}
for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            results[name] = {"status": response.getcode(), "url": url, "ok": True}
    except Exception as e:
        results[name] = {"status": str(e), "url": url, "ok": False}

print(json.dumps(results, indent=2, ensure_ascii=False))
