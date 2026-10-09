# Disaster Drone — Run Guide

Complete step-by-step instructions to run the backend API server and frontend GUI from CMD.

---

## Prerequisites

Make sure the following are installed before proceeding:

| Tool | Purpose | Install |
|------|---------|---------|
| Python >= 3.10 | Backend runtime | https://python.org |
| `uv` | Python package manager | `pip install uv` |
| Node.js >= 18 | Frontend runtime | https://nodejs.org |
| npm | Frontend package manager | Comes with Node.js |
| Ollama (optional) | Local RAG chatbot | https://ollama.com |

---

## Step 1 — Open CMD and Navigate to Project Root

```cmd
cd c:\Projects\Drone\disasterV2
```

---

## Step 2 — Start the Backend (FastAPI)

### Direct Python Command (Default port 8000):

```cmd
uv run python -m uvicorn drone_backend.main:app --host 0.0.0.0 --port 8000 --reload
```

*(Alternatively, you can run `python scripts/dev/start_backend.py`)*

---

## Step 3 — Start the Frontend GUI (Next.js)

Open a **second CMD window** and run:

```cmd
cd c:\Projects\Drone\disasterV2\apps\frontend
npm run dev
```

*(Alternatively, from the project root you can run `python scripts/dev/start_frontend.py`)*

The dashboard will be available at: **http://localhost:3000**

---

## Step 4 — (Optional) Start Ollama for RAG Chatbot

Open a **third CMD window** and run:

```cmd
ollama run llama3.2:1b
```

---

## Default Ports Summary

| Service | Default URL |
|---------|-------------|
| Backend API | http://localhost:8000 |
| Frontend GUI | http://localhost:3000 |
| Ollama LLM | http://localhost:11434 |

---

## Troubleshooting & Recent Fixes

### CNN Plant Disease Model (Keras Compatibility)

The project includes a two-stage computer vision pipeline (YOLOv8 + CNN). Previously, the `CNN_plant_diseases_detection.h5` model experienced load failures during FastAPI startup because:
1. The Keras 3 model was saved with `DTypePolicy` and `batch_shape` configurations.
2. The `sentence_transformers` library used by the RAG system forces TensorFlow into `tf_keras` (legacy Keras 2) mode globally.
3. Keras 2 crashes when trying to deserialize Keras 3 exclusive configurations.

**Fix Applied:**
The H5 model file has been successfully patched using an `h5py` script to rewrite its internal JSON config.
- `batch_shape` was renamed to `batch_input_shape`.
- Complex `DTypePolicy` dictionaries were flattened to standard string types (e.g., `'float32'`).

The model is now **100% backward compatible with Keras 2** and loads natively without requiring any `custom_objects` hacks in the backend `agricnn.py` pipeline. If you replace the model file in the future, ensure it is exported properly for Keras 2 compatibility if `transformers` is active.
