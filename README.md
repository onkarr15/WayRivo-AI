# WayRivo AI 2.0 — Intelligent Travel Commerce Platform
**Event**: PayPal AI Hackathon 2026  
**Status**: **Phase 10 Completed & Verified** (105/105 Automated Tests Passing — Production Cloud Deployment Ready)

[![Build & Tests](https://img.shields.io/badge/tests-105%20passed-brightgreen.svg)](#11-phase-verification-checkpoint)
[![Security Audit](https://img.shields.io/badge/security-11%20checks%20passed-blue.svg)](#10-phase-10-testing-security-and-cloud-deployment)
[![PayPal](https://img.shields.io/badge/PayPal-Sandbox%20Orders%20v2-003087.svg)](#8-booking-engine--paypal-sandbox-integration-apiv1bookings-apiv1payments)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285F4.svg)](#6-google-gemini-autonomous-ai-travel-agent--tool-calling-apiv1agent)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel%20Ready-black.svg)](#10-phase-10-testing-security-and-cloud-deployment)
[![Backend](https://img.shields.io/badge/Backend-Render%20Ready-46E3B7.svg)](#10-phase-10-testing-security-and-cloud-deployment)

---

## 1. Project Overview

**WayRivo AI 2.0** is an intelligent AI-powered travel planning, booking, and escrow payment platform built for the **PayPal AI Hackathon 2026**. Travelers converse with an autonomous AI travel agent powered by **Google Gemini 2.0 Flash**, explore curated destinations, receive bespoke day-by-day itineraries with meal breaks and travel time estimates, optimize travel budgets against real inventory, and complete secure escrow bookings backed by the **PayPal Developer Sandbox Orders API**.

### Comprehensive Documentation Index
- 📐 **[System Architecture](file:///d:/WayRivo_Hackathon/docs/ARCHITECTURE.md)**: Multi-tier architecture, system topology, sequence flows.
- 🚀 **[Installation & Local Setup](file:///d:/WayRivo_Hackathon/docs/INSTALLATION.md)**: Step-by-step setup, Docker, database seeding, test users.
- 🔐 **[Environment Variables Reference](file:///d:/WayRivo_Hackathon/docs/ENV_VARS.md)**: Complete configuration matrix with security policies.
- 🗄️ **[Database Architecture](file:///d:/WayRivo_Hackathon/docs/DATABASE.md)**: 16 Prisma models, entity relationships, indexing strategy.
- 📡 **[REST API Reference](file:///d:/WayRivo_Hackathon/docs/API.md)**: Complete specification for 45+ endpoints.
- 💳 **[PayPal Integration Guide](file:///d:/WayRivo_Hackathon/docs/PAYPAL_INTEGRATION.md)**: Orders v2, server capture, escrow, webhooks, refunds.
- 🤖 **[AI Agent & Budget Engine](file:///d:/WayRivo_Hackathon/docs/AI_ARCHITECTURE.md)**: Gemini 2.0 Flash, 10 grounded tools, budget optimizer.
- ☁️ **[Production Deployment Guide](file:///d:/WayRivo_Hackathon/docs/DEPLOYMENT.md)**: Vercel, Render, and Supabase deployment guide.
- 🧪 **[Comprehensive Testing Report](file:///d:/WayRivo_Hackathon/docs/TESTING_REPORT.md)**: Detailed audit report of all 105 automated tests.
- 📜 **[Changelog](file:///d:/WayRivo_Hackathon/CHANGELOG.md)**: Historical milestone release notes from Phase 0 to Phase 10.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19.2 + TypeScript + Vite 8.2
- **Styling**: Tailwind CSS v4 with custom tokens (Midnight Navy, Deep Blue, Electric Cyan, Turquoise, Champagne Gold)
- **Typography**: Inter (UI / Interface) & Manrope (Headings) via Google Fonts
- **Animations**: Framer Motion (with `useReducedMotion` support)
- **Icons**: Lucide React
- **Grids & Data**: AG Grid Community (`ag-grid-react`, dark quartz theme)
- **Data Visualizations**: Recharts (Responsive Area & Bar charts)
- **Routing**: React Router DOM v7 (Public, Protected & Role-Based Routes)
- **State & Auth**: React Context (`AuthContext` with persistent storage & profile synchronization)
- **Data & Caching**: TanStack Query v5 + Axios (with credentials and HTTP-only cookie support)

### Backend & Database
- **Runtime**: Node.js 24 + Express.js + TypeScript
- **Database & ORM**: PostgreSQL (Supabase compatible) + Prisma ORM
- **Authentication**: BCrypt password hashing, JWT (`wayrivo_token`), HTTP-only secure cookies (`cookie-parser`), email verification tokens, password reset tokens
- **Authorization**: Role-Based Access Control (`USER`, `ADMIN`)
- **Validation**: Zod schema validation on all incoming request bodies and query parameters
- **Security**: Helmet, CORS (`withCredentials: true`), Express Rate Limit, Plaintext protection
- **AI Engine**: Google Gemini API Integration (`gemini-2.0-flash`) via backend proxy
- **Budget Intelligence Engine**: Real-time accommodation, excursion, and transportation optimization with PostgreSQL inventory substitution
- **Payment Gateway**: PayPal Developer Sandbox (Orders v2, Server Capture, Escrow Hold, Cryptographic Webhook Verification)

---

## 3. Database Architecture (16 Prisma Models)

1. `User`: Traveler, Expert, and Admin accounts with RBAC roles (`USER`, `ADMIN`), email verification status, tokens, preferred destinations, travel interests, budget preferences, preferred currency, and audit logging.
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

## 4. Backend Authentication & User Endpoints (`/api/v1`)

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/v1/auth/register` | POST | Register new user, hash password (bcrypt), set HTTP-only cookie, generate email verification token | None |
| `/api/v1/auth/login` | POST | Authenticate user, rate limit attempts, issue JWT & set HTTP-only cookie | None |
| `/api/v1/auth/logout` | POST | Clear HTTP-only cookie session and invalidate token | Optional |
| `/api/v1/auth/verify-email` | POST | Verify email address via secure token | None |
| `/api/v1/auth/forgot-password` | POST | Request password reset token with expiration | None |
| `/api/v1/auth/reset-password` | POST | Reset password using valid token and hash new password | None |
| `/api/v1/auth/me` | GET | Retrieve authenticated user identity | Bearer / Cookie |
| `/api/v1/users/profile` | GET | Retrieve detailed traveler profile & travel preferences | Bearer / Cookie |
| `/api/v1/users/profile` | PATCH | Update profile, destinations, travel interests, budget & currency | Bearer / Cookie |
| `/api/v1/users/change-password` | PUT | Change password with current password verification | Bearer / Cookie |
| `/api/v1/admin/stats` | GET | Administrative analytics & audit data | `ADMIN` Role Required |

---

## 5. Travel Discovery & Booking Marketplace Endpoints (`/api/v1`)

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/v1/destinations` | GET | List destinations with pagination, state filter, search, & sorting | Public |
| `/api/v1/destinations/:id` | GET | Retrieve destination by ID with associated hotels, activities, & packages | Public |
| `/api/v1/destinations/slug/:slug` | GET | Retrieve destination by slug with popular attractions, travel tips, & inventory | Public |
| `/api/v1/destinations` | POST | Create destination with photography, attractions & budget | `ADMIN` Role Required |
| `/api/v1/destinations/:id` | PUT | Update destination details & attractions | `ADMIN` Role Required |
| `/api/v1/destinations/:id` | DELETE | Soft-delete destination from live catalog | `ADMIN` Role Required |
| `/api/v1/hotels` | GET | Filter hotels by destination, minStars, maxPrice, search, with room availability | Public |
| `/api/v1/hotels/:id` | GET | Hotel details including room categories, amenities, & live room capacity | Public |
| `/api/v1/hotels` | POST | Add hotel to inventory with room types & live room inventory | `ADMIN` Role Required |
| `/api/v1/hotels/:id` | PUT | Update hotel pricing, amenities, & room availability | `ADMIN` Role Required |
| `/api/v1/hotels/:id` | DELETE | Remove hotel from inventory | `ADMIN` Role Required |
| `/api/v1/activities` | GET | Filter activities by category (Adventure, Sightseeing, Water sports, Cultural), duration & slots | Public |
| `/api/v1/activities/:id` | GET | Activity details, difficulty level, included items, & slot availability | Public |
| `/api/v1/activities` | POST | Create excursion with difficulty, duration, slots & pricing | `ADMIN` Role Required |
| `/api/v1/activities/:id` | PUT | Update activity details & slot limits | `ADMIN` Role Required |
| `/api/v1/activities/:id` | DELETE | Remove activity from catalog | `ADMIN` Role Required |
| `/api/v1/packages` | GET | List packages with filters for recommendation, destination, & pricing | Public |
| `/api/v1/packages/:id` | GET | Package details with inclusions, exclusions, cancellation policy, & seat capacity | Public |
| `/api/v1/packages` | POST | Publish verified agency travel package with inclusions & seats | `ADMIN` Role Required |
| `/api/v1/packages/:id` | PUT | Update travel package pricing, seats, & highlights | `ADMIN` Role Required |
| `/api/v1/packages/:id` | DELETE | Unpublish travel package | `ADMIN` Role Required |
| `/api/v1/admin/inventory` | GET | Catalog overview counts & low-inventory alerts (rooms <= 5, slots <= 6) | `ADMIN` Role Required |

---

## 6. Google Gemini Autonomous AI Travel Agent & Tool Calling (`/api/v1/agent`)

The WayRivo AI 2.0 Agent operates strictly through the backend with 10 structured tools executing against PostgreSQL. Gemini API keys are never exposed to frontend code.

| Tool Name | Operation & PostgreSQL Target | Safety & Integrity Guard |
|---|---|---|
| `search_destinations` | Queries `Destination` model by name, state, budget range | Verified state, attractions & tips returned |
| `search_hotels` | Queries `Hotel` model by stars, price, destination | Real prices & `availableRooms` enforced |
| `search_activities` | Queries `Activity` model by category, duration, slots | Real tickets & `availableSlots` enforced |
| `search_packages` | Queries `TravelPackage` model by agency rating, seats | Agency verification & `availableSeats` checked |
| `get_hotel_details` | Full hotel profile with amenities, room categories | Direct database record |
| `check_inventory_availability` | Verifies live capacity before confirming choices | Real-time capacity validation |
| `calculate_trip_budget` | Deterministic breakdown (stay, acts, food, transport) | Server-side math with contingency buffer |
| `generate_itinerary` | Synthesizes personalized multi-day route with DB items | Grounded in verified inventory |
| `save_itinerary` | Persists day-by-day route into `Itinerary` & `ItineraryDay` | Associated with authenticated traveler account |
| `create_booking_proposal` | Generates draft booking with reference `WR-2026-XXXX` | Status `PENDING_PAYMENT` (Never captures funds) |

---

## 7. AI Itinerary & Budget Intelligence Engine (`/api/v1/itineraries`)

Phase 7 delivers a comprehensive travel planning engine that generates structured, realistic multi-day itineraries and performs budget intelligence analysis using real database inventory.

### Day-Wise Itinerary Structure
Every generated itinerary day contains:
- **Date & Day of Week**: Calculated accurately from the traveler's departure date.
- **Morning Activities**: Time window, activity title, attraction description, travel time estimate, and cost.
- **Afternoon Activities**: Time window, activity title, attraction description, travel time estimate, and cost.
- **Evening Activities**: Time window, activity title, attraction description, travel time estimate, and cost.
- **Suggested Meal Breaks**: Breakfast, Lunch, and Dinner culinary recommendations.
- **Practical Travel Notes**: Specific local advice (dress codes, camera permits, packing essentials, transit tips).

### Budget Optimization & Intelligence
- **Exceeded Budget Detection**: Flags when estimated expenses exceed traveler target.
- **Cost Driver Identification**: Pinpoints expensive components (e.g. luxury resort representing 65% of trip cost, high-cost excursions).
- **Alternative Substitution**: Queries PostgreSQL for cheaper hotels with room capacity and suitable activity substitutes.
- **Side-by-Side Comparison**: Compares original vs optimized estimates and itemized savings.
- **Natural Language Savings Explanation**: Concise explanation of changes and financial impact.
- **AI Safety Guard**: Strictly prohibits autonomous modification of itineraries linked to confirmed bookings (`status === 'CONFIRMED' || 'ESCROW_HOLD'`) with `403 Forbidden` response.

---

## 8. Booking Engine & PayPal Sandbox Integration (`/api/v1/bookings`, `/api/v1/payments`)

Phase 8 implements the complete travel booking lifecycle and payment gateway integration using PayPal Developer Sandbox Orders v2 API.

### Key Highlights
- **Atomic Server-Side Pricing**: Prices are calculated server-side from PostgreSQL; frontend pricing values are strictly discarded.
- **Inventory & Capacity Validation**: Checks `availableRooms`, `availableSlots`, and `availableSeats` prior to booking reservation.
- **PayPal Developer Sandbox Orders v2 API**: Server invokes `POST /v2/checkout/orders` with verified amounts in USD.
- **Double-Capture Guard & Idempotency**: Payment idempotency checks reject duplicate capture requests.
- **Escrow State Machine**: On successful capture, transitions payment status to `CAPTURED`, sets escrow status to `HELD`, and tags booking as `ESCROW_HOLD`.
- **Cryptographic Webhook Signature Verification**: Verifies incoming webhooks using `/v1/notifications/verify-webhook-signature`.
- **Admin-Controlled Refunds**: Refunds are restricted to the `ADMIN` role, triggering `POST /v2/payments/captures/{id}/refund` and automatically restoring inventory.

---

## 9. User and Admin Dashboards (`/traveler/dashboard`, `/admin/dashboard`)

Phase 9 establishes two dedicated dashboard portals powered by database analytics, AG Grid, and Recharts.

### User Dashboard
- **5 Overview KPIs**: Total Trips, Upcoming Bookings, Completed Trips, Total Travel Expenditure, and Pending Payments.
- **My Trips Management**: Tabbed separation for Upcoming, Completed, and All reservations.
- **Receipts & Invoices**: Direct download for all escrow-confirmed bookings.
- **Saved Itineraries & AI Chats**: Interactive access to saved plans and conversation history.

### Admin Dashboard
- **10 Management Modules**: Dashboard Overview, User Management, Destination Management, Hotel Management, Activity Management, Package Management, Booking Management, Payment Management, Refund Management, and AI Usage Analytics.
- **AG Grid Integration**: High-performance interactive data grids with sorting, filtering, and pagination in Admin Users and Bookings views.
- **Recharts Analytics**: Dynamic Area and Bar charts displaying booking volume, revenue trends, and destination rankings.
- **AI Usage Telemetry**: Live metrics aggregating Gemini tool invocations, average latency, and tool breakdown distributions.

---

## 10. Phase 10: Testing, Security and Cloud Deployment

### 10.1 Complete 15-Step E2E Traveler Journey Test (`backend/test-e2e-journey.ts`)
Validates the full consumer lifecycle with **15/15 passed assertions**:
1. User registration with bcrypt hashing.
2. User authentication & JWT issuance.
3. Destination catalog discovery.
4. AI conversational inquiry via Gemini backend proxy.
5. Multi-day day-wise itinerary generation.
6. Budget optimization with component breakdown.
7. Real-time hotel and activity inventory query.
8. Server-side booking proposal creation.
9. PayPal Sandbox order creation.
10. Customer payment approval simulation.
11. Server-side payment capture & escrow hold.
12. PayPal webhook signature verification & processing.
13. Final booking confirmation verification.
14. Real-time traveler dashboard KPI updates.
15. Official tax payment receipt generation.

### 10.2 Comprehensive Security Audit (`backend/test-security.ts`)
Validates 11 security controls with **11/11 passed checks**:
1. Protected endpoint access without token (`401 Unauthorized`).
2. Forged / invalid JWT token rejection (`403 Forbidden`).
3. Standard traveler access to admin endpoints (`403 Forbidden`).
4. Strict Zod schema request body validation (`400 Bad Request`).
5. SQL Injection immunity via Prisma parameterized queries.
6. Server-side price tampering protection (client values discarded).
7. Secure HTTP headers enforced via Helmet (`X-Content-Type-Options`, `X-Frame-Options`).
8. Double-capture idempotency prevention.
9. Webhook signature spoofing rejection.
10. Admin escrow release authorization guard.
11. Admin refund processing authorization guard.

### 10.3 Cloud Deployment Readiness
- **Frontend (Vercel)**: [`frontend/vercel.json`](file:///d:/WayRivo_Hackathon/frontend/vercel.json) configured with SPA route rewrites, asset caching headers, and API proxy rules.
- **Backend (Render)**: [`render.yaml`](file:///d:/WayRivo_Hackathon/render.yaml) declaring the `wayrivo-backend-api` web service with health check at `/api/v1/health`.
- **Database (Supabase)**: Configured for connection pooling via port 6543 and direct migrations via port 5432.
- **Environment Documentation**: Comprehensive guides in [`backend/.env.example`](file:///d:/WayRivo_Hackathon/backend/.env.example) and [`frontend/.env.example`](file:///d:/WayRivo_Hackathon/frontend/.env.example).

---

## 11. Phase Verification Checkpoint

| Verification Suite | Result | Scope / Assertions |
|---|---|---|
| **Test Suite 1: End-to-End Traveler Journey** | ✅ **15 / 15 Passed** | 15-step consumer lifecycle from registration to receipt (`test-e2e-journey.ts`) |
| **Test Suite 2: Security & Vulnerability Audit** | ✅ **11 / 11 Passed** | 11 security controls: RBAC, tampering, injection, webhooks (`test-security.ts`) |
| **Test Suite 3: User & Admin Dashboards** | ✅ **13 / 13 Passed** | Traveler stats, cancellation queue, admin AG Grid & Recharts (`test-dashboards.ts`) |
| **Test Suite 4: Booking Engine & PayPal Sandbox** | ✅ **14 / 14 Passed** | Orders v2, server capture, escrow hold, refunds (`test-booking-paypal.ts`) |
| **Test Suite 5: AI Itinerary & Budget Engine** | ✅ **8 / 8 Passed** | Day-wise schedule, transit times, budget optimizer (`test-budget-intelligence.ts`) |
| **Test Suite 6: Conversational Agent Workflow** | ✅ **7 / 7 Passed** | Gemini 2.0 Flash NLU, 10 grounded tools (`test-agent-workflow.ts`) |
| **Test Suite 7: Core REST API Endpoints** | ✅ **20 / 20 Passed** | Auth, destinations, hotels, activities, packages (`test-api.ts`) |
| **Test Suite 8: Database Integrity & Health** | ✅ **17 / 17 Passed** | 16 Prisma models, health endpoint, seed data (`verify-comprehensive.ts`) |
| **Total Automated Tests** | ✅ **105 / 105 Passed** | **100% test pass rate with 0 failures** |
| **Backend TypeScript Compilation** | ✅ **Passed (0 Errors)** | `tsc && prisma generate` compiled cleanly into `dist/` |
| **Frontend Production Build** | ✅ **Passed (788ms)** | `tsc -b && vite build` built cleanly with zero chunk warnings |
| **Frontend Code Quality** | ✅ **Passed (0 Errors)** | `oxlint` ran across all source files with 0 errors |

---

## 12. Development Roadmap

- [x] **Phase 0**: Project Audit & Architectural Inspection
- [x] **Phase 1**: WayRivo AI 2.0 Design System & Visual Foundation
- [x] **Phase 2**: WayRivo AI 2.0 Cinematic Landing Page & AI Search Experience
- [x] **Phase 3**: Node.js + Express + TypeScript + Prisma Backend & Supabase Database
- [x] **Phase 4**: Secure Authentication, Extended Profile Management & Role-Based Authorization
- [x] **Phase 5**: Travel Discovery & Booking Marketplace (Destinations, Hotels, Activities, Packages & Admin Inventory)
- [x] **Phase 6**: Google Gemini AI Engine with Autonomous Travel Agent & Tool Calling
- [x] **Phase 7**: AI Itinerary & Budget Intelligence Engine (Day Timeline, Budget Optimization & Modification Guard)
- [x] **Phase 8**: PayPal Developer Sandbox Smart Checkout & Escrow Engine
- [x] **Phase 9**: User and Admin Dashboards (Overview, My Trips, AG Grid, Recharts Analytics & AI Telemetry)
- [x] **Phase 10**: Final Testing, Security Hardening, Cloud Deployment & Comprehensive Documentation
