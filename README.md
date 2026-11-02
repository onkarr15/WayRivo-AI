# WayRivo AI 2.0 — Intelligent Travel Commerce Platform
**Event**: PayPal AI Hackathon 2026  
**Status**: Phase 1 Verified & Tested (Visual Foundation & Design System Complete)

---

## 1. Project Overview

**WayRivo AI 2.0** is an intelligent AI-powered travel planning, booking, and escrow payment platform. Travelers converse with an autonomous AI travel agent powered by Google Gemini, explore curated destinations, receive bespoke packages from verified destination agencies, optimize travel budgets, and complete secure escrow bookings backed by the **PayPal Developer Sandbox Orders API**.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19.2 + TypeScript + Vite 8.2
- **Styling**: Tailwind CSS v4 with custom tokens (Midnight Navy, Deep Blue, Electric Cyan, Turquoise, Champagne Gold)
- **Typography**: Inter (UI / Interface) & Manrope (Headings) via Google Fonts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **Data & Caching**: TanStack Query v5 + Axios

### Backend & Database (Planned for Phases 2–4)
- **Runtime**: Node.js 24 + Express.js + TypeScript
- **Database & ORM**: Supabase PostgreSQL + Prisma ORM
- **AI Engine**: Google Gemini API with Tool/Function Calling & Structured JSON
- **Payment Gateway**: PayPal Developer Sandbox (Orders v2, Server Capture, Cryptographic Webhooks)

---

## 3. Design System & Tokens

### Palette
- **Midnight Navy Backgrounds**: `#060D1A`, `#0A1324`, `#111D33`
- **Deep Blue Surfaces**: `#0A1526`, `#101F36`, `#162A47`, `#1C3459`
- **Electric Cyan Accents**: `#00F0FF`, `#52F5FF`, `#00B3BF`
- **Turquoise Highlights**: `#14B8A6`, `#2DD4BF`
- **Champagne Gold Accents**: `#D4AF37`, `#F3E5AB`, `#AA820A`
- **Contrast & Accessibility**: Strict adherence to WCAG AA color contrast standards.

### Reusable Component Library (`src/components/ui/`)
- `Button`: Primary, secondary, gold, outline, ghost, danger, success with motion tap.
- `Badge`: Cyan, gold, turquoise, success, warning, danger with optional glow & status dots.
- `Input`: Accessible input with labels, error states, and icon slots.
- `SearchBar`: Travel search bar with destination input, traveler dropdown, and trending pills.
- `PriceDisplay`: Currency formatter (`₹`, `$`, `€`), strikethrough original prices, and period tags.
- `DestinationCard`: Cinematic card with image hover zoom, season badges, and pricing.
- `HotelCard`: Hotel preview with star ratings, amenities checklist, and room selection.
- `PackageCard`: Specialist proposal with verification badge, duration, inclusions, and escrow notice.
- `Modal`: Accessible dialog with backdrop blur, keyboard trap, and Framer Motion transitions.
- `Drawer`: Slide-in drawer for AI assistant and mobile navigation.
- `Toast & useToast`: Global notifications with auto-dismiss and stack positioning.
- `Skeleton & CardSkeleton`: Pulse loading placeholders.
- `EmptyState & ErrorState`: Feedback and retry containers.

---

## 4. Phase Verification Checkpoint

| Check | Result | Details |
|---|---|---|
| **TypeScript Check** | ✅ Passed | `npx tsc --noEmit` exited with 0 errors |
| **Frontend Build** | ✅ Passed | `tsc -b && vite build` built 2,330 modules in 492ms |
| **Animation System** | ✅ Verified | Framer Motion variants in `src/utils/animations.ts` |
| **Accessibility** | ✅ Verified | ARIA attributes, keyboard support, high contrast |
| **Existing Features** | ✅ Preserved | All 20+ legacy pages intact and running |

---

## 5. Development Roadmap

- [x] **Phase 0**: Project Audit & Architectural Inspection
- [x] **Phase 1**: WayRivo AI 2.0 Design System & Visual Foundation
- [ ] **Phase 2**: Node.js + Express + TypeScript + Prisma + Supabase Backend Foundation
- [ ] **Phase 3**: PayPal Developer Sandbox Smart Checkout & Webhook Engine
- [ ] **Phase 4**: Google Gemini AI Engine with Tool & Function Calling
- [ ] **Phase 5**: Travel Marketplace & PayPal Smart Checkout Frontend
- [ ] **Phase 6**: Core AI Modules (AI Travel Agent, Itinerary Generator, Budget Optimizer)
- [ ] **Phase 7**: End-to-End Validation, Security Hardening & Deployment
