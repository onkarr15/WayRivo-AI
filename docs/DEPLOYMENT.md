# WayRivo AI 2.0 — Production Deployment Guide

## 1. Production Architecture Overview

WayRivo AI 2.0 is designed for a cloud-native, decoupled production architecture across modern PaaS platforms:

```
                            [Custom Domain / Users]
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │   Vercel Edge Network │             │ Render Web Service    │
        │   (Frontend React 19) │             │ (Express Node.js API) │
        └───────────┬───────────┘             └───────────┬───────────┘
                    │                                     │
                    │ API Calls (CORS protected)           │ Prisma ORM
                    └─────────────────────────────────────┼──────────────────┐
                                                          ▼                  ▼
                                                ┌───────────────────┐ ┌───────────────┐
                                                │ Supabase Postgres │ │ PayPal Orders │
                                                │ (Pooled DB)       │ │ & Gemini API  │
                                                └───────────────────┘ └───────────────┘
```

| Component | Platform | Configuration Reference |
|---|---|---|
| **Frontend UI** | Vercel | [`frontend/vercel.json`](file:///d:/WayRivo_Hackathon/frontend/vercel.json) |
| **Backend API** | Render | [`render.yaml`](file:///d:/WayRivo_Hackathon/render.yaml) |
| **Database** | Supabase | PostgreSQL 16+ via Prisma Accelerate / Direct Pooler |
| **Payments** | PayPal Developer | Sandbox REST API v2 |
| **AI Engine** | Google AI Studio | Gemini 2.0 Flash REST API |

---

## 2. Frontend Deployment: Vercel

### 2.1 Project Settings in Vercel
1. Navigate to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... $\to$ Project**.
2. Connect your Git repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (or `tsc -b && vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.2 Environment Variables (Vercel)
Add the following in **Settings $\to$ Environment Variables**:

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL on Render | `https://api.wayrivo.com/api/v1` |
| `VITE_PAYPAL_CLIENT_ID` | PayPal Sandbox Client ID | `AU7...k9` |
| `VITE_APP_NAME` | Platform branding | `WayRivo AI` |

### 2.3 `vercel.json` Routing & Headers
The repository contains [`frontend/vercel.json`](file:///d:/WayRivo_Hackathon/frontend/vercel.json) which handles:
- **Single Page Application (SPA) Routing**: Rewrites all non-asset routes to `/index.html` to prevent 404 errors on browser refresh.
- **Cache Optimization**: Immutable 1-year caching for static `/assets/*` chunks.
- **Security Headers**: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

---

## 3. Backend Deployment: Render

### 3.1 Infrastructure as Code (`render.yaml`)
The project includes a ready-to-deploy [`render.yaml`](file:///d:/WayRivo_Hackathon/render.yaml) specification:

```yaml
services:
  - type: web
    name: wayrivo-backend-api
    runtime: node
    region: oregon
    plan: starter
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/v1/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### 3.2 Manual Web Service Setup (Alternative)
1. In the [Render Dashboard](https://dashboard.render.com), click **New $\to$ Web Service**.
2. Select your Git repository.
3. Configure parameters:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/v1/health`

### 3.3 Backend Environment Variables (Render)
Under **Environment Variables**, set:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
JWT_SECRET=super_secure_random_64_char_hex_key_here
FRONTEND_URL=https://wayrivo.vercel.app
GEMINI_API_KEY=AIzaSy...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
```

---

## 4. Database Setup: Supabase PostgreSQL

### 4.1 Provisioning
1. Create a new project in [Supabase](https://supabase.com).
2. Note your database credentials from **Project Settings $\to$ Database**.
3. Use the **Session/Transaction Pooler** URL (port 6543) for `DATABASE_URL` and the **Direct** connection (port 5432) for `DIRECT_URL`.

### 4.2 Database Migrations & Seeding
From your local terminal with production `DATABASE_URL` configured:

```bash
# Push Prisma schema to production PostgreSQL
cd backend
npx prisma db push

# Populate initial travel catalog, inventory, and admin accounts
npx prisma db seed
```

---

## 5. Domain & SSL Setup

### Custom Domains
1. **Frontend**: In Vercel, assign `wayrivo.com` or `app.wayrivo.com` with a CNAME record pointing to `cname.vercel-dns.com`.
2. **Backend**: In Render, assign `api.wayrivo.com` with a CNAME record pointing to your Render service address.
3. **CORS Update**: Update `FRONTEND_URL` in backend environment variables to match your exact frontend domain (`https://app.wayrivo.com`).

---

## 6. Post-Deployment Verification Checklist

- [ ] **Health Endpoint**: `curl https://api.wayrivo.com/api/v1/health` returns `{"status":"UP","uptime":...}`.
- [ ] **Database Connection**: `GET https://api.wayrivo.com/api/v1/destinations` returns active destinations.
- [ ] **User Auth**: Register a new user, log in, verify JWT cookie/header issuance.
- [ ] **AI Assistant**: Test conversational inquiry and verify structured tool response.
- [ ] **PayPal Checkout**: Complete sandbox payment; verify order capture and booking status transition to `ESCROW_HOLD`.
- [ ] **Admin Dashboard**: Log in with demo admin credentials (`admin@wayrivo.com` / `Admin@123456`) and inspect live analytics and AG Grid views.
