# Project Architecture & Data Flow

Detailed description of the system architecture, data flow, and component interactions in the Self-Correcting Reasoning Engine.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Netlify)                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐  │  │
│  │  │ Landing  │  │   Auth   │  │     Dashboard          │  │  │
│  │  │  Page    │  │  Pages   │  │  ┌────────┐ ┌───────┐  │  │  │
│  │  │          │  │  Login   │  │  │  Chat  │ │Reason │  │  │  │
│  │  │ Scroll   │  │  Signup  │  │  │  Area  │ │ Panel │  │  │  │
│  │  │ Anim.    │  │  Forgot  │  │  └────────┘ └───────┘  │  │  │
│  │  └──────────┘  └──────────┘  └────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          │ Firebase Auth      │ SSE Stream         │ Firestore
          ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│   Firebase   │    │  FastAPI Backend  │    │   Firebase   │
│     Auth     │    │   (Render)        │    │  Firestore   │
│              │    │                   │    │              │
│  Email/Pass  │    │  /health          │    │  Chat Hist.  │
│  Google      │    │  /solve (SSE)     │    │  User Data   │
│  GitHub      │    │  /feedback        │    │              │
└──────────────┘    └──────────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  OpenRouter  │
                    │  LLaMA-3.3  │
                    │    70B       │
                    └──────────────┘
```

---

## Reasoning Pipeline

The core self-correcting reasoning pipeline follows these stages:

### Stage 1: Neural Prediction
- A lightweight numeric estimator extracts digits from the query
- Produces a fast baseline estimate as a sanity-check anchor
- **Latency:** < 1ms

### Stage 2: Multi-Path Reasoning (3 Chains of Thought)
- Three independent reasoning paths are generated via the LLM
- Each path uses zero-shot chain-of-thought prompting
- Paths are generated sequentially to avoid API rate limits
- **Latency:** ~2-4s per path

### Stage 3: Consensus Voting
- All three reasoning paths are compared
- Final answers are extracted from each path
- Majority-vote selects the consensus answer
- The reasoning path matching the majority answer is selected
- **Latency:** < 10ms

### Stage 4: Iterative Self-Correction (2 iterations)
For each iteration:
1. **Critique:** The selected reasoning is sent to the LLM for critical evaluation
2. **Refinement:** Identified errors are corrected using the critique feedback
- **Latency:** ~2-3s per iteration

### Stage 5: Final Synthesis
- The corrected reasoning is merged with the neural estimate
- A final confidence score is computed based on cross-path agreement
- The synthesized answer is streamed to the frontend

---

## Data Flow: User Asks a Question

```
1. User types question in Dashboard
         │
2. Frontend sends POST /solve with question
         │
3. Backend validates input (Pydantic)
         │
4. SSE stream opens
         │
5. Engine runs pipeline:
    ├─→ Neural Prediction → emit step event
    ├─→ CoT #1 → emit step event
    ├─→ CoT #2 → emit step event
    ├─→ CoT #3 → emit step event
    ├─→ Consistency Check → emit step event
    ├─→ Critique #1 → emit step event
    ├─→ Self-Correction #1 → emit step event
    ├─→ Critique #2 → emit step event
    ├─→ Self-Correction #2 → emit step event
    └─→ Final Synthesis → emit answer event
         │
6. Frontend renders each step in real-time
         │
7. Final answer displayed in chat
         │
8. Chat saved to Firebase Firestore
```

---

## Authentication Flow

```
1. User visits /login or /signup
         │
2. AuthContext checks Firebase auth state
         │
3. User authenticates via:
    ├─→ Email + Password
    ├─→ Google OAuth popup
    └─→ GitHub OAuth popup
         │
4. Firebase returns user token
         │
5. AuthContext updates state
         │
6. Dashboard layout checks auth:
    ├─→ Authenticated → render dashboard
    └─→ Not authenticated → redirect to /login
```

---

## Frontend Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Landing page (public)
│   ├── globals.css         # Global styles + glassmorphism
│   ├── home/
│   │   ├── layout.tsx      # Dashboard guard (requires auth)
│   │   └── page.tsx        # Main chat + reasoning UI
│   ├── login/page.tsx      # Login page
│   ├── signup/page.tsx     # Registration page
│   └── forgot-password/    # Password reset
├── components/
│   ├── auth/               # Auth UI components
│   ├── dashboard/          # Dashboard sidebar, etc.
│   └── landing/            # Landing page sections
├── context/
│   └── AuthContext.tsx      # Firebase auth state management
└── lib/
    ├── firebase.ts          # Firebase app initialization
    └── chatStore.ts         # Firestore chat CRUD operations
```

---

## Backend Architecture

```
backend/python/
├── main.py                 # FastAPI app, endpoints, middleware
├── engine.py               # Self-correcting reasoning engine
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── tests/
    ├── test_engine.py      # Engine unit tests
    └── test_api.py         # API integration tests
```

### Key Classes

| Class | File | Responsibility |
|---|---|---|
| `SelfCorrectingEngine` | engine.py | Orchestrates the full reasoning pipeline |
| `ReasoningGenerator` | engine.py | Generates multiple CoT paths |
| `Critic` | engine.py | Evaluates reasoning for errors |
| `Refiner` | engine.py | Corrects reasoning based on critique |
| `SelfConsistency` | engine.py | Majority-vote answer selection |
| `NeuralReasoningEngine` | engine.py | Fast numeric baseline estimator |
| `RateLimiter` | main.py | In-memory sliding-window rate limiter |

---

## Technology Decisions

| Decision | Rationale |
|---|---|
| **SSE over WebSocket** | Simpler for one-directional streaming; SSE reconnects automatically |
| **OpenRouter over direct API** | Access to multiple models through single API key |
| **Firebase Auth** | Production-ready auth with minimal setup; supports OAuth providers |
| **Firestore** | Real-time capable, serverless, scales with Firebase Auth |
| **Tailwind CSS** | Rapid UI development with consistent design tokens |
| **In-memory rate limiter** | Simple, no external dependencies; sufficient for single-server deployment |
