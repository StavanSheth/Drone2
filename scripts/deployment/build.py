import subprocess

def main():
    subprocess.run(["npm", "run", "build"], cwd="apps/frontend", shell=True)

if __name__ == "__main__":
    main()
