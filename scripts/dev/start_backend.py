import subprocess
import sys

def main():
    cmd = ["uv", "run", "python", "-m", "uvicorn", "drone_backend.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    subprocess.run(cmd)

if __name__ == "__main__":
    main()
