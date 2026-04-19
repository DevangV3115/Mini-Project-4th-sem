import os

from fastapi.testclient import TestClient

os.environ.setdefault("API_BEARER_TOKEN", "test-token")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")

from main import app  # noqa: E402


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_solve_rejects_invalid_payload():
    response = client.post("/solve", json={"question": "hi"})
    assert response.status_code == 422


def test_metrics_requires_auth():
    response = client.get("/metrics/summary")
    assert response.status_code == 401


def test_metrics_summary_with_role_and_token():
    response = client.get(
        "/metrics/summary",
        headers={
            "Authorization": "Bearer test-token",
            "x-role": "admin",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data


def test_metrics_log_with_role_and_token():
    response = client.post(
        "/metrics/log",
        headers={
            "Authorization": "Bearer test-token",
            "x-role": "admin",
        },
        json={
            "timestamp": "now",
            "user_id": "test-user",
            "session_id": "test-session",
            "model_name": "test-model",
            "latency_ms": 123.4,
            "accuracy_score": 0.75,
            "correction_iterations": 2,
            "confidence_score": 0.81,
            "is_failure": False,
            "failure_reason": None,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "logged"
    assert isinstance(data["metric_id"], int)


def test_rate_limit_status_requires_auth():
    response = client.get("/metrics/rate-limit-status")
    assert response.status_code == 401


def test_rate_limit_status_with_admin_auth():
    response = client.get(
        "/metrics/rate-limit-status",
        headers={
            "Authorization": "Bearer test-token",
            "x-role": "admin",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "configured_limits_per_min" in data
    assert "active_bucket_count" in data
