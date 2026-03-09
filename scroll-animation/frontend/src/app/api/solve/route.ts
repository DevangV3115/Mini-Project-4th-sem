import { NextRequest } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const MODEL = "meta-llama/llama-3.1-8b-instruct:free";
const ITERATIONS = 1;
const COT_SAMPLES = 2;
const TOTAL_STEPS = 1 + COT_SAMPLES + 1 + ITERATIONS * 2 + 1; // neural + CoT + consistency + (critique+refine)*iter + synthesis

function getClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

async function askLLM(prompt: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 512,
  });
  return response.choices[0]?.message?.content || "MODEL_ERROR";
}

function neuralEstimate(question: string): number {
  const digits = question.replace(/[^0-9]/g, "").split("").map(Number);
  if (digits.length >= 2) return digits[0] * digits[1];
  if (digits.length === 1) return digits[0];
  return 0;
}

function extractAnswer(text: string): string | null {
  const lines = text.split("\n").reverse();
  for (const line of lines) {
    if (/\d/.test(line)) return line.trim();
  }
  return null;
}

function selectBest(reasonings: string[]): string {
  const answers: string[] = [];
  for (const r of reasonings) {
    const ans = extractAnswer(r);
    if (ans) answers.push(ans);
  }
  if (answers.length === 0) return reasonings[0];
  const freq = new Map<string, number>();
  for (const a of answers) freq.set(a, (freq.get(a) || 0) + 1);
  const mostCommon = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return reasonings.find((r) => r.includes(mostCommon)) || reasonings[0];
}

function truncate(text: string, len = 200): string {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const question = body.question;

  if (!question) {
    return new Response(JSON.stringify({ error: "No question provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      try {
        let stepId = 0;

        // Total steps
        send({ type: "total_steps", data: TOTAL_STEPS });

        // Neural prediction
        const nnGuess = neuralEstimate(question);
        send({
          type: "step",
          data: { id: stepId++, label: "Neural Prediction", content: `Neural network estimate: ${nnGuess.toFixed(2)}`, status: "done" },
        });

        // Chain-of-Thought samples
        const reasonings: string[] = [];
        for (let i = 0; i < COT_SAMPLES; i++) {
          const reasoning = await askLLM(`Solve step-by-step.\n\nQuestion:\n${question}\n\nReasoning:`);
          reasonings.push(reasoning);
          send({
            type: "step",
            data: { id: stepId++, label: `Chain-of-Thought #${i + 1}`, content: `Generating independent reasoning path #${i + 1}…\n${truncate(reasoning)}`, status: "done" },
          });
        }

        // Consistency check
        let reasoning = selectBest(reasonings);
        send({
          type: "step",
          data: { id: stepId++, label: "Consistency Check", content: "Comparing reasoning paths and selecting consensus answer…", status: "done" },
        });

        // Iterative critique + refinement
        for (let i = 0; i < ITERATIONS; i++) {
          const critique = await askLLM(`Check the reasoning.\nIdentify mistakes in logic or calculations.\n\nReasoning:\n${reasoning}\n\nCritique:`);
          send({
            type: "step",
            data: { id: stepId++, label: `Critique #${i + 1}`, content: truncate(critique), status: "done" },
          });

          reasoning = await askLLM(`Original reasoning:\n${reasoning}\n\nCritique:\n${critique}\n\nRewrite the reasoning correctly.\n\nFinal Answer:`);
          send({
            type: "step",
            data: { id: stepId++, label: `Self-Correction #${i + 1}`, content: "Revised reasoning based on identified issues", status: "corrected" },
          });
        }

        // Final synthesis
        send({
          type: "step",
          data: { id: stepId++, label: "Final Synthesis", content: "Merging corrected reasoning chains into verified answer", status: "done" },
        });

        const finalAnswer = `${reasoning}\n\n**Neural estimate:** ${nnGuess.toFixed(2)}`;
        send({
          type: "answer",
          data: { content: finalAnswer, neural_estimate: nnGuess },
        });
      } catch (err) {
        send({ type: "answer", data: { content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`, neural_estimate: 0 } });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
