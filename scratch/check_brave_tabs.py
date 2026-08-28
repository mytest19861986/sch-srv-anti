import urllib.request
import json

try:
    resp = urllib.request.urlopen("http://127.0.0.1:9222/json")
    tabs = json.loads(resp.read().decode('utf-8'))
    print("Open Brave tabs:")
    for t in tabs:
        print(f"- {t.get('title')}: {t.get('url')} (id: {t.get('id')})")
except Exception as e:
    print("CDP Error:", e)
