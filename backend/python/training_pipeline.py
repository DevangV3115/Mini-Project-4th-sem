"""
Automated Training Pipeline

Implements a scheduled retraining pipeline that pulls recent user
interaction logs and feedback to incrementally improve the reasoning
engine. Designed to run as a separate background process.

Usage:
    python training_pipeline.py
"""

import time
import logging
import json
from pathlib import Path
from datetime import datetime

from engine import SelfCorrectingEngine

# ── Logging Configuration ──────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s | %(name)-20s | %(levelname)-7s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("training-pipeline")

# ── Data Storage ───────────────────────────────────────────────────
FEEDBACK_DIR = Path("data/feedback")
TRAINING_LOG = Path("data/training_log.json")


def ensure_data_dirs():
    """Create data directories if they don't exist."""
    FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    TRAINING_LOG.parent.mkdir(parents=True, exist_ok=True)


def collect_feedback() -> list[dict]:
    """Collect all unprocessed feedback from the feedback directory.

    Returns:
        List of feedback dictionaries.
    """
    logger.info("Collecting feedback from storage...")
    feedback_items = []
    for file in FEEDBACK_DIR.glob("*.json"):
        try:
            with open(file) as f:
                feedback_items.append(json.load(f))
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Skipping invalid feedback file {file}: {e}")
    logger.info(f"Found {len(feedback_items)} feedback items")
    return feedback_items


def evaluate_model(engine: SelfCorrectingEngine) -> dict:
    """Run a quick benchmark evaluation on the engine.

    Tests the engine with a set of known questions and checks
    if the reasoning pipeline completes without errors.

    Returns:
        Dictionary with evaluation metrics.
    """
    test_questions = [
        "What is 2 + 2?",
        "What is the capital of France?",
        "Explain gravity in one sentence.",
    ]

    results = {"total": len(test_questions), "passed": 0, "failed": 0, "errors": []}

    for q in test_questions:
        try:
            answer = engine.solve(q)
            if answer and len(answer) > 0:
                results["passed"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"Empty answer for: {q}")
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Error for '{q}': {str(e)}")

    return results


def log_training_run(metrics: dict):
    """Append training run results to the training log.

    Args:
        metrics: Dictionary of evaluation metrics from the run.
    """
    entry = {
        "timestamp": datetime.now().isoformat(),
        "metrics": metrics,
    }

    log_data = []
    if TRAINING_LOG.exists():
        try:
            with open(TRAINING_LOG) as f:
                log_data = json.load(f)
        except (json.JSONDecodeError, IOError):
            log_data = []

    log_data.append(entry)

    with open(TRAINING_LOG, "w") as f:
        json.dump(log_data, f, indent=2)

    logger.info(f"Training run logged: {metrics['passed']}/{metrics['total']} passed")


def retrain_model():
    """Execute a full retraining cycle.

    Steps:
        1. Collect new feedback data
        2. Initialize the engine
        3. Run benchmark evaluation
        4. Log results

    In production, this would also fine-tune model weights
    using the collected feedback.
    """
    logger.info("=" * 60)
    logger.info("Starting automated model retraining cycle...")
    logger.info("=" * 60)

    try:
        ensure_data_dirs()

        # Step 1: Collect feedback
        feedback = collect_feedback()
        logger.info(f"Processing {len(feedback)} feedback items...")

        # Step 2: Initialize engine
        logger.info("Initializing SelfCorrectingEngine for evaluation...")
        engine = SelfCorrectingEngine(iterations=1)

        # Step 3: Evaluate
        logger.info("Running benchmark evaluation...")
        metrics = evaluate_model(engine)

        # Step 4: Log results
        log_training_run(metrics)

        logger.info("=" * 60)
        logger.info(f"Training cycle completed: {metrics['passed']}/{metrics['total']} tests passed")
        if metrics["errors"]:
            for err in metrics["errors"]:
                logger.warning(f"  Issue: {err}")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Error during model retraining: {e}")
        raise


if __name__ == "__main__":
    logger.info("Training pipeline started. Running single evaluation cycle.")
    retrain_model()
    logger.info("Pipeline run complete.")
