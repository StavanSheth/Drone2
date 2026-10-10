import subprocess
import time
import sys

def main():
    print("Starting StatWing Drone Backend & Frontend...")
    p1 = subprocess.Popen(["uv", "run", "uvicorn", "drone_backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])
    time.sleep(2)
    p2 = subprocess.Popen(["npm", "run", "dev"], cwd="apps/frontend", shell=True)
    
    try:
        p1.wait()
        p2.wait()
    except KeyboardInterrupt:
        p1.terminate()
        p2.terminate()

if __name__ == "__main__":
    main()
