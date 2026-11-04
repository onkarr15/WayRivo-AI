# WayRivo AI 2.0 — Database Schema & Data Modeling
**Event**: PayPal AI Hackathon 2026  
**ORM**: Prisma v5  
**Database**: PostgreSQL (Supabase Compatible)

---

## 1. Entity-Relationship Overview

WayRivo AI 2.0 defines **16 relational models** supporting travelers, AI conversations, itineraries, catalog items, and payments:

```
+----------------+          +-------------------+          +-------------------+
|      User      | <------- |    Conversation   | -------> |    AgentAction    |
| (Auth & Roles) |          | (AI Agent Dialogue|          | (Telemetry Log)   |
+-------+--------+          +---------+---------+          +-------------------+
        |                             |
        | 1:N                         | 1:N
        v                             v
+-------+--------+          +---------+---------+
|    Booking     |          |      Message      |
| (WR-2026-XXXX) |          +-------------------+
+-------+--------+
        |
        | 1:1                     1:N
        +-------------------+-------------> +-------------------+
        |                   |               |    BookingItem    |
        v                   v               | (Verified Units)  |
+-------+--------+  +-------+--------+      +-------------------+
|    Payment     |  |   Itinerary    |
| (PayPal Order  |  | (Multi-Day     |
|  & Capture)    |  |  Schedule)     |
+----------------+  +-------+--------+
                            |
                            | 1:N
                            v
                    +-------+--------+
                    |  ItineraryDay  |
                    | (Meal & Slots) |
                    +----------------+
```

---

## 2. Model Specifications

### 1. `User`
Stores authenticated travelers, specialists, and administrators.
- **Fields**: `id`, `name`, `email` (unique), `passwordHash`, `role` (`USER`, `ADMIN`, `TRAVELER`, `EXPERT`), `isEmailVerified`, `emailVerifyToken`, `passwordResetToken`, `preferredDestinations` (array), `travelInterests` (array), `budgetPreference`, `preferredCurrency`, `createdAt`, `updatedAt`.
- **Indexes**: `[email]`, `[role]`.

### 2. `Destination`
Curated travel destinations.
- **Fields**: `id`, `name`, `slug` (unique), `country`, `state`, `description`, `imageUrl`, `bestTimeToVisit`, `averageBudget` (Decimal), `currency`, `popularAttractions` (array), `travelTips` (array), `highlights` (array), `isActive`.
- **Indexes**: `[slug]`, `[country, state]`.

### 3. `Hotel`
Real accommodation inventory with live room tracking.
- **Fields**: `id`, `destinationId`, `name`, `description`, `address`, `city`, `stars`, `pricePerNight` (Decimal), `currency`, `amenities` (array), `imageUrls` (array), `roomTypes` (JSON), `totalRooms`, `availableRooms`, `isActive`.
- **Indexes**: `[destinationId]`, `[stars]`.

### 4. `Activity`
Curated tours and excursions with live slot capacity.
- **Fields**: `id`, `destinationId`, `title`, `description`, `category`, `durationHours` (Decimal), `pricePerPerson` (Decimal), `currency`, `location`, `difficultyLevel`, `maxSlots`, `availableSlots`, `includedItems` (array), `isActive`.
- **Indexes**: `[destinationId]`, `[category]`.

### 5. `TravelPackage`
All-inclusive agency travel packages.
- **Fields**: `id`, `destinationId`, `title`, `description`, `durationDays`, `totalPrice` (Decimal), `pricePerPerson` (Decimal), `currency`, `inclusions` (array), `exclusions` (array), `highlights` (array), `imageUrls` (array), `cancellationPolicy`, `isRecommended`, `availableSeats`, `expertName`, `organizationName`, `expertRating`, `expertReviews`, `isActive`.
- **Indexes**: `[destinationId]`, `[isRecommended]`.

### 6. `Conversation`
AI Travel Agent session tracking.
- **Fields**: `id`, `userId`, `title`, `status` (`ACTIVE`, `ARCHIVED`), `createdAt`, `updatedAt`.
- **Indexes**: `[userId]`.

### 7. `Message`
Individual dialogue turns between User, Assistant, and System.
- **Fields**: `id`, `conversationId`, `sender` (`USER`, `ASSISTANT`, `SYSTEM`), `content`, `metadata` (JSON), `createdAt`.
- **Indexes**: `[conversationId]`.

### 8. `Itinerary`
Bespoke generated and optimized multi-day travel itineraries.
- **Fields**: `id`, `userId`, `destinationId`, `title`, `travelStyle`, `startDate`, `endDate`, `numberOfDays`, `travelersCount`, `budget` (Decimal), `currency`, `status` (`DRAFT`, `PROPOSED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`), `totalEstimatedCost` (Decimal).
- **Indexes**: `[userId]`, `[destinationId]`.

### 9. `ItineraryDay`
Structured day-by-day plan with time slots, activities, and meal breaks.
- **Fields**: `id`, `itineraryId`, `dayNumber`, `date`, `dayOfWeek`, `title`, `morningSlot` (JSON), `afternoonSlot` (JSON), `eveningSlot` (JSON), `suggestedMealBreaks` (JSON), `practicalTravelNotes`, `estimatedDayCost` (Decimal), `hotelStayName`.
- **Indexes**: `[itineraryId]`, unique `[itineraryId, dayNumber]`.

### 10. `Booking`
Reservations with human-readable references and escrow status.
- **Fields**: `id`, `bookingReference` (unique, e.g. `WR-2026-AB12CD`), `userId`, `itineraryId` (unique), `status` (`PENDING_PAYMENT`, `CONFIRMED`, `ESCROW_HOLD`, `CANCELLED`, `REFUNDED`), `totalAmount` (Decimal), `currency`, `specialRequests`, `escrowReleaseDate`, `confirmedAt`.
- **Indexes**: `[userId]`, `[status]`, `[bookingReference]`.

### 11. `BookingItem`
Atomic line items verified against real inventory pricing.
- **Fields**: `id`, `bookingId`, `itemType` (`HOTEL`, `ACTIVITY`, `PACKAGE`, `CUSTOM`), `referenceId`, `title`, `unitPrice` (Decimal), `quantity`, `totalPrice` (Decimal), `notes`.
- **Indexes**: `[bookingId]`.

### 12. `Payment`
PayPal Orders API v2 capture mapping and escrow state management.
- **Fields**: `id`, `bookingId` (unique), `paypalOrderId` (unique), `paypalCaptureId` (unique), `status` (`CREATED`, `APPROVED`, `CAPTURED`, `DENIED`, `REFUNDED`), `amount` (Decimal), `currency`, `payerEmail`, `payerName`, `payerId`, `escrowStatus` (`HELD`, `DISBURSED`, `REFUNDED`), `idempKey` (unique), `captureData` (JSON).
- **Indexes**: `[paypalOrderId]`, `[paypalCaptureId]`, `[status]`, `[idempKey]`.

### 13. `GroupTrip`
Collaborative multi-user planning group with shared target budget.
- **Fields**: `id`, `organizerId`, `title`, `destinationId`, `inviteCode` (unique), `targetBudget` (Decimal), `currency`, `status` (`PLANNING`, `LOCKED`, `COMPLETED`), `startDate`, `endDate`.
- **Indexes**: `[organizerId]`, `[inviteCode]`.

### 14. `GroupExpense`
Expense record for group bill splitting and settlement.
- **Fields**: `id`, `groupTripId`, `paidById`, `title`, `amount` (Decimal), `currency`, `splitMethod` (`EQUAL`, `PERCENTAGE`, `EXACT`), `receiptUrl`.
- **Indexes**: `[groupTripId]`, `[paidById]`.

### 15. `AgentAction`
Autonomous AI agent tool calling telemetry and audit trail.
- **Fields**: `id`, `conversationId`, `actionType` (`SEARCH_INVENTORY`, `OPTIMIZE_BUDGET`, `GENERATE_ITINERARY`, `VERIFY_ESCROW`, `CREATE_BOOKING`), `toolInput` (JSON), `toolOutput` (JSON), `executionMs`, `status` (`SUCCESS`, `FAILED`), `createdAt`.
- **Indexes**: `[conversationId]`, `[actionType]`.

### 16. `AuditLog`
Immutable administrative and security operation log.
- **Fields**: `id`, `userId`, `action`, `entityType`, `entityId`, `details` (JSON), `ipAddress`, `userAgent`, `createdAt`.
- **Indexes**: `[userId]`, `[entityType, entityId]`, `[action]`.

---

## 3. Migration & Indexing Strategy

- **Connection Pooling**: Supported via Supabase PgBouncer on port `6543` (`?pgbouncer=true&connection_limit=1`).
- **Prisma Schema Commands**:
  - `npx prisma db push` (Applies schema changes safely without data loss)
  - `npx prisma generate` (Generates type-safe TypeScript client)
  - `npx prisma studio` (Interactive local database browser on port 5555)
