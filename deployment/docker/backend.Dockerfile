FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml README.md ./
RUN pip install uv && uv pip install --system -e .
COPY apps/backend /app/apps/backend
COPY ml/models /app/ml/models
COPY data /app/data
EXPOSE 8000
CMD ["uvicorn", "drone_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
