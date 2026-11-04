# WayRivo AI 2.0 — Environment Variable Reference
**Event**: PayPal AI Hackathon 2026

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime mode: `development`, `test`, or `production`. Enables optimizations and secure cookie settings. |
| `PORT` | Yes | `8085` | TCP port where Express listens for incoming HTTP requests. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string with connection pooling (e.g., Supabase port `6543`). |
| `DIRECT_URL` | Optional | — | Direct PostgreSQL connection string without pooler for Prisma migrations (port `5432`). |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Comma-separated allowed origins for cross-origin browser requests (`withCredentials: true`). |
| `JWT_SECRET` | Yes | — | 64+ character random string for signing JSON Web Tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration duration (e.g. `1d`, `7d`). |
| `COOKIE_SECRET` | Yes | — | Secret string for signing HTTP-only cookies in `cookie-parser`. |
| `GEMINI_API_KEY` | Yes | — | Google AI Studio Gemini API key (`gemini-2.0-flash`). Kept strictly server-side. |
| `PAYPAL_CLIENT_ID` | Yes | — | PayPal Developer Sandbox App Client ID. Publicly exposed to client for rendering PayPal button. |
| `PAYPAL_CLIENT_SECRET` | Yes | — | PayPal Developer Sandbox App Secret. Kept strictly server-side; never exposed to frontend. |
| `PAYPAL_BASE_URL` | Yes | `https://api-m.sandbox.paypal.com` | Base URL for PayPal API. Use sandbox URL for testing; `https://api-m.paypal.com` in production. |
| `PAYPAL_WEBHOOK_ID` | No | — | Webhook ID registered in PayPal Developer Dashboard for signature verification. |
| `PAYPAL_CURRENCY` | Yes | `USD` | Target transaction currency for PayPal Sandbox checkout processing. |
| `PAYPAL_EXCHANGE_RATE` | Yes | `83.5` | Conversion exchange rate multiplier from catalog display currency (`INR`) to charge currency (`USD`). |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Public frontend origin used for PayPal return/cancel redirect URLs. |

---

## 2. Frontend Environment Variables (`frontend/.env`)

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8085/api/v1` | Base URL prefix for all Axios backend API requests. |

---

## 3. Security Principles

1. **Secret Isolation**: `PAYPAL_CLIENT_SECRET`, `GEMINI_API_KEY`, and `DATABASE_URL` are strictly referenced in backend code and never bundled in client distributions.
2. **Dynamic Configuration Endpoint**: The frontend calls `GET /api/v1/payments/config` to safely obtain the public `clientId`, transaction currency, and active exchange rate without receiving any secrets.
3. **Environment Separation**: Distinct sandbox keys and production credentials prevent testing pollution in live payment processors.

