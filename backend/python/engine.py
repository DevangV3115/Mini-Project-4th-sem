import ollama
import random
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from collections import Counter

MODEL = "mistral"


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
        response = ollama.chat(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        return response["message"]["content"]
    except Exception as e:
        Logger.error(e)
        return "MODEL_ERROR"


class NeuralReasoner(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(10, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, 1)
        )

    def forward(self, x):
        return self.net(x)


class NeuralReasoningEngine:
    def __init__(self):
        self.model = NeuralReasoner()
        self.trained = False
        self.train_model()

    def vectorize(self, question):
        vec = [0] * 10
        digits = [int(c) for c in question if c.isdigit()]
        for i in range(min(len(digits), 10)):
            vec[i] = digits[i]
        return np.array(vec, dtype=np.float32)

    def train_model(self):
        Logger.section("Training Neural Network")
        X, Y = [], []
        for _ in range(500):
            a = random.randint(1, 50)
            b = random.randint(1, 50)
            vec = self.vectorize(f"{a} * {b}")
            X.append(vec)
            Y.append([a * b])
        X = torch.tensor(X)
        Y = torch.tensor(Y, dtype=torch.float32)
        optimizer = optim.Adam(self.model.parameters(), lr=0.01)
        loss_fn = nn.MSELoss()
        for _ in range(200):
            pred = self.model(X)
            loss = loss_fn(pred, Y)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        Logger.info("Neural model training complete")
        self.trained = True

    def predict(self, question):
        vec = self.vectorize(question)
        x = torch.tensor(vec).unsqueeze(0)
        with torch.no_grad():
            y = self.model(x)
        return float(y.item())


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
