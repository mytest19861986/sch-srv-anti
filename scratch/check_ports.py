import socket

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', port))
            return True
        except OSError:
            return False

for p in [3000, 3001, 3002, 3010, 3011, 3012, 8080, 8000]:
    print(f"Port {p} available: {check_port(p)}")
