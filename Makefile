.PHONY: setup dev dev-backend dev-frontend test lint clean

setup:
	uv sync
	cd apps/frontend && npm install

dev:
	python scripts/dev/start_all.py

dev-backend:
	python scripts/dev/start_backend.py

dev-frontend:
	python scripts/dev/start_frontend.py

test:
	pytest apps/backend/tests

lint:
	cd apps/frontend && npm run lint

clean:
	python scripts/maintenance/cleanup.py
