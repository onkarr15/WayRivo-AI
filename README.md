# WayRivo AI 2.0 — Intelligent Travel Commerce Platform
**Event**: PayPal AI Hackathon 2026  
**Status**: Phase 4 Verified & Tested (Authentication, RBAC, User Profiles & Protected Routes Operational)

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

## 5. Phase Verification Checkpoint

| Check | Result | Details |
|---|---|---|
| **Database Migrations** | ✅ Passed | Prisma schema updated with Phase 4 profile attributes and pushed to PostgreSQL |
| **Backend TypeScript Build** | ✅ Passed | `tsc` compiled 100% cleanly into `backend/dist` with 0 errors |
| **Frontend Production Build** | ✅ Passed | `tsc -b && vite build` compiled with 0 errors (2,339 modules in 499ms) |
| **Integration Test Suite** | ✅ Passed | 14/14 API tests passed (Health, Register, Cookie, Verify Email, Login, Profile, Password Reset, RBAC Admin) |
| **Security & Cookies** | ✅ Verified | HTTP-only cookie `wayrivo_token`, Rate limiting on auth attempts, BCrypt salt rounds 10 |
| **Frontend Pages & UX** | ✅ Verified | Login, Register, Forgot Password, Reset Password, Profile, and Account Settings with Midnight Navy aesthetic |

---

## 6. Development Roadmap

- [x] **Phase 0**: Project Audit & Architectural Inspection
- [x] **Phase 1**: WayRivo AI 2.0 Design System & Visual Foundation
- [x] **Phase 2**: WayRivo AI 2.0 Cinematic Landing Page & AI Search Experience
- [x] **Phase 3**: Node.js + Express + TypeScript + Prisma Backend & Supabase Database
- [x] **Phase 4**: Secure Authentication, Extended Profile Management & Role-Based Authorization
- [ ] **Phase 5**: Google Gemini AI Engine with Autonomous Travel Agent & Tool Calling
- [ ] **Phase 6**: PayPal Developer Sandbox Smart Checkout & Escrow Engine
- [ ] **Phase 7**: End-to-End Validation, Security Hardening & Deployment
