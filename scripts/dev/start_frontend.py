import subprocess
import sys
import os

def main():
    os.chdir("apps/frontend")
    cmd = ["npm", "run", "dev"]
    subprocess.run(cmd, shell=True)

if __name__ == "__main__":
    main()
