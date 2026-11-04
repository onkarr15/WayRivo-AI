# WayRivo AI 2.0 — Local Installation & Setup Guide
**Event**: PayPal AI Hackathon 2026

---

## 1. Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: v20.x, v22.x, or v24.x (`node -v`)
- **Package Manager**: npm v10+ (`npm -v`)
- **Database**: PostgreSQL v15+ (local instance, Docker, or Supabase cloud instance)
- **Git**: v2.30+ (`git --version`)
- **PayPal Developer Account**: Sandbox account at [developer.paypal.com](https://developer.paypal.com)
- **Google AI Studio Key**: API key for Gemini 2.0 Flash at [aistudio.google.com](https://aistudio.google.com)

---

## 2. Repository Cloning

```bash
git clone https://github.com/wayrivo/wayrivo-ai-2.0.git
cd wayrivo-ai-2.0
```

---

## 3. Backend Setup

### A. Install Dependencies
```bash
cd backend
npm install
```

### B. Environment Configuration
Copy the example environment file and configure credentials:
```bash
cp .env.example .env
```
Edit `.env` with your values:
```env
PORT=8085
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/wayrivo_ai?schema=public"
JWT_SECRET="super-secret-jwt-key-replace-in-production-min-64-characters"
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
PAYPAL_CLIENT_ID="your_paypal_sandbox_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_sandbox_client_secret"
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
PAYPAL_CURRENCY="USD"
PAYPAL_EXCHANGE_RATE="83.5"
CORS_ORIGIN="http://localhost:5173"
```

### C. Database Migration & Seed
Run Prisma to generate the client, push schema to PostgreSQL, and seed initial catalog records:
```bash
# Push Prisma schema to your PostgreSQL database
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Seed destinations, hotels, activities, and agency travel packages
npm run seed
```

### D. Start Backend Server
```bash
# Development mode with hot-reloading
npm run dev

# Or build and run production server
npm run build
npm start
```
The backend server will listen at `http://localhost:8085`.
Verify health check: `curl http://localhost:8085/api/v1/health`

---

## 4. Frontend Setup

### A. Install Dependencies
Open a second terminal window:
```bash
cd frontend
npm install
```

### B. Environment Configuration
Create or inspect `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8085/api/v1
```

### C. Start Frontend Development Server
```bash
npm run dev
```
The web application will launch at `http://localhost:5173`.

---

## 5. Running the Test Suites

All test suites execute against the live backend server:

```bash
cd backend

# 1. Complete End-to-End User Journey (15 steps)
npx tsx test-e2e-journey.ts

# 2. Comprehensive Security Audit (11 tests)
npx tsx test-security.ts

# 3. User & Admin Dashboards (13 tests)
npx tsx test-dashboards.ts

# 4. Booking Engine & PayPal Sandbox (14 tests)
npx tsx test-booking-paypal.ts

# 5. Budget Intelligence & Itinerary Engine (8 tests)
npx tsx test-budget-intelligence.ts

# 6. Autonomous AI Agent Workflow (7 tests)
npx tsx test-agent-workflow.ts

# 7. Authentication, RBAC & Core API (20 tests)
npx tsx test-api.ts
```

All 7 test suites should report **79 / 79 passing tests**.

---

## 6. Default Demo Credentials

For rapid verification during hackathon judging:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@wayrivo.com` | `AdminPassword@123` | Full Access (`/admin/*`) |
| **Traveler** | `traveler@wayrivo.com` | `TravelerPassword@123` | Traveler Portal (`/traveler/*`) |

