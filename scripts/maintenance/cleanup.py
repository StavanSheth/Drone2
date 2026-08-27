import shutil
import glob
import os

def main():
    print("Cleaning temporary files and caches...")
    for p in glob.glob("**/__pycache__", recursive=True):
        shutil.rmtree(p, ignore_errors=True)
    print("Cleaned.")

if __name__ == "__main__":
    main()
