from langchain_chroma import Chroma
from pathlib import Path

def get_chroma_store(persist_directory: Path, embedding_model):
    return Chroma(
        persist_directory=str(persist_directory),
        embedding_function=embedding_model
    )
