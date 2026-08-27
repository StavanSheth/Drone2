import os
import shutil
from typing import Dict, Any, List
from drone_backend.config.settings import get_settings
from drone_backend.infrastructure.llm.ollama import check_ollama_alive
from drone_backend.infrastructure.llm.client import get_ollama_llm
from .embeddings import get_embedding_model
from .ingestion import load_documents_from_dir, split_documents
from .generation import build_qa_chain
from langchain_chroma import Chroma

class RAGPipeline:
    def __init__(self):
        self.settings = get_settings()
        self.embedding_model = None
        self.vectorstore = None
        self.retriever = None
        self.llm = None
        self.qa_chain = None

    def initialize(self):
        print("[RAG] Initializing pipeline...")
        if not check_ollama_alive(self.settings.OLLAMA_BASE_URL):
            print("[RAG] Ollama is offline at localhost:11434.")
            return False

        try:
            self.embedding_model = get_embedding_model(self.settings.EMBEDDING_MODEL)
            if self.embedding_model is None:
                return False

            if self.settings.CHROMA_DIR.exists() and len(os.listdir(self.settings.CHROMA_DIR)) > 0:
                self.vectorstore = Chroma(
                    persist_directory=str(self.settings.CHROMA_DIR),
                    embedding_function=self.embedding_model
                )
            else:
                docs = load_documents_from_dir(self.settings.DOCUMENTS_DIR)
                if docs:
                    splits = split_documents(docs)
                    self.vectorstore = Chroma.from_documents(
                        documents=splits,
                        embedding=self.embedding_model,
                        persist_directory=str(self.settings.CHROMA_DIR)
                    )
            
            if self.vectorstore:
                self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 2})
                self.llm = get_ollama_llm(self.settings.OLLAMA_MODEL, self.settings.OLLAMA_BASE_URL)
                self.qa_chain = build_qa_chain(self.llm, self.retriever)
                print("[RAG] Pipeline ready.")
                return True
        except Exception as e:
            print(f"[RAG] Initialization error: {e}")
        return False

    def query(self, message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        if not self.qa_chain:
            self.initialize()
            
        if not self.qa_chain:
            return {
                "answer": "Ollama RAG is currently offline or uninitialized. Please start Ollama (`ollama run llama3.2:1b`) and upload documents.",
                "sources": []
            }
            
        try:
            res = self.qa_chain.invoke({"query": message})
            sources = [doc.metadata.get("source", "unknown") for doc in res.get("source_documents", [])]
            return {
                "answer": res.get("result", ""),
                "sources": list(set(sources))
            }
        except Exception as e:
            return {
                "answer": f"Error answering query: {str(e)}",
                "sources": []
            }

    def reload(self):
        self.embedding_model = None
        self.vectorstore = None
        self.qa_chain = None
        self.initialize()

_rag_pipe = None

def get_rag_pipeline() -> RAGPipeline:
    global _rag_pipe
    if _rag_pipe is None:
        _rag_pipe = RAGPipeline()
    return _rag_pipe
