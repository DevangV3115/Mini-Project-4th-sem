# Setup Guide

Complete instructions for setting up the Self-Correcting Reasoning Engine for local development.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | >= 18.x | Frontend runtime |
| **npm** | >= 9.x | Package manager |
| **Python** | >= 3.10 | Backend runtime |
| **pip** | >= 22.x | Python package manager |
| **Git** | >= 2.x | Version control |

---

## 1. Clone the Repository

```bash
git clone https://github.com/DevangV3115/Mini-Project-4th-sem.git
cd Mini-Project-4th-sem
```

---

## 2. Backend Setup

### 2.1 Create Virtual Environment

```bash
cd backend/python
python -m venv venv

# Activate (choose your OS)
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2.2 Install Dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:

```
OPENROUTER_API_KEY=sk-or-v1-your_key_here
```

> **How to get an API key:** Sign up at [openrouter.ai](https://openrouter.ai), navigate to API Keys, and create a new key. The free tier includes access to several models.

### 2.4 Start the Backend Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`. Verify with:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "ok", "engine_ready": true, "total_requests": 0, "avg_latency_ms": 0}
```

---

## 3. Frontend Setup

### 3.1 Install Dependencies

```bash
cd scroll-animation
npm install
```

### 3.2 Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=112713181112
NEXT_PUBLIC_FIREBASE_APP_ID=1:112713...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
NEXT_PUBLIC_PYTHON_BACKEND_URL=http://localhost:8000
```

> **Firebase Setup:** Create a project at [console.firebase.google.com](https://console.firebase.google.com), enable Authentication (Email/Password, Google, GitHub), and enable Cloud Firestore.

### 3.3 Start the Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 4. Running Tests

### Backend Tests

```bash
cd backend/python
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

### Frontend Tests

```bash
cd scroll-animation
npm test
```

---

## 5. Docker Setup (Alternative)

If you prefer Docker:

```bash
# From the project root
docker-compose up --build
```

This starts both backend (port 8000) and frontend (port 3000).

---

## 6. Deployment

### Frontend → Netlify

1. Connect your GitHub repository to Netlify
2. Set base directory to `scroll-animation`
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add all `NEXT_PUBLIC_*` environment variables in Netlify dashboard

### Backend → Render

1. Connect your GitHub repository to Render
2. Set root directory to `backend/python`
3. Build command: `pip install -r requirements.txt`
4. Start command: `python main.py`
5. Add `OPENROUTER_API_KEY` environment variable

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `MODULE_NOT_FOUND: openai` | Run `pip install -r requirements.txt` |
| Frontend shows "API unavailable" | Ensure backend is running on port 8000 |
| Firebase auth errors | Check `.env.local` has correct Firebase credentials |
| CORS errors in browser | Backend allows all origins by default in dev |
| `OPENROUTER_API_KEY` not set | Copy `.env.example` to `.env` and add your key |
