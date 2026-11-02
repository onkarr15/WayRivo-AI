# WayRivo AI 2.0 — Intelligent Travel Commerce Platform
**Event**: PayPal AI Hackathon 2026  
**Status**: Phase 3 Verified & Tested (Node.js + Express + TypeScript + Prisma + PostgreSQL Backend Operational)

---

## 1. Project Overview

**WayRivo AI 2.0** is an intelligent AI-powered travel planning, booking, and escrow payment platform. Travelers converse with an autonomous AI travel agent powered by Google Gemini, explore curated destinations, receive bespoke packages from verified destination agencies, optimize travel budgets, and complete secure escrow bookings backed by the **PayPal Developer Sandbox Orders API**.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19.2 + TypeScript + Vite 8.2
- **Styling**: Tailwind CSS v4 with custom tokens (Midnight Navy, Deep Blue, Electric Cyan, Turquoise, Champagne Gold)
- **Typography**: Inter (UI / Interface) & Manrope (Headings) via Google Fonts
- **Animations**: Framer Motion (with `useReducedMotion` support)
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **Data & Caching**: TanStack Query v5 + Axios

### Backend & Database (Phase 3 Completed)
- **Runtime**: Node.js 24 + Express.js + TypeScript
- **Database & ORM**: PostgreSQL (Supabase compatible) + Prisma ORM
- **Validation**: Zod schema validation on all inputs
- **Security**: Helmet, CORS, Express Rate Limit, BCrypt, JWT Authentication
- **AI Engine**: Google Gemini API Integration (`gemini-2.0-flash`)
- **Payment Gateway**: PayPal Developer Sandbox (Orders v2, Server Capture, Escrow Hold, Cryptographic Webhooks)

---

## 3. Database Architecture (16 Prisma Models)

1. `User`: Traveler, Expert, and Admin accounts with RBAC roles, status tracking, and audit logging.
2. `Destination`: Curated travel destinations with slugs, descriptions, photography, and seasonal guidance.
3. `Hotel`: Accommodations with star tiers, Decimal nightly rates, explicit currency, and amenities.
4. `Activity`: Curated excursions with duration, categories, and Decimal price per person.
5. `TravelPackage`: All-inclusive packages verified by licensed agency specialists.
6. `Conversation`: AI travel agent chat sessions.
7. `Message`: Dialogue history between Traveler, Assistant, and System.
8. `Itinerary`: Bespoke travel plans with day-by-day itineraries and budget optimization.
9. `ItineraryDay`: Daily breakdowns with meals, stays, activities, and estimated day costs.
10. `Booking`: Bookings with human-readable references (`WR-2026-XXXX`), server-calculated totals, and escrow states.
11. `BookingItem`: Line items with atomic server-verified unit pricing.
12. `Payment`: Secure PayPal Order & Capture mapping, idempotency keys, and Escrow statuses (`HELD`, `DISBURSED`, `REFUNDED`).
13. `GroupTrip`: Collaborative trips with unique invite codes and budget targets.
14. `GroupExpense`: Group expense splitting with receipt tracking.
15. `AgentAction`: Audit log of AI tool-calling invocations, input/output JSON, and execution latency.
16. `AuditLog`: System audit trail capturing user, action, entity, IP, and timestamp.

---

## 4. Backend API Endpoints (`/api/v1`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/health` | GET | System and database health check |
| `/api/v1/auth/register` | POST | Register new user account (Zod validated) |
| `/api/v1/auth/login` | POST | User login & JWT issuance |
| `/api/v1/auth/me` | GET | Authenticated user profile |
| `/api/v1/destinations` | GET | List curated travel destinations |
| `/api/v1/destinations/:id` | GET | Get destination details with hotels & activities |
| `/api/v1/hotels` | GET | Filter hotels by destination and star tier |
| `/api/v1/activities` | GET | Filter activities by destination and category |
| `/api/v1/packages` | GET | Curated travel packages by verified agencies |
| `/api/v1/itineraries` | POST | Save synthesized travel itinerary |
| `/api/v1/itineraries/my` | GET | List traveler itineraries |
| `/api/v1/bookings` | POST | Create booking with server-verified atomic pricing |
| `/api/v1/bookings/my` | GET | List traveler bookings with status |
| `/api/v1/payments/create-order` | POST | Initialize PayPal Developer Sandbox Order |
| `/api/v1/payments/capture-order` | POST | Capture payment & lock funds in Escrow |
| `/api/v1/payments/webhook` | POST | PayPal webhook event listener |
| `/api/v1/ai/plan` | POST | Gemini AI itinerary & budget optimization generator |
| `/api/v1/admin/stats` | GET | Administrative analytics & escrow ledger |

---

## 5. Phase Verification Checkpoint

| Check | Result | Details |
|---|---|---|
| **Database Migrations** | ✅ Passed | 16 tables, enums, foreign keys, and indexes applied in PostgreSQL |
| **Inventory Seeding** | ✅ Passed | 8 destinations, hotels, activities, packages, and seed users populated |
| **TypeScript Build** | ✅ Passed | `tsc` compiled 100% cleanly into `backend/dist` with 0 errors |
| **Integration Test Suite** | ✅ Passed | 12/12 API tests passed (Health, Auth, Inventory, Server-pricing, PayPal, Escrow, AI, Admin) |
| **Frontend Production Build** | ✅ Passed | `tsc -b && vite build` passed (2,334 modules in 483ms) |
| **Security & Business Rules** | ✅ Verified | Server-side pricing enforcement, idempotency checks, and non-bypassable escrow |

---

## 6. Development Roadmap

- [x] **Phase 0**: Project Audit & Architectural Inspection
- [x] **Phase 1**: WayRivo AI 2.0 Design System & Visual Foundation
- [x] **Phase 2**: WayRivo AI 2.0 Cinematic Landing Page & AI Search Experience
- [x] **Phase 3**: Node.js + Express + TypeScript + Prisma Backend & Supabase Database
- [ ] **Phase 4**: PayPal Developer Sandbox Smart Checkout & Escrow Engine
- [ ] **Phase 5**: Google Gemini AI Engine with Tool & Function Calling
- [ ] **Phase 6**: Core AI Modules & Marketplace Integration
- [ ] **Phase 7**: End-to-End Validation, Security Hardening & Deployment
