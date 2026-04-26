# API Documentation

## Base URL

- **Local Development**: `http://localhost:8000`
- **Production (Render)**: `https://check-to-work-bbzs.onrender.com`

---

## Endpoints

### `GET /health`

Health check endpoint that returns system status and metrics.

**Response:**

```json
{
  "status": "ok",
  "engine_ready": true,
  "total_requests": 42,
  "avg_latency_ms": 3200.5
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | Server health status |
| `engine_ready` | boolean | Whether the reasoning engine is initialized |
| `total_requests` | integer | Total number of solve requests processed |
| `avg_latency_ms` | float | Average response time in milliseconds |

---

### `POST /solve`

Runs the self-correcting reasoning pipeline and streams results via Server-Sent Events (SSE).

**Request Body:**

```json
{
  "question": "What is the capital of France?"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `question` | string | Yes | 3–2000 characters |

**Response:** `text/event-stream`

The response streams several event types:

#### Event: `total_steps`
Sent first to indicate how many reasoning steps to expect.
```
data: {"type": "total_steps", "data": 10}
```

#### Event: `step`
Sent for each reasoning step as it completes.
```
data: {"type": "step", "data": {"id": 0, "label": "Neural Prediction", "content": "Neural network estimate: 42.00", "status": "done"}}
```

| Status | Meaning |
|---|---|
| `pending` | Step not yet started |
| `running` | Step currently executing |
| `done` | Step completed successfully |
| `corrected` | Step was revised after self-correction |

#### Event: `answer`
Final synthesized answer after all reasoning is complete.
```
data: {"type": "answer", "data": {"content": "The answer is...", "neural_estimate": 42.0}}
```

**Error Response:**
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "msg": "String should have at least 3 characters",
      "input": "ab"
    }
  ]
}
```

---

### `POST /feedback`

Submit user feedback on reasoning quality.

**Request Body:**

```json
{
  "chat_id": "abc123",
  "user_id": "user_456",
  "rating": 4,
  "comments": "Clear reasoning but slow",
  "step_id": 3
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `chat_id` | string | Yes | Chat session ID |
| `user_id` | string | Yes | Firebase user UID |
| `rating` | integer | Yes | 1–5 |
| `comments` | string | No | Max 1000 chars |
| `step_id` | integer | No | Specific reasoning step to rate |

**Response:**

```json
{
  "status": "success",
  "message": "Feedback recorded. Thank you!",
  "chat_id": "abc123"
}
```

---

## Rate Limiting

All endpoints are rate-limited to **20 requests per minute per IP address**.

Exceeding the limit returns:
```json
{
  "detail": "Too many requests. Please try again later."
}
```
HTTP Status: `429 Too Many Requests`

---

## Security Headers

All responses include the following security headers:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## CORS

The API allows requests from all origins in development. In production, consider restricting to:
- `https://*.netlify.app`
- `https://*.onrender.com`

---

## Error Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `422` | Validation error (bad input) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
