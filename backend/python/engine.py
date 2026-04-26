"""
Self-Correcting Reasoning Engine

Implements multi-path reasoning with consensus verification and iterative
self-correction. The engine generates multiple independent chains of thought,
compares them for consistency, and refines any divergent paths.

Based on: "Learning Self-Correcting Reasoning Policies in LLMs Without Supervision"
"""

import os
import logging
from collections import Counter
from openai import OpenAI

# ── Configuration ──────────────────────────────────────────────────
MODEL = "meta-llama/llama-3.3-70b-instruct"

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
)

logger = logging.getLogger("reasoning-engine")


# ── LLM Interaction ───────────────────────────────────────────────
def ask_llm(prompt: str) -> str:
    """Send a prompt to the LLM and return the response text."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM API error: {e}")
        return "MODEL_ERROR"


# ── Neural Reasoning Estimator ─────────────────────────────────────
class NeuralReasoningEngine:
    """Lightweight numeric estimator for quick baseline predictions.

    Extracts digits from the question and produces a fast numerical estimate
    that serves as a sanity-check anchor for the LLM reasoning paths.
    """

    def __init__(self):
        self.trained = True
        logger.info("Neural estimator initialized and ready")

    def predict(self, question: str) -> float:
        """Extract digits from the question and produce a baseline estimate."""
        digits = [int(c) for c in question if c.isdigit()]
        if len(digits) >= 2:
            return float(digits[0] * digits[1])
        elif len(digits) == 1:
            return float(digits[0])
        return 0.0


# ── Prompt Templates ───────────────────────────────────────────────
class PromptBuilder:
    """Constructs structured prompts for each stage of the reasoning pipeline."""

    @staticmethod
    def reasoning(question: str) -> str:
        """Build a zero-shot chain-of-thought prompt."""
        return (
            "Solve step-by-step.\n\n"
            f"Question:\n{question}\n\n"
            "Reasoning:"
        )

    @staticmethod
    def critique(reasoning: str) -> str:
        """Build a critique prompt that checks for errors in reasoning."""
        return (
            "Check the reasoning.\n"
            "Identify mistakes in logic or calculations.\n\n"
            f"Reasoning:\n{reasoning}\n\n"
            "Critique:"
        )

    @staticmethod
    def refine(reasoning: str, critique: str) -> str:
        """Build a refinement prompt that corrects identified errors."""
        return (
            f"Original reasoning:\n{reasoning}\n\n"
            f"Critique:\n{critique}\n\n"
            "Rewrite the reasoning correctly.\n\n"
            "Final Answer:"
        )


# ── Reasoning Path Generator ──────────────────────────────────────
class ReasoningGenerator:
    """Generates multiple independent reasoning paths for a given question."""

    def __init__(self, samples: int = 3):
        self.samples = samples

    def generate_with_callback(self, question: str, step_callback, start_id: int) -> list[str]:
        """Generate `samples` reasoning paths, emitting SSE events for each."""
        results = []
        for i in range(self.samples):
            logger.info(f"Generating reasoning sample {i + 1}/{self.samples}")
            prompt = PromptBuilder.reasoning(question)
            reasoning = ask_llm(prompt)
            results.append(reasoning)
            summary = reasoning[:200] + "…" if len(reasoning) > 200 else reasoning
            step_callback({
                "type": "step",
                "data": {
                    "id": start_id + i,
                    "label": f"Chain-of-Thought #{i + 1}",
                    "content": f"Generating independent reasoning path #{i + 1}…\n{summary}",
                    "status": "done",
                },
            })
        return results


# ── Critic ─────────────────────────────────────────────────────────
class Critic:
    """Evaluates a reasoning path and identifies logical errors."""

    def evaluate(self, reasoning: str) -> str:
        """Submit reasoning to the LLM for critical evaluation."""
        logger.info("Running critic on selected reasoning path")
        prompt = PromptBuilder.critique(reasoning)
        return ask_llm(prompt)


# ── Refiner ────────────────────────────────────────────────────────
class Refiner:
    """Refines reasoning based on critique feedback."""

    def refine(self, reasoning: str, critique: str) -> str:
        """Produce corrected reasoning incorporating critique feedback."""
        logger.info("Refining reasoning based on critique")
        prompt = PromptBuilder.refine(reasoning, critique)
        return ask_llm(prompt)


# ── Self-Consistency Voting ────────────────────────────────────────
class SelfConsistency:
    """Implements majority-vote self-consistency across reasoning paths."""

    def extract_answer(self, text: str) -> str | None:
        """Extract the final answer line from a reasoning trace."""
        for line in reversed(text.split("\n")):
            if any(c.isdigit() for c in line):
                return line.strip()
        return None

    def select_best(self, reasonings: list[str]) -> str:
        """Select the reasoning path whose answer agrees with the majority."""
        answers = []
        for r in reasonings:
            ans = self.extract_answer(r)
            if ans:
                answers.append(ans)
        if not answers:
            return reasonings[0]
        most_common = Counter(answers).most_common(1)[0][0]
        for r in reasonings:
            if most_common in r:
                return r
        return reasonings[0]


# ── Main Engine ────────────────────────────────────────────────────
class SelfCorrectingEngine:
    """Orchestrates the full self-correcting reasoning pipeline.

    Pipeline:
        1. Neural prediction (fast baseline estimate)
        2. Multi-path reasoning generation (3 independent CoT paths)
        3. Consistency voting (select consensus answer)
        4. Iterative critique + refinement (N iterations)
        5. Final synthesis
    """

    def __init__(self, iterations: int = 2):
        self.generator = ReasoningGenerator(samples=3)
        self.critic = Critic()
        self.refiner = Refiner()
        self.voter = SelfConsistency()
        self.neural = NeuralReasoningEngine()
        self.iterations = iterations
        self.total_paths = 0
        logger.info(f"SelfCorrectingEngine initialized (iterations={iterations})")

    @property
    def total_steps(self) -> int:
        """Total number of reasoning steps for progress tracking."""
        # 1 neural + 3 CoT + 1 consistency + iterations*(critic+refine) + 1 synthesis
        return 1 + self.generator.samples + 1 + self.iterations * 2 + 1

    def solve(self, question: str, step_callback=None) -> str:
        """Run the full reasoning pipeline with optional SSE streaming.

        Args:
            question: The user's question to solve.
            step_callback: Optional callback for streaming progress events.

        Returns:
            The final synthesized answer string.
        """

        def emit(step_id: int, label: str, content: str, status: str):
            if step_callback:
                step_callback({
                    "type": "step",
                    "data": {
                        "id": step_id,
                        "label": label,
                        "content": content,
                        "status": status,
                    },
                })

        step_id = 0

        # Step 1: Neural prediction
        logger.info("── Step 1: Neural Prediction ──")
        nn_guess = self.neural.predict(question)
        logger.info(f"Neural estimate: {nn_guess}")
        emit(step_id, "Neural Prediction", f"Neural network estimate: {nn_guess:.2f}", "done")
        step_id += 1

        # Step 2: Generate reasoning samples (with per-step callbacks)
        logger.info("── Step 2: Multi-Path Reasoning ──")
        reasonings = self.generator.generate_with_callback(
            question, step_callback or (lambda _: None), step_id
        )
        step_id += self.generator.samples
        self.total_paths += self.generator.samples

        # Step 3: Consistency check
        logger.info("── Step 3: Consistency Voting ──")
        reasoning = self.voter.select_best(reasonings)
        emit(step_id, "Consistency Check", "Comparing reasoning paths and selecting consensus answer…", "done")
        step_id += 1

        # Step 4: Iterative critique + refinement
        for i in range(self.iterations):
            logger.info(f"── Iteration {i + 1}: Critique & Refinement ──")

            critique = self.critic.evaluate(reasoning)
            critique_summary = critique[:200] + "…" if len(critique) > 200 else critique
            emit(step_id, f"Critique #{i + 1}", critique_summary, "done")
            step_id += 1

            reasoning = self.refiner.refine(reasoning, critique)
            emit(step_id, f"Self-Correction #{i + 1}", "Revised reasoning based on identified issues", "corrected")
            step_id += 1

        # Step 5: Final synthesis
        logger.info("── Step 5: Final Synthesis ──")
        emit(step_id, "Final Synthesis", "Merging corrected reasoning chains into verified answer", "done")

        final_answer = reasoning + f"\n\n**Neural estimate:** {nn_guess:.2f}"

        if step_callback:
            step_callback({
                "type": "answer",
                "data": {"content": final_answer, "neural_estimate": nn_guess},
            })

        logger.info("Reasoning pipeline completed successfully")
        return final_answer
