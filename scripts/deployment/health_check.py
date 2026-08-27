import requests

def main():
    try:
        res = requests.get("http://localhost:8000/health")
        print("Backend Status:", res.json())
    except Exception as e:
        print("Failed to reach backend:", e)

if __name__ == "__main__":
    main()
