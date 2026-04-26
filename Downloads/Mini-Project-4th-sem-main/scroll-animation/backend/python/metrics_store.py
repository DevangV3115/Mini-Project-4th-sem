import sqlite3
from pathlib import Path
from typing import Any


class MetricsStore:
    def __init__(self, db_path: str = "metrics.db"):
        db_file = Path(db_path)
        db_file.parent.mkdir(parents=True, exist_ok=True)
        self.db_path = str(db_file)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reasoning_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    user_id TEXT,
                    session_id TEXT,
                    model_name TEXT,
                    latency_ms REAL NOT NULL,
                    accuracy_score REAL,
                    correction_iterations INTEGER NOT NULL,
                    confidence_score REAL,
                    is_failure INTEGER NOT NULL,
                    failure_reason TEXT
                )
                """
            )

    def log_metric(self, payload: dict[str, Any]) -> int:
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO reasoning_metrics (
                    timestamp,
                    user_id,
                    session_id,
                    model_name,
                    latency_ms,
                    accuracy_score,
                    correction_iterations,
                    confidence_score,
                    is_failure,
                    failure_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload["timestamp"],
                    payload.get("user_id"),
                    payload.get("session_id"),
                    payload.get("model_name"),
                    payload["latency_ms"],
                    payload.get("accuracy_score"),
                    payload["correction_iterations"],
                    payload.get("confidence_score"),
                    1 if payload["is_failure"] else 0,
                    payload.get("failure_reason"),
                ),
            )
            return int(cursor.lastrowid)

    def summary(self) -> dict[str, Any]:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT
                    COUNT(*) AS total_requests,
                    AVG(latency_ms) AS avg_latency_ms,
                    AVG(accuracy_score) AS avg_accuracy_score,
                    AVG(correction_iterations) AS avg_correction_iterations,
                    AVG(confidence_score) AS avg_confidence_score,
                    SUM(is_failure) AS total_failures
                FROM reasoning_metrics
                """
            ).fetchone()

            total_requests = int(row["total_requests"] or 0)
            total_failures = int(row["total_failures"] or 0)
            failure_rate = (total_failures / total_requests) if total_requests else 0.0

            return {
                "total_requests": total_requests,
                "avg_latency_ms": round(float(row["avg_latency_ms"] or 0.0), 2),
                "avg_accuracy_score": round(float(row["avg_accuracy_score"] or 0.0), 4),
                "avg_correction_iterations": round(float(row["avg_correction_iterations"] or 0.0), 2),
                "avg_confidence_score": round(float(row["avg_confidence_score"] or 0.0), 4),
                "total_failures": total_failures,
                "failure_rate": round(failure_rate, 4),
            }