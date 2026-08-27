import requests

def check_ollama_alive(base_url: str = "http://localhost:11434") -> bool:
    try:
        res = requests.get(f"{base_url}/api/tags", timeout=2)
        return res.status_code == 200
    except Exception:
        return False
