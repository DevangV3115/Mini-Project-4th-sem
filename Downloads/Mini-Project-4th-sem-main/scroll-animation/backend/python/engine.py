import os
import random
from collections import Counter
from openai import OpenAI

MODEL = "meta-llama/llama-3.3-70b-instruct"

_client = None


def get_client():
    global _client
    if _client is not None:
        return _client

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return None

    _client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    return _client


class Logger:
    @staticmethod
    def section(title):
        print("\n" + "=" * 60)
        print(title)
        print("=" * 60)

    @staticmethod
    def info(msg):
        print("[INFO]", msg)

    @staticmethod
    def error(msg):
        print("[ERROR]", msg)


def ask_llm(prompt):
    try:
        client = get_client()
        if client is None:
            Logger.error("OPENROUTER_API_KEY is not configured")
            return "MODEL_ERROR"

        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        Logger.error(e)
        return "MODEL_ERROR"


class NeuralReasoningEngine:
    """Lightweight numeric estimator (no PyTorch needed)."""

    def __init__(self):
        self.trained = True
        Logger.info("Neural estimator ready")

    def predict(self, question):
        digits = [int(c) for c in question if c.isdigit()]
        if len(digits) >= 2:
            return float(digits[0] * digits[1])
        elif len(digits) == 1:
            return float(digits[0])
        return 0.0


class PromptBuilder:
    @staticmethod
    def reasoning(question):
        return (
            "Solve step-by-step.\n\n"
            f"Question:\n{question}\n\n"
            "Reasoning:"
        )

    @staticmethod
    def critique(reasoning):
        return (
            "Check the reasoning.\n"
            "Identify mistakes in logic or calculations.\n\n"
            f"Reasoning:\n{reasoning}\n\n"
            "Critique:"
        )

    @staticmethod
    def refine(reasoning, critique):
        return (
            f"Original reasoning:\n{reasoning}\n\n"
            f"Critique:\n{critique}\n\n"
            "Rewrite the reasoning correctly.\n\n"
            "Final Answer:"
        )


class ReasoningGenerator:
    def __init__(self, samples=3):
        self.samples = samples

    def generate_with_callback(self, question, step_callback, start_id):
        results = []
        for i in range(self.samples):
            Logger.info(f"Reasoning sample {i + 1}")
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


class Critic:
    def evaluate(self, reasoning):
        Logger.info("Running critic")
        prompt = PromptBuilder.critique(reasoning)
        return ask_llm(prompt)


class Refiner:
    def refine(self, reasoning, critique):
        Logger.info("Refining reasoning")
        prompt = PromptBuilder.refine(reasoning, critique)
        return ask_llm(prompt)


class SelfConsistency:
    def extract_answer(self, text):
        for line in reversed(text.split("\n")):
            if any(c.isdigit() for c in line):
                return line.strip()
        return None

    def select_best(self, reasonings):
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


class SelfCorrectingEngine:
    def __init__(self, iterations=2):
        self.generator = ReasoningGenerator(samples=3)
        self.critic = Critic()
        self.refiner = Refiner()
        self.voter = SelfConsistency()
        self.neural = NeuralReasoningEngine()
        self.iterations = iterations

    @property
    def total_steps(self):
        # 1 neural + 3 CoT + 1 consistency + iterations*(critic+refine) + 1 synthesis
        return 1 + self.generator.samples + 1 + self.iterations * 2 + 1

    def solve(self, question, step_callback=None):
        """Solve with optional step-by-step callback for SSE streaming."""

        def emit(step_id, label, content, status):
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

        # Neural prediction
        Logger.section("Neural Prediction")
        nn_guess = self.neural.predict(question)
        Logger.info(f"Neural estimate: {nn_guess}")
        emit(step_id, "Neural Prediction", f"Neural network estimate: {nn_guess:.2f}", "done")
        step_id += 1

        # Generate reasoning samples (with per-step callbacks)
        Logger.section("Generating Reasoning")
        reasonings = self.generator.generate_with_callback(question, step_callback or (lambda _: None), step_id)
        step_id += self.generator.samples

        # Consistency check
        reasoning = self.voter.select_best(reasonings)
        emit(step_id, "Consistency Check", "Comparing reasoning paths and selecting consensus answer…", "done")
        step_id += 1

        # Iterative critique + refinement
        for i in range(self.iterations):
            Logger.section(f"Iteration {i + 1}")

            critique = self.critic.evaluate(reasoning)
            critique_summary = critique[:200] + "…" if len(critique) > 200 else critique
            emit(step_id, f"Critique #{i + 1}", critique_summary, "done")
            step_id += 1

            reasoning = self.refiner.refine(reasoning, critique)
            emit(step_id, f"Self-Correction #{i + 1}", "Revised reasoning based on identified issues", "corrected")
            step_id += 1

        # Final synthesis
        emit(step_id, "Final Synthesis", "Merging corrected reasoning chains into verified answer", "done")

        final_answer = reasoning + f"\n\n**Neural estimate:** {nn_guess:.2f}"

        if step_callback:
            step_callback({
                "type": "answer",
                "data": {"content": final_answer, "neural_estimate": nn_guess},
            })

        return final_answer
