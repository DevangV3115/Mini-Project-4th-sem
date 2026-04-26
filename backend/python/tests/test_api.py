"""
Integration tests for the FastAPI backend endpoints.

Tests the /health, /solve, and /feedback endpoints using
the httpx async test client.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock, ANY
from fastapi.testclient import TestClient
import main


# Create a mock engine that will be reused
mock_engine = MagicMock()
mock_engine.total_steps = 8
mock_engine.total_paths = 0
mock_engine.solve = MagicMock(return_value="Answer: 42")

# Patch the engine in main module for all tests
@pytest.fixture(scope="module", autouse=True)
def mock_engine_fixture():
    """Patch SelfCorrectingEngine to use mock throughout all tests."""
    with patch.object(main, "SelfCorrectingEngine", return_value=mock_engine):
        # Also patch the engine variable in main module
        with patch.object(main, "engine", mock_engine):
            yield


# Import app after patching
from main import app

client = TestClient(app)


# ── Health Endpoint Tests ──────────────────────────────────────────
class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_returns_ok(self):
        """Health check should return 200 with status ok."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_includes_engine_status(self):
        """Health check should report engine readiness."""
        response = client.get("/health")
        data = response.json()
        assert "engine_ready" in data

    def test_health_includes_metrics(self):
        """Health check should include request metrics."""
        response = client.get("/health")
        data = response.json()
        assert "total_requests" in data
        assert "avg_latency_ms" in data

    def test_health_has_security_headers(self):
        """Response should include security headers."""
        response = client.get("/health")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"


# ── Feedback Endpoint Tests ───────────────────────────────────────
class TestFeedbackEndpoint:
    """Tests for the /feedback endpoint."""

    def test_feedback_valid_request(self):
        """Valid feedback should return success."""
        response = client.post("/feedback", json={
            "chat_id": "chat_123",
            "user_id": "user_456",
            "rating": 5,
            "comments": "Great reasoning!",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["chat_id"] == "chat_123"

    def test_feedback_minimum_fields(self):
        """Feedback with only required fields should work."""
        response = client.post("/feedback", json={
            "chat_id": "chat_123",
            "user_id": "user_456",
            "rating": 3,
            "comments": "",
        })
        assert response.status_code == 200

    def test_feedback_invalid_rating_too_high(self):
        """Rating above 5 should be rejected."""
        response = client.post("/feedback", json={
            "chat_id": "chat_123",
            "user_id": "user_456",
            "rating": 10,
            "comments": "",
        })
        assert response.status_code == 422

    def test_feedback_invalid_rating_too_low(self):
        """Rating below 1 should be rejected."""
        response = client.post("/feedback", json={
            "chat_id": "chat_123",
            "user_id": "user_456",
            "rating": 0,
            "comments": "",
        })
        assert response.status_code == 422

    def test_feedback_missing_required_fields(self):
        """Missing required fields should return 422."""
        response = client.post("/feedback", json={
            "rating": 5,
        })
        assert response.status_code == 422

    def test_feedback_with_step_id(self):
        """Feedback targeting a specific step should work."""
        response = client.post("/feedback", json={
            "chat_id": "chat_123",
            "user_id": "user_456",
            "rating": 4,
            "comments": "Step was unclear",
            "step_id": 3,
        })
        assert response.status_code == 200


# ── Solve Endpoint Tests ──────────────────────────────────────────
class TestSolveEndpoint:
    """Tests for the /solve endpoint."""

    def test_solve_missing_question(self):
        """Request with no question should return 422."""
        response = client.post("/solve", json={})
        assert response.status_code == 422

    def test_solve_empty_question(self):
        """Empty question should be rejected by validation."""
        response = client.post("/solve", json={"question": ""})
        assert response.status_code == 422

    def test_solve_question_too_short(self):
        """Question shorter than 3 chars should be rejected."""
        response = client.post("/solve", json={"question": "ab"})
        assert response.status_code == 422

    def test_solve_valid_request_returns_stream(self):
        """Valid request should return event-stream response."""
        mock_engine.solve = MagicMock(return_value="Answer: 42")
        response = client.post("/solve", json={"question": "What is 6*7?"})
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")


# ── Input Validation Tests ────────────────────────────────────────
class TestInputValidation:
    """Tests for request validation across endpoints."""

    def test_solve_rejects_invalid_json(self):
        """Non-JSON body should be rejected."""
        response = client.post(
            "/solve",
            content="not json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422

    def test_feedback_rejects_invalid_json(self):
        """Non-JSON body should be rejected on feedback."""
        response = client.post(
            "/feedback",
            content="not json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422
