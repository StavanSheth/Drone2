from langchain_huggingface import HuggingFaceEmbeddings

_embeddings = None

def get_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
    global _embeddings
    if _embeddings is None:
        try:
            _embeddings = HuggingFaceEmbeddings(model_name=model_name)
        except Exception as e:
            print(f"[RAG] Failed to load embeddings: {e}")
            _embeddings = None
    return _embeddings
