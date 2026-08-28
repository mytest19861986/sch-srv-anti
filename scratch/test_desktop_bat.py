import subprocess

try:
    p = subprocess.Popen(
        [r"C:\Users\MYIT\Desktop\Run_ServiceYar.bat"],
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    # Read first lines of output
    stdout, stderr = p.communicate(timeout=4)
    print("STDOUT:\n", stdout)
    print("STDERR:\n", stderr)
except subprocess.TimeoutExpired:
    print("Batch launcher is running successfully in background!")
    p.kill()
except Exception as e:
    print("Error:", e)
