# WayRivo AI 2.0 — Intelligent Travel Commerce Platform
**Event**: PayPal AI Hackathon 2026  
**Status**: Phase 6 Verified & Tested (Google Gemini Autonomous AI Travel Agent & Tool Calling Operational)

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
- **Routing**: React Router DOM v7 (Public, Protected & Role-Based Routes)
- **State & Auth**: React Context (`AuthContext` with persistent storage & profile synchronization)
- **Data & Caching**: TanStack Query v5 + Axios (with credentials and HTTP-only cookie support)

### Backend & Database (Node.js + Supabase PostgreSQL)
- **Runtime**: Node.js 24 + Express.js + TypeScript
- **Database & ORM**: PostgreSQL (Supabase compatible) + Prisma ORM
- **Authentication**: BCrypt password hashing, JWT (`wayrivo_token`), HTTP-only secure cookies (`cookie-parser`), email verification tokens, password reset tokens
- **Authorization**: Role-Based Access Control (`USER`, `ADMIN`, `TRAVELER`, `EXPERT`)
- **Validation**: Zod schema validation on all authentication and profile requests
- **Security**: Helmet, CORS (`withCredentials: true`), Express Rate Limit on login attempts, Plaintext protection
- **AI Engine**: Google Gemini API Integration (`gemini-2.0-flash`)
- **Payment Gateway**: PayPal Developer Sandbox (Orders v2, Server Capture, Escrow Hold, Cryptographic Webhooks)

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

### Agent HTTP & Streaming Endpoints

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/v1/agent/chat` | POST | Conversational interaction with autonomous tool-calling loop | Optional (Session / Token) |
| `/api/v1/agent/chat/stream` | POST | Server-Sent Events (SSE) progressive event stream (status, tool, final) | Optional (Session / Token) |
| `/api/v1/agent/conversations` | GET | Retrieve user chat session history | Optional (Session / Token) |
| `/api/v1/agent/conversations` | POST | Initialize new trip planning dialogue | Optional (Session / Token) |
| `/api/v1/agent/conversations/:id` | GET | Retrieve complete conversation history and persisted messages | Optional (Session / Token) |
| `/api/v1/agent/conversations/:id` | DELETE | Archive conversation | Optional (Session / Token) |
| `/api/v1/agent/save-itinerary` | POST | Persist crafted route to traveler profile | Optional (Session / Token) |
| `/api/v1/agent/create-proposal` | POST | Generate unconfirmed booking proposal for PayPal Smart Checkout | Optional (Session / Token) |
| `/api/v1/agent/suggested-prompts` | GET | Starter travel prompts (Goa adventure, Kerala romance, Ladakh trek, Rajasthan culture) | Public |

---

## 7. Phase Verification Checkpoint

| Check | Result | Details |
|---|---|---|
| **Database Migrations** | ✅ Passed | Prisma schema with 16 models: User, Destination, Hotel, Activity, TravelPackage, Conversation, Message, Itinerary, ItineraryDay, Booking, BookingItem, Payment, GroupTrip, GroupExpense, AgentAction, AuditLog |
| **Backend TypeScript Build** | ✅ Passed | `tsc` compiled 100% cleanly into `backend/dist` with 0 errors |
| **Frontend Production Build** | ✅ Passed | `tsc -b && vite build` compiled with 0 errors (2,354 modules in 361ms) |
| **Frontend Code Quality** | ✅ Passed | `oxlint` ran across 79 files with 0 errors |
| **API Test Suite 1** | ✅ Passed | 20/20 automated tests passed (`backend/test-api.ts`) covering Auth, Profile, RBAC & Filters |
| **API Test Suite 2** | ✅ Passed | 17/17 comprehensive tests passed (`backend/verify-comprehensive.ts`) covering CUD lifecycles & inventory alerts |
| **API Test Suite 3 (Phase 6 Agent)** | ✅ Passed | 7/7 automated tests passed (`backend/test-agent-workflow.ts`) covering extraction, live tool calling, budget calculation, itinerary generation, DB save, and draft proposal generation |
| **Total Automated Tests** | ✅ Passed | **44 / 44 tests passing** with 0 regressions across all phases |
| **AI Safety & Accuracy** | ✅ Verified | Tool grounding in database; zero hallucinated prices; unconfirmed booking state (`PENDING_PAYMENT`); no autonomous fund capture |
| **Chat Interface & UX** | ✅ Verified | Route `/agent` with session history, dynamic status indicator, interactive recommendation cards, itinerary accordion, budget breakdown, route editor modal, and proposal checkout modal |

---

## 8. Development Roadmap

- [x] **Phase 0**: Project Audit & Architectural Inspection
- [x] **Phase 1**: WayRivo AI 2.0 Design System & Visual Foundation
- [x] **Phase 2**: WayRivo AI 2.0 Cinematic Landing Page & AI Search Experience
- [x] **Phase 3**: Node.js + Express + TypeScript + Prisma Backend & Supabase Database
- [x] **Phase 4**: Secure Authentication, Extended Profile Management & Role-Based Authorization
- [x] **Phase 5**: Travel Discovery & Booking Marketplace (Destinations, Hotels, Activities, Packages & Admin Inventory)
- [x] **Phase 6**: Google Gemini AI Engine with Autonomous Travel Agent & Tool Calling
- [ ] **Phase 7**: PayPal Developer Sandbox Smart Checkout & Escrow Engine
- [ ] **Phase 8**: End-to-End Validation, Security Hardening & Deployment

