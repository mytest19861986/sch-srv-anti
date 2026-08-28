import subprocess

node_path = r"C:\Program Files\WindowsApps\OpenAI.Codex_26.727.6591.0_x64__2p2nqsd0c76g0\app\resources\cua_node\bin\node.exe"

try:
    out = subprocess.check_output([node_path, "-v"], text=True)
    print("Node version:", out)
except Exception as e:
    print("Error executing node:", e)
