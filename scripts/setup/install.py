import subprocess

def main():
    print("[1/2] Syncing Python dependencies via uv...")
    subprocess.run(["uv", "sync"])
    print("[2/2] Installing frontend dependencies...")
    subprocess.run(["npm", "install"], cwd="apps/frontend", shell=True)
    print("Setup completed successfully.")

if __name__ == "__main__":
    main()
