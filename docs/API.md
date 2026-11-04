# WayRivo AI 2.0 — API Endpoint Reference
**Event**: PayPal AI Hackathon 2026  
**Base URL**: `/api/v1` (with `/api` fallback routing)

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Endpoint | Method | Auth Required | Description | Request Body |
|---|---|---|---|---|
| `/auth/register` | `POST` | None | Register new user account, hash password with bcrypt, issue session cookie | `{ name, email, password, role }` |
| `/auth/login` | `POST` | None | Authenticate user, rate limit attempts, return JWT & set cookie | `{ email, password }` |
| `/auth/logout` | `POST` | Optional | Clear session cookie and invalidate token | None |
| `/auth/verify-email` | `POST` | None | Verify traveler email using secure token | `{ token }` |
| `/auth/forgot-password` | `POST` | None | Generate password reset token with expiration | `{ email }` |
| `/auth/reset-password` | `POST` | None | Reset password using valid reset token | `{ token, newPassword }` |
| `/auth/me` | `GET` | Bearer / Cookie | Retrieve identity of currently authenticated user | None |

---

## 2. User & Dashboard Endpoints (`/api/v1/users`)

| Endpoint | Method | Auth Required | Description | Request Body |
|---|---|---|---|---|
| `/users/dashboard` | `GET` | Bearer / Cookie | Retrieve 5 overview KPIs, upcoming trips, completed trips, saved itineraries, AI chats, and payments | None |
| `/users/profile` | `GET` | Bearer / Cookie | Retrieve full traveler profile and travel preference settings | None |
| `/users/profile` | `PATCH` | Bearer / Cookie | Update preferences (destinations, interests, budget, currency) | `{ preferredDestinations, travelInterests, budgetPreference, preferredCurrency }` |
| `/users/change-password` | `PUT` | Bearer / Cookie | Change password with current password verification | `{ currentPassword, newPassword }` |

---

## 3. Autonomous AI Agent Endpoints (`/api/v1/agent`)

| Endpoint | Method | Auth Required | Description | Request Body |
|---|---|---|---|---|
| `/agent/chat` | `POST` | Bearer / Cookie | Converse with Gemini 2.0 Travel Agent executing approved tools | `{ message, conversationId? }` |
| `/agent/suggested-prompts` | `GET` | None | Retrieve curated starter prompts for destination & budget inspiration | None |
| `/agent/conversations` | `GET` | Bearer / Cookie | List user's past AI agent conversations | None |
| `/agent/conversations/:id` | `GET` | Bearer / Cookie | Fetch full dialogue history and tool calling actions for a session | None |
| `/agent/conversations` | `POST` | Bearer / Cookie | Create a new AI conversation session | `{ title? }` |
| `/agent/conversations/:id` | `DELETE` | Bearer / Cookie | Delete a conversation and associated message history | None |
| `/agent/save-itinerary` | `POST` | Bearer / Cookie | Persist agent-generated itinerary into PostgreSQL database | `{ destinationId, title, numberOfDays, travelersCount, budget, days }` |
| `/agent/create-proposal` | `POST` | Bearer / Cookie | Generate a draft booking proposal from agent recommendations | `{ itineraryId, specialRequests? }` |

---

## 4. Itinerary & Budget Intelligence Endpoints (`/api/v1/itineraries`)

| Endpoint | Method | Auth Required | Description | Request Body |
|---|---|---|---|---|
| `/itineraries/generate` | `POST` | Optional | Synthesize complete day-wise itinerary with morning/afternoon/evening slots and meal breaks | `{ destinationId, destinationName, numberOfDays, travelersCount, budget, interests, travelStyle }` |
| `/itineraries/calculate-budget` | `POST` | Optional | Independent itemized budget calculation (accommodation, activities, transport, dining, 5% GST) | `{ destinationName, numberOfDays, travelersCount, userBudget, selectedHotel, selectedActivities }` |
| `/itineraries/optimize-budget` | `POST` | Optional | Budget intelligence engine: detect drivers, find DB alternatives, recalculate, and explain savings | `{ destinationId, numberOfDays, travelersCount, userBudget, currentHotelId, currentActivityIds }` |
| `/itineraries` | `POST` | Bearer / Cookie | Save generated/customized itinerary to traveler account | `{ destinationId, title, numberOfDays, travelersCount, budget, days }` |
| `/itineraries/:id` | `PUT` | Bearer / Cookie | Update activities and schedule (Locked with `403` on confirmed bookings) | `{ title, days }` |
| `/itineraries/my` | `GET` | Bearer / Cookie | Retrieve user's saved itineraries | None |
| `/itineraries/:id` | `GET` | Bearer / Cookie | Retrieve single itinerary with daily schedule and destination info | None |

---

## 5. Travel Discovery & Marketplace Endpoints

| Endpoint | Method | Auth Required | Description | Query Parameters |
|---|---|---|---|---|
| `/destinations` | `GET` | Public | List destinations with state filter, search, budget range, pagination | `?state=&search=&page=&limit=` |
| `/destinations/:id` | `GET` | Public | Destination profile by ID with associated hotels and activities | None |
| `/destinations/slug/:slug` | `GET` | Public | Destination profile by slug with attractions, travel tips, and catalog items | None |
| `/destinations` | `POST` | Admin | Create new destination | None |
| `/hotels` | `GET` | Public | Search hotels with destinationId, minStars, price range, room capacity | `?destinationId=&minStars=&maxPrice=&search=` |
| `/hotels/:id` | `GET` | Public | Hotel profile with room categories, amenities, live room capacity | None |
| `/activities` | `GET` | Public | Filter excursions by category, destination, price, slot availability | `?destinationId=&category=&maxPrice=` |
| `/activities/:id` | `GET` | Public | Activity details, difficulty level, duration, included items | None |
| `/packages` | `GET` | Public | Filter travel packages by recommendation, destination, duration | `?destinationId=&isRecommended=` |
| `/packages/:id` | `GET` | Public | Verified package details with inclusions, exclusions, and seats | None |

---

## 6. Booking Engine Endpoints (`/api/v1/bookings`)

| Endpoint | Method | Auth Required | Description | Request Body |
|---|---|---|---|---|
| `/bookings` | `POST` | Bearer / Cookie | Create server-verified booking with capacity check & duplicate guard | `{ itineraryId?, items: [{ itemType, referenceId, quantity, notes }], specialRequests? }` |
| `/bookings/my` | `GET` | Bearer / Cookie | List authenticated traveler's bookings with payment and escrow status | None |
| `/bookings/:id` | `GET` | Bearer / Cookie | Detailed booking breakdown with line items, receipt info, and status | None |

---

## 7. PayPal Developer Sandbox & Escrow Endpoints (`/api/v1/payments`)

| Endpoint | Method | Auth Required | Description | Request Body |
|---|---|---|---|---|
| `/payments/config` | `GET` | Public | Return PayPal Sandbox Client ID, currency code (`USD`), and exchange rate (`83.5`) | None |
| `/payments/create-order` | `POST` | Bearer / Cookie | Server creates PayPal Orders API v2 transaction with verified amount | `{ bookingId, returnUrl?, cancelUrl? }` |
| `/payments/capture-order` | `POST` | Bearer / Cookie | Server captures authorized PayPal order, holds escrow, updates inventory | `{ bookingId, paypalOrderId }` (Header: `X-Idempotency-Key`) |
| `/payments/cancel-request/:id`| `POST` | Bearer / Cookie | Submit traveler cancellation request for administrative review | `{ reason? }` |
| `/payments/refund` | `POST` | Admin | Administrator-controlled PayPal refund execution via capture ID | `{ bookingId, amount?, reason? }` |
| `/payments/webhook` | `POST` | PayPal Signed | Handle `PAYMENT.CAPTURE.COMPLETED`, `DENIED`, `REFUNDED` events with signature verification | PayPal Webhook Event JSON |

---

## 8. Administration & Telemetry Endpoints (`/api/v1/admin`)

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/admin/stats` | `GET` | Admin | Administrative KPI counts and operational status |
| `/admin/analytics` | `GET` | Admin | Financial timelines, popular destinations, package occupancy, and AI tool latency |
| `/admin/users` | `GET` | Admin | Paginated AG Grid user list with search, role filter, and spend metrics |
| `/admin/users/:id/role` | `PATCH` | Admin | Update user role (`USER`, `ADMIN`) with audit logging |
| `/admin/users/:id/status` | `PATCH` | Admin | Update user verification status with audit logging |
| `/admin/bookings` | `GET` | Admin | Paginated AG Grid bookings control with reference search and refund triggers |
| `/admin/payments` | `GET` | Admin | Payment transactions list with PayPal Capture IDs and escrow status |
| `/admin/cancellations` | `GET` | Admin | Traveler cancellation queue awaiting administrative refund review |
| `/admin/audit-logs` | `GET` | Admin | Immutable security and moderation audit records from PostgreSQL |
| `/admin/inventory` | `GET` | Admin | Total inventory counts and low availability alerts (rooms <= 5, slots <= 6) |

