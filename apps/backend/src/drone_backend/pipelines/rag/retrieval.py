from langchain_chroma import Chroma
from pathlib import Path

def create_or_load_chroma(db_path: Path, docs, embeddings):
    if db_path.exists() and len(os.listdir(db_path)) > 0:
        return Chroma(persist_directory=str(db_path), embedding_function=embeddings)
    elif docs:
        return Chroma.from_documents(documents=docs, embedding=embeddings, persist_directory=str(db_path))
    return None
