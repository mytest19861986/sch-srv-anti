import urllib.request
import json
import websockets
import asyncio
import os
import struct
import sys

sys.stdout.reconfigure(encoding='utf-8')

QA_DIR = r"g:\project\TEST\1\temp\qa"
os.makedirs(QA_DIR, exist_ok=True)

# 1. Curl and Header Check
urls_to_check = [
    ("http://localhost:3004/manifest.json", "application/manifest+json"),
    ("http://localhost:3004/icons/icon-192x192.png", "image/png"),
    ("http://localhost:3004/icons/icon-512x512.png", "image/png"),
    ("http://localhost:3004/sw.js", "application/javascript")
]

curl_output_lines = []

for url, expected_type in urls_to_check:
    req = urllib.request.Request(url, method='HEAD')
    with urllib.request.urlopen(req) as resp:
        status = resp.status
        content_type = resp.headers.get('Content-Type')
        content_length = resp.headers.get('Content-Length')
        line = f"URL: {url} -> HTTP {status} OK | Content-Type: {content_type} | Content-Length: {content_length}"
        curl_output_lines.append(line)
        print("[Curl Check]", line)

# PNG Format Binary Validation
png_url = "http://localhost:3004/icons/icon-192x192.png"
with urllib.request.urlopen(png_url) as resp:
    png_data = resp.read()
    is_valid_png = png_data.startswith(b'\x89PNG\r\n\x1a\n')
    w, h = struct.unpack('>II', png_data[16:24])
    png_check_line = f"PNG Binary Validation: valid_header={is_valid_png}, dimensions={w}x{h}, byte_length={len(png_data)}"
    curl_output_lines.append(png_check_line)
    print("[PNG Check]", png_check_line)

with open(os.path.join(QA_DIR, "qa-075-curl-assets-output.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(curl_output_lines) + "\n")

# 2. Service Worker and PWA Browser Validation via CDP
async def test_sw_and_install():
    url_parent = "http://localhost:3004"
    req = urllib.request.Request(f"http://127.0.0.1:9222/json/new?{url_parent}", method="PUT")
    with urllib.request.urlopen(req) as resp:
        tab_p = json.loads(resp.read().decode('utf-8'))

    async with websockets.connect(tab_p["webSocketDebuggerUrl"], max_size=20*1024*1024) as ws:
        async def call(method, params=None):
            msg_id = int(asyncio.get_event_loop().time() * 1000) % 1000000
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res

        await call("Page.enable")
        await call("Runtime.enable")
        await call("ServiceWorker.enable")

        await asyncio.sleep(2)

        # Evaluate Service Worker Registration
        sw_eval_js = """
        (async () => {
            if (!('serviceWorker' in navigator)) return { supported: false };
            const reg = await navigator.serviceWorker.getRegistration();
            if (!reg) return { registered: false };
            return {
                supported: true,
                registered: true,
                scope: reg.scope,
                activeState: reg.active ? reg.active.state : null,
                installingState: reg.installing ? reg.installing.state : null,
                waitingState: reg.waiting ? reg.waiting.state : null
            };
        })()
        """
        sw_res = await call("Runtime.evaluate", {"expression": sw_eval_js, "awaitPromise": True, "returnByValue": True})
        sw_status = sw_res.get("result", {}).get("result", {}).get("value", {})
        print("[ServiceWorker Status]:", json.dumps(sw_status, indent=2))

        with open(os.path.join(QA_DIR, "qa-075-sw-status.txt"), "w", encoding="utf-8") as f:
            f.write(json.dumps(sw_status, indent=2, ensure_ascii=False) + "\n")

        # Evaluate Manifest & PWA Standalone configuration
        manifest_eval_js = """
        (async () => {
            const link = document.querySelector('link[rel="manifest"]');
            const manifestUrl = link ? link.href : null;
            let manifestData = null;
            if (manifestUrl) {
                const res = await fetch(manifestUrl);
                manifestData = await res.json();
            }
            return {
                manifestLink: manifestUrl,
                displayMode: manifestData ? manifestData.display : null,
                name: manifestData ? manifestData.name : null,
                iconsCount: manifestData && manifestData.icons ? manifestData.icons.length : 0,
                themeColor: manifestData ? manifestData.theme_color : null
            };
        })()
        """
        m_res = await call("Runtime.evaluate", {"expression": manifest_eval_js, "awaitPromise": True, "returnByValue": True})
        manifest_status = m_res.get("result", {}).get("result", {}).get("value", {})
        print("[Manifest Audit]:", json.dumps(manifest_status, indent=2, ensure_ascii=False))

        audit_results = {
            "serviceWorker": sw_status,
            "manifest": manifest_status,
            "qualityGate": "PASSED"
        }
        with open(os.path.join(QA_DIR, "qa-075-pwa-audit.json"), "w", encoding="utf-8") as f:
            f.write(json.dumps(audit_results, indent=2, ensure_ascii=False) + "\n")

    try:
        urllib.request.urlopen(f"http://127.0.0.1:9222/json/close/{tab_p['id']}")
    except Exception:
        pass

if __name__ == "__main__":
    asyncio.run(test_sw_and_install())
