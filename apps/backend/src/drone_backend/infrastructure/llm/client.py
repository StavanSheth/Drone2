from langchain_ollama import OllamaLLM

def get_ollama_llm(model: str = "llama3.2:1b", base_url: str = "http://localhost:11434"):
    return OllamaLLM(model=model, base_url=base_url)
