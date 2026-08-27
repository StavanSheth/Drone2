# Drone Dashboard RAG Architecture Workflow

This document outlines the end-to-end workflow of the **Trinetra** application, designed to help you create an architecture diagram.

## High-Level Overview
The system is a **Hybrid Web Application** combining a real-time monitoring dashboard with a local, offline-capable RAG (Retrieval-Augmented Generation) AI assistant.

---

## 1. System Components

1.  **Frontend Client (Browser)**
    *   **Technology**: HTML5, Vanilla JavaScript, CSS3.
    *   **Features**: Real-time Telemetry Gauges, Three.js 3D Background, WebRTC Camera Feed, Chat Interface.
    *   **Communication**: HTTP (REST) to Backend.

2.  **API Gateway / Backend**
    *   **Technology**: Python FastAPI (`src/app/main.py`).
    *   **Role**: Serves the frontend, handles file uploads, and routes chat requests to the AI pipeline.

3.  **RAG AI Pipeline**
    *   **Orchestrator**: LangChain (`src/app/rag_pipeline.py`).
    *   **Vector Database**: ChromaDB (Local persistence in `data/chroma_db`).
    *   **Embedding Model**: `all-MiniLM-L6-v2` (HuggingFace, runs locally).
    *   **LLM Inference**: Ollama (Running `llama3.2:1b` model).

4.  **Data Sources**
    *   **Documents**: Local directory `data/documents/` containing PDFs, TXTs, and CSVs (e.g., *drone_manual.txt*, *flight_logs.csv*).

---

## 2. Detailed Workflows

### A. System Initialization (Startup)
1.  **Server Start**: User runs `uvicorn`.
2.  **Lifespan Event**: FastAPI triggers `init_rag_pipeline()`.
3.  **Ollama Check**: System pings `localhost:11434` to ensure the Inference Server is active.
4.  **Embedding Loading**: Loads `all-MiniLM-L6-v2` model into memory.
5.  **Vector DB Connection**: Connects to `data/chroma_db`.
    *   *If DB is empty*: Scans `data/documents/`, ingests files, chunks text, creates embeddings, and builds the index.
    *   *If DB exists*: Loads the existing persistent index.
6.  **Chain & LLM Setup**: Initializes the `RetrievalQA` chain with the `llama3.2:1b` model.

### B. User Chat Flow (RAG Process)
This is the core loop for the AI Assistant:

1.  **User Input**: User types a question (e.g., *"How do I calibrate the compass?"*) in the dashboard chat.
2.  **API Request**: Frontend sends `POST /chat` with the message payload to FastAPI.
3.  **Retrieval Step**:
    *   The question is converted into a vector using the **Embedding Model**.
    *   **ChromaDB** is queried to find the top 4 most similar document chunks (context).
4.  **Augmentation Step**:
    *   Retrieved text chunks are combined with the original question into a prompt.
    *   *Prompt Format*: "Use the following pieces of context to answer the question at the end..."
5.  **Generation Step**:
    *   The prompt is sent to **Ollama** (`llama3.2:1b`).
    *   Ollama generates a natural language response based ONLY on the provided context.
6.  **Response**:
    *   The answer + source metadata is returned to FastAPI.
    *   FastAPI sends JSON response to Frontend.
    *   Frontend displays the answer.

### C. Document Upload Flow
1.  **Upload**: User uploads a new file via the API/Interface.
2.  **Storage**: File is saved to `data/documents/`.
3.  **Pipeline Reload**:
    *   The function `reload_pipeline()` is triggered.
    *   The Vector DB is often cleared or updated to include the new document.
    *   The pipeline re-initializes to serve fresh data.

---

## 3. Data Flow Diagram Summary

[User / Browser] 
      |
      | (HTTP Request)
      v
[FastAPI Backend]
      |
      | (Query)
      v
[RAG Pipeline Controller]
      |
      +---> [1. Embed Query] ---> [HuggingFace Model]
      |
      +---> [2. Search Index] --> [ChromaDB Vector Store] <---(Ingest)--- [Documents Folder]
      |          |
      |          +---> (Returns Document Chunks)
      |
      +---> [3. Generate Answer]
                 |
                 v
            [Ollama / Llama 3.2:1b]
                 |
                 v
            (Final Answer)
