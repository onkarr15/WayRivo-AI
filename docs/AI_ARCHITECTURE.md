# WayRivo AI 2.0 — AI Agent Architecture & Intelligence Engine

## 1. Overview & Capabilities

WayRivo AI 2.0 incorporates an intelligent conversational travel agent powered by the **Google Gemini 2.0 Flash** API. Operating exclusively through a secure backend proxy, the agent interacts with real-time PostgreSQL database records using structured function calling.

```
       Traveler (Natural Language Request)
                      │
                      ▼
             Frontend Chat UI
                      │ (HTTP REST / SSE)
                      ▼
     Backend Agent Controller (`gemini.agent.ts`)
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
 Google Gemini 2.0 Flash   10 Grounded Tool Calls
 (NLU, Intent, Synthesis)  (PostgreSQL Inventory & Pricing)
           │                     │
           └──────────┬──────────┘
                      ▼
     Synthesized Response & Structured Cards
  (Day-wise Itinerary, Cost Breakdown, Bookings)
```

### Core AI Capabilities
1. **Natural Language Understanding (NLU)**: Deciphers unstructured travel requests, complex preferences, and multi-constraint requirements.
2. **Entity Extraction**: Isolates destination, duration, traveler count, budget ceilings, travel style, and accommodation tier.
3. **Grounded Function Calling**: Never invents or hallucinates hotels, activities, or prices; executes server tools to retrieve verified database records.
4. **Day-wise Itinerary Generation**: Crafts balanced schedules with morning, afternoon, and evening segments, realistic travel times, meal suggestions, and local safety notes.
5. **Dynamic Budget Optimization**: Identifies cost overruns, detects expensive outlier components, suggests cheaper alternatives, and recalculates savings.
6. **Context-Aware Dialogue**: Maintains conversational context across multi-turn sessions with automatic session persistence.

---

## 2. Structured Agent Tools (10 Grounded Tools)

The Gemini model is provided with 10 structured tools via declarative schema definitions. When Gemini decides to call a tool, the backend executes the corresponding query against PostgreSQL and returns the verified data back to the model:

| Tool Name | Parameters | Purpose | Backend Implementation |
|---|---|---|---|
| `search_destinations` | `query`, `category`, `state`, `country` | Find destinations matching traveler preferences | Filters `destinations` table with case-insensitive search and rating ordering |
| `search_hotels` | `destinationId`, `minPrice`, `maxPrice`, `amenities`, `minRating` | Retrieve available accommodation matching criteria | Queries `hotels` table with dynamic price filters |
| `search_activities` | `destinationId`, `category`, `maxPrice`, `difficulty` | Retrieve adventures, tours, and cultural experiences | Queries `activities` table with category indexing |
| `search_packages` | `destinationId`, `durationDays`, `maxBudget` | Retrieve curated multi-day tour packages | Queries `travel_packages` table |
| `check_availability` | `serviceType`, `serviceId`, `date`, `quantity` | Verify real-time room or ticket stock | Checks `availableRooms` or `maxCapacity` against existing bookings |
| `calculate_trip_budget` | `hotelId`, `nights`, `activityIds`, `travelers`, `includeTax` | Compute total estimated trip cost | Sums real costs from DB with 18% GST calculation |
| `optimize_budget` | `currentTotal`, `targetBudget`, `hotelId`, `activityIds` | Find cheaper alternatives for expensive items | Searches for lower-tier hotels and activities in the same destination |
| `create_itinerary_draft` | `destinationId`, `days`, `travelers`, `interests` | Construct initial day-wise draft plan | Synthesizes daily schedule combining matched inventory |
| `save_itinerary` | `title`, `destinationId`, `days`, `totalCost` | Persist generated itinerary to user profile | Inserts record into `itineraries` and `itinerary_days` tables |
| `request_booking_proposal` | `itineraryId`, `selectedItems` | Generate official booking proposal | Prepares pending booking and checkout link |

---

## 3. Itinerary Generation Engine

The Itinerary Generation Engine (`backend/src/services/itinerary.service.ts`) compiles comprehensive travel plans grounded in verified inventory.

### Day-Wise Itinerary Structure
Each day in the itinerary contains:
- **Date & Day Number**: Chronological sequence.
- **Morning Activity**: Timing, activity title, attraction details, pricing, and ticket availability.
- **Afternoon Activity**: Timing, highlights, activity description, and pricing.
- **Evening Activity / Leisure**: Sunset views, cultural shows, dinner spots, or relaxation.
- **Attraction Descriptions**: Rich historical and cultural context for key sites.
- **Estimated Travel Times**: Realistic transit estimates between sequenced attractions.
- **Suggested Meal Breaks**: Breakfast, lunch, and dinner recommendations highlighting local culinary specialties.
- **Practical Travel Notes**: Weather precautions, dress codes, recommended footwear, and local etiquette.

### Generation Workflow
```
[User Request] 
      │
      ▼
[Extract Destination & Dates] 
      │
      ▼
[Query Destination Attractions & Activities] 
      │
      ▼
[Cluster Attractions by Geographic Proximity] 
      │
      ▼
[Allocate Activities to Morning / Afternoon / Evening] 
      │
      ▼
[Enrich with Transit Times, Meal Stops, & Safety Notes] 
      │
      ▼
[Persist Day-Wise Records to PostgreSQL]
```

---

## 4. Budget Intelligence & Optimization

When a planned trip exceeds the user's stated budget, the Budget Intelligence Engine kicks in with automated optimization:

### Overrun Detection Algorithm
1. Calculates base cost $C_{\text{base}} = \text{Hotel} + \text{Activities} + \text{Taxes}$.
2. If $C_{\text{base}} > B_{\text{target}}$, flags overrun:
   $$\Delta = C_{\text{base}} - B_{\text{target}}$$
3. Evaluates components by price percentage to detect outlier expenses.

### Alternative Suggestion Strategy
1. **Hotel Substitution**:
   - Finds alternative hotels in the same destination with rating $\ge 4.0$.
   - Selects options where $(\text{Hotel}_{\text{orig}} - \text{Hotel}_{\text{alt}}) \times \text{nights} \approx \Delta$.
2. **Activity Adjustment**:
   - Replaces high-cost private experiences with high-value group activities in the same category.
3. **Net Savings Calculation**:
   $$\text{Savings} = C_{\text{original}} - C_{\text{optimized}}$$
   $$\text{Variance \%} = \frac{C_{\text{original}} - C_{\text{optimized}}}{C_{\text{original}}} \times 100$$
4. **Transparent Explanation**: Explains exactly what was swapped, why, and how much money was saved while preserving the core travel experience.

---

## 5. Security, Prompts & Invariant Guards

### Backend Proxy Isolation
- **No Client Exposure**: The Gemini API key (`GEMINI_API_KEY`) is stored strictly in backend environment variables and is never transmitted to the browser or logged.
- **Rate Limiting**: AI endpoints are rate-limited (`express-rate-limit`) to prevent abuse and API quota exhaustion.
- **Input Sanitization**: User inputs are stripped of malicious prompt-injection payloads prior to submission to Gemini.

### System Prompt Guardrails
The agent's system prompt enforces strict behavioral boundaries:
- **Zero Hallucination Policy**: Must only recommend destinations, hotels, and activities returned by the structured database tools.
- **Strict Currency Standard**: All prices are formatted in Indian Rupees (INR, ₹) for domestic travelers and converted to USD for PayPal checkout.
- **Truthful Availability**: If inventory is zero or dates are sold out, the agent must inform the traveler and offer the next best available date.
- **No Disparagement**: Maintains objective, helpful, and courteous tone at all times.
