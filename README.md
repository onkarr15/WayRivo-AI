# WayRivo AI 2.0 — Intelligent Travel Commerce Platform
**Event**: PayPal AI Hackathon 2026  
**Status**: Phase 9 Verified & Tested (User Dashboard, Admin Dashboard with AG Grid, Recharts Financial Analytics & AI Telemetry)

---

## 1. Project Overview

**WayRivo AI 2.0** is an intelligent AI-powered travel planning, booking, and escrow payment platform. Travelers converse with an autonomous AI travel agent powered by Google Gemini, explore curated destinations, receive bespoke day-by-day itineraries with meal breaks and travel time estimates, optimize travel budgets against real inventory, and complete secure escrow bookings backed by the **PayPal Developer Sandbox Orders API**.

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
- **Budget Intelligence Engine**: Real-time accommodation, excursion, and transportation optimization with PostgreSQL inventory substitution
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

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/v1/itineraries/generate` | POST | Generate complete day-wise itinerary with morning/afternoon/evening slots and travel times | Optional |
| `/api/v1/itineraries/calculate-budget` | POST | Independent itemized budget calculation (stay, activities, transport, dining, permits, 5% GST) | Optional |
| `/api/v1/itineraries/optimize-budget` | POST | Budget intelligence analysis: identify drivers, suggest DB alternatives, recalculate and explain savings | Optional |
| `/api/v1/itineraries` | POST | Save completed itinerary to traveler profile | Bearer / Cookie |
| `/api/v1/itineraries/:id` | PUT | Update editable activities & title with safety lock on confirmed bookings | Bearer / Cookie |
| `/api/v1/itineraries/my` | GET | Retrieve user's saved itineraries | Bearer / Cookie |
| `/api/v1/itineraries/:id` | GET | Fetch itinerary by ID with daily schedules and destination info | Bearer / Cookie |

---

## 8. Booking Engine & PayPal Sandbox Integration (`/api/v1/bookings`, `/api/v1/payments`)

Phase 8 implements the complete travel booking lifecycle and payment gateway integration using PayPal Developer Sandbox Orders v2 API.

### Part A: Server-Verified Booking Engine
- **Atomic Pricing**: All item prices are retrieved and summed server-side from PostgreSQL; frontend prices are never trusted.
- **Inventory & Capacity Validation**: Verifies `availableRooms` on hotels, `availableSlots` on activities, and `availableSeats` on travel packages before accepting a booking.
- **Duplicate Booking Guard**: Prevents duplicate reservations by rejecting repeated submissions with `409 Conflict`.
- **Unique Booking Reference**: Formats unique, human-readable reference tokens (`WR-2026-XXXX`).
- **Pending Booking Creation**: Saves booking items and establishes an initial `PENDING_PAYMENT` state.

### Part B: PayPal Developer Sandbox Orders API v2
- **Configurable Transaction Currency**: Operates with configurable `PAYPAL_CURRENCY` (default `USD`) and `PAYPAL_EXCHANGE_RATE` (`83.5` INR/USD).
- **Transparent Currency Presentation**: Displays both INR catalog price and final USD transaction charge with explicit exchange rates on the checkout UI.
- **Server-Side Order Creation**: Backend invokes `POST /v2/checkout/orders` with verified amounts and returns approval URLs and order tokens.
- **Server-Side Capture**: Backend verifies and executes `POST /v2/checkout/orders/{id}/capture`.
- **Double-Capture Guard & Idempotency**: Inspects previous payment status and supports `Idempotency-Key` headers to ensure identical requests cannot double-charge travelers.
- **Escrow State Machine**: On successful capture, transitions payment status to `CAPTURED`, sets escrow to `HELD`, decrements real inventory, and marks booking as `CONFIRMED`.

### Part C: Cryptographic Webhooks & Idempotency
- **Signature Verification**: Validates PayPal webhook events using `/v1/notifications/verify-webhook-signature` with transmission ID, timestamp, webhook ID, and cert URL.
- **Supported Events**: Handled `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, and `PAYMENT.CAPTURE.REFUNDED`.
- **Deduplication**: In-memory and database transaction check prevents replay attacks or duplicate processing of webhook notifications.

### Part D: Administrator-Controlled Refunds
- **Anti-Auto-Refund Guard**: Traveler cancellation requests (`POST /api/v1/payments/cancel-request/:id`) log a cancellation audit record without automatically initiating a refund.
- **Admin Refund Authorization**: Only authenticated administrators (`ADMIN` role) can execute refunds (`POST /api/v1/payments/refund`).
- **PayPal Refund API**: Directly triggers `POST /v2/payments/captures/{capture_id}/refund` on PayPal Developer Sandbox.
- **Inventory Restoration**: Atomically increments available hotel rooms, activity slots, or package seats upon confirmed refund.

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/v1/payments/config` | GET | Retrieve PayPal Client ID, currency code, and exchange rate | Public |
| `/api/v1/bookings` | POST | Create server-verified booking with inventory checks and duplicate guard | Bearer / Cookie |
| `/api/v1/bookings/my` | GET | Retrieve authenticated traveler's bookings with payment status | Bearer / Cookie |
| `/api/v1/bookings/:id` | GET | Detailed booking breakdown with line items and escrow status | Bearer / Cookie |
| `/api/v1/payments/create-order` | POST | Initiate PayPal Orders API v2 transaction server-side | Bearer / Cookie |
| `/api/v1/payments/capture-order` | POST | Capture authorized PayPal order server-side & hold escrow | Bearer / Cookie |
| `/api/v1/payments/cancel-request/:id` | POST | Submit cancellation request for administrator review | Bearer / Cookie |
| `/api/v1/payments/refund` | POST | Admin-controlled PayPal refund execution & inventory restore | `ADMIN` Role Required |
| `/api/v1/payments/webhook` | POST | PayPal webhook receiver with cryptographic signature verification | Public (PayPal Signed) |

---

## 9. User and Admin Dashboards (`/traveler/dashboard`, `/admin/dashboard`)

Phase 9 establishes two dedicated dashboard portals powered by database analytics, AG Grid, and Recharts.

### Part A: Premium User Dashboard
- **5 Overview KPIs**: Total Trips, Upcoming Bookings, Completed Trips, Total Travel Expenditure, and Pending Payments.
- **My Trips Management**: Tabbed separation for Upcoming, Completed, and All reservations with full details (destination, dates, reference code `WR-2026-XXXX`, travelers, status, escrow badge, total price).
- **Booking Details Modal**: Inspection of line items, quantities, and verified server pricing.
- **Printable Receipts**: Direct receipt access for all escrow-confirmed bookings.
- **Cancellation Request Queue**: Review flow with escrow notices preventing automated chargebacks.
- **Saved Itineraries**: Multi-day itinerary cards with 1-click planner reopening.
- **AI Conversations**: Session transcripts list with direct continuation in `/agent`.
- **Payment & Escrow History**: PayPal Order IDs, PayPal Capture IDs, and deposit status.
- **Personal Travel Preferences**: Customizable destinations, interests, budget preferences, and currency settings.

### Part B: Protected Admin Intelligence Center
- **10 Management Modules**: Dashboard Overview, User Management, Destination Management, Hotel Management, Activity Management, Package Management, Booking Management, Payment Management, Refund Management, and AI Usage Analytics.
- **Recharts Financial Analytics**:
  - **Booking & Revenue Timeline**: Area chart tracking captured revenue and booking volume.
  - **Popular Destinations Ranking**: Bar chart displaying top destination performance and revenue.
  - **Package Performance**: Occupancy, pricing, and seat availability comparison.
- **High-Performance AG Grid Integration**:
  - Implemented in `AdminUsers.tsx` and `AdminBookings.tsx` with dark theme quartz styling (`ag-theme-quartz-dark`), multi-column sorting, quick filter searching, pagination, and direct admin action triggers.
- **Google Gemini AI Telemetry**:
  - Live query aggregation over `AgentAction` model tracking total tool invocations, average execution latency (ms), tool breakdown distribution, and recent action logs.
- **Security & RBAC Enforcement**:
  - Strict server-side verification using `requireRoles([UserRole.ADMIN])`.
  - Immutable moderation logging into `AuditLog` table for role changes, verification updates, and refunds.

| Endpoint | Method | Description | Auth Required |
|---|---|---|---|
| `/api/v1/users/dashboard` | GET | Aggregated traveler dashboard (KPIs, trips, saved plans, chats, payments) | Bearer / Cookie |
| `/api/v1/admin/analytics` | GET | Financial metrics, booking velocity, popular destinations, and AI usage | `ADMIN` Role Required |
| `/api/v1/admin/users` | GET | Paginated users list with search, role filters, total bookings, & total spend | `ADMIN` Role Required |
| `/api/v1/admin/users/:id/role` | PATCH | Update user role (`USER`, `ADMIN`) with audit logging | `ADMIN` Role Required |
| `/api/v1/admin/users/:id/status` | PATCH | Update user verification status with audit logging | `ADMIN` Role Required |
| `/api/v1/admin/bookings` | GET | Paginated bookings list with search, status filters, and escrow details | `ADMIN` Role Required |
| `/api/v1/admin/payments` | GET | Paginated payment transactions with PayPal Capture IDs | `ADMIN` Role Required |
| `/api/v1/admin/cancellations` | GET | Traveler cancellation request queue for administrative audit | `ADMIN` Role Required |

---

## 10. Phase Verification Checkpoint

| Check | Result | Details |
|---|---|---|
| **Database Migrations** | ✅ Passed | Prisma schema with 16 models: User, Destination, Hotel, Activity, TravelPackage, Conversation, Message, Itinerary, ItineraryDay, Booking, BookingItem, Payment, GroupTrip, GroupExpense, AgentAction, AuditLog |
| **Backend TypeScript Build** | ✅ Passed | `tsc` compiled 100% cleanly into `backend/dist` with 0 errors |
| **Frontend Production Build** | ✅ Passed | `tsc -b && vite build` compiled with 0 errors (2,733 modules in 1.22s) |
| **Frontend Code Quality** | ✅ Passed | `oxlint` ran across 80 files with 0 errors |
| **Test Suite 1 (API Auth & RBAC)** | ✅ Passed | 20/20 automated tests passed (`backend/test-api.ts`) |
| **Test Suite 2 (Comprehensive CUD)** | ✅ Passed | 17/17 comprehensive tests passed (`backend/verify-comprehensive.ts`) |
| **Test Suite 3 (AI Agent Workflow)** | ✅ Passed | 7/7 automated tests passed (`backend/test-agent-workflow.ts`) |
| **Test Suite 4 (Phase 7 Budget Intelligence)** | ✅ Passed | 8/8 automated tests passed (`backend/test-budget-intelligence.ts`) |
| **Test Suite 5 (Phase 8 Booking & PayPal)** | ✅ Passed | 14/14 automated tests passed (`backend/test-booking-paypal.ts`) |
| **Test Suite 6 (Phase 9 Dashboards & Telemetry)** | ✅ Passed | 13/13 automated tests passed (`backend/test-dashboards.ts`) |
| **Total Automated Tests** | ✅ Passed | **79 / 79 tests passing** with 0 regressions across all phases |
| **AG Grid Integration** | ✅ Verified | High-performance interactive grid in Admin Users & Bookings with dark theme |
| **Recharts Analytics** | ✅ Verified | Area & Bar charts powered by live database aggregates |
| **Admin RBAC Enforcement** | ✅ Verified | Backend strictly returns `403 Forbidden` for non-admin accounts |

---

## 11. Development Roadmap

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
- [ ] **Phase 10**: End-to-End Validation, Security Hardening & Production Deployment
