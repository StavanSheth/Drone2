import glob
import os
from pathlib import Path
from typing import List, Any
from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def load_documents_from_dir(docs_path: Path) -> List[Any]:
    documents = []
    if not docs_path.exists():
        docs_path.mkdir(parents=True, exist_ok=True)
        return documents
        
    for file_path in glob.glob(f"{str(docs_path)}/*"):
        try:
            if file_path.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
            elif file_path.endswith(".txt"):
                loader = TextLoader(file_path, encoding="utf-8")
            elif file_path.endswith(".csv"):
                loader = CSVLoader(file_path)
            else:
                continue
            documents.extend(loader.load())
        except Exception as e:
            print(f"[RAG] Error loading {file_path}: {e}")
            continue
    return documents

def split_documents(docs: List[Any], chunk_size: int = 1000, chunk_overlap: int = 200):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_documents(docs)
