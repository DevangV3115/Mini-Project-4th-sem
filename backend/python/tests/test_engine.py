"""
Unit tests for the Self-Correcting Reasoning Engine.

Tests cover the core engine components: NeuralReasoningEngine,
PromptBuilder, SelfConsistency, and the main SelfCorrectingEngine.
"""

import pytest
from unittest.mock import patch, MagicMock
from engine import (
    NeuralReasoningEngine,
    PromptBuilder,
    SelfConsistency,
    ReasoningGenerator,
    Critic,
    Refiner,
    SelfCorrectingEngine,
)


# ── NeuralReasoningEngine Tests ────────────────────────────────────
class TestNeuralReasoningEngine:
    """Tests for the lightweight neural estimator."""

    def setup_method(self):
        self.engine = NeuralReasoningEngine()

    def test_predict_two_digits(self):
        """Should multiply the first two digits found."""
        result = self.engine.predict("What is 3 times 4?")
        assert result == 12.0

    def test_predict_single_digit(self):
        """Should return the single digit as float."""
        result = self.engine.predict("What is 7?")
        assert result == 7.0

    def test_predict_no_digits(self):
        """Should return 0.0 when no digits are present."""
        result = self.engine.predict("What is the meaning of life?")
        assert result == 0.0

    def test_predict_many_digits(self):
        """Should only use the first two digits."""
        result = self.engine.predict("Calculate 2 + 3 + 5 + 7")
        assert result == 6.0  # 2 * 3

    def test_engine_is_trained(self):
        """Engine should report as trained upon initialization."""
        assert self.engine.trained is True


# ── PromptBuilder Tests ────────────────────────────────────────────
class TestPromptBuilder:
    """Tests for prompt template construction."""

    def test_reasoning_prompt(self):
        """Should include the question in the reasoning prompt."""
        prompt = PromptBuilder.reasoning("What is 2+2?")
        assert "What is 2+2?" in prompt
        assert "Solve step-by-step" in prompt
        assert "Reasoning:" in prompt

    def test_critique_prompt(self):
        """Should include reasoning text in the critique prompt."""
        prompt = PromptBuilder.critique("The answer is 4 because 2+2=4.")
        assert "The answer is 4" in prompt
        assert "Check the reasoning" in prompt
        assert "Critique:" in prompt

    def test_refine_prompt(self):
        """Should include both reasoning and critique in the refine prompt."""
        prompt = PromptBuilder.refine("2+2=5", "That's wrong, 2+2=4")
        assert "2+2=5" in prompt
        assert "That's wrong" in prompt
        assert "Final Answer:" in prompt


# ── SelfConsistency Tests ──────────────────────────────────────────
class TestSelfConsistency:
    """Tests for the majority-vote consistency checker."""

    def setup_method(self):
        self.voter = SelfConsistency()

    def test_extract_answer_with_digits(self):
        """Should extract the last line containing digits."""
        text = "Step 1: Calculate\nStep 2: Verify\nThe answer is 42"
        answer = self.voter.extract_answer(text)
        assert answer == "The answer is 42"

    def test_extract_answer_no_digits(self):
        """Should return None if no line has digits."""
        text = "No numbers here\nJust text"
        answer = self.voter.extract_answer(text)
        assert answer is None

    def test_select_best_with_consensus(self):
        """Should select reasoning matching the majority answer."""
        reasonings = [
            "Path A reasoning\nAnswer: 42",
            "Path B reasoning\nAnswer: 42",
            "Path C reasoning\nAnswer: 99",
        ]
        best = self.voter.select_best(reasonings)
        assert "42" in best

    def test_select_best_all_different(self):
        """Should return first reasoning when no consensus exists."""
        reasonings = [
            "Answer: 1",
            "Answer: 2",
            "Answer: 3",
        ]
        best = self.voter.select_best(reasonings)
        assert best == "Answer: 1"

    def test_select_best_no_answers(self):
        """Should return first reasoning when no extractable answers."""
        reasonings = [
            "No numbers here",
            "Also no numbers",
        ]
        best = self.voter.select_best(reasonings)
        assert best == "No numbers here"


# ── ReasoningGenerator Tests ──────────────────────────────────────
class TestReasoningGenerator:
    """Tests for the multi-path reasoning generator."""

    @patch("engine.ask_llm")
    def test_generates_correct_number_of_samples(self, mock_llm):
        """Should generate exactly `samples` reasoning paths."""
        mock_llm.return_value = "Step 1: Think\nAnswer: 42"
        gen = ReasoningGenerator(samples=3)
        callbacks = []
        results = gen.generate_with_callback("What is 6*7?", lambda e: callbacks.append(e), 0)
        assert len(results) == 3
        assert len(callbacks) == 3
        assert mock_llm.call_count == 3

    @patch("engine.ask_llm")
    def test_callback_emits_step_events(self, mock_llm):
        """Each generated path should emit a step event."""
        mock_llm.return_value = "reasoning text"
        gen = ReasoningGenerator(samples=2)
        events = []
        gen.generate_with_callback("test", lambda e: events.append(e), 5)
        assert events[0]["data"]["id"] == 5
        assert events[1]["data"]["id"] == 6
        assert all(e["type"] == "step" for e in events)


# ── SelfCorrectingEngine Tests ────────────────────────────────────
class TestSelfCorrectingEngine:
    """Tests for the orchestrator engine."""

    def test_total_steps_calculation(self):
        """Total steps should equal 1 + 3 + 1 + 2*iterations + 1."""
        engine = SelfCorrectingEngine(iterations=2)
        assert engine.total_steps == 10  # 1+3+1+4+1

    def test_total_steps_single_iteration(self):
        """Test step count with 1 iteration."""
        engine = SelfCorrectingEngine(iterations=1)
        assert engine.total_steps == 8  # 1+3+1+2+1

    @patch("engine.ask_llm")
    def test_solve_returns_answer(self, mock_llm):
        """Solve should return a non-empty answer string."""
        mock_llm.return_value = "The answer is 42"
        engine = SelfCorrectingEngine(iterations=1)
        result = engine.solve("What is 6*7?")
        assert result is not None
        assert len(result) > 0

    @patch("engine.ask_llm")
    def test_solve_emits_callbacks(self, mock_llm):
        """Solve should emit step callbacks when provided."""
        mock_llm.return_value = "Answer: 42"
        engine = SelfCorrectingEngine(iterations=1)
        events = []
        engine.solve("What is 6*7?", step_callback=lambda e: events.append(e))
        # Should have step events + final answer
        step_events = [e for e in events if e["type"] == "step"]
        answer_events = [e for e in events if e["type"] == "answer"]
        assert len(step_events) == engine.total_steps
        assert len(answer_events) == 1

    @patch("engine.ask_llm")
    def test_solve_includes_neural_estimate(self, mock_llm):
        """Final answer should include the neural estimate."""
        mock_llm.return_value = "42"
        engine = SelfCorrectingEngine(iterations=1)
        result = engine.solve("What is 6 times 7?")
        assert "Neural estimate" in result
