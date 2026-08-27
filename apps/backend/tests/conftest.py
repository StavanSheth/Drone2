import pytest
from fastapi.testclient import TestClient
from drone_backend.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
