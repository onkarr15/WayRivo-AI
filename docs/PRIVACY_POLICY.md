# WayRivo AI 2.0 — Privacy Policy Documentation

> **Status:** Draft Platform Specification & Architectural Privacy Reference  
> **Last Updated:** November 6, 2026  
> **Applicable Routes:** `/privacy-policy`, `/privacy`  
> **Notice:** *This policy reflects the actual technical implementation, data schemas, and integration flows of WayRivo AI 2.0. Prior to public production deployment, this document and its corresponding web page must be reviewed and finalized by qualified legal counsel.*

---

## 1. Document Overview

WayRivo AI 2.0 is an autonomous travel planning and reverse-marketplace platform. This document sets out how user data, travel inquiries, authentication credentials, and transactional information are gathered, stored, processed, and safeguarded across the application ecosystem.

---

## 2. Verified Technical Architecture & Data Practices

### 2.1 Database & Data Storage (Supabase PostgreSQL)
* **Provider:** Supabase Managed PostgreSQL (`DATABASE_URL`, `DIRECT_URL`)
* **ORM:** Prisma Client (`prisma/schema.prisma`)
* **Encryption in Transit:** Enforced TLS 1.3 / SSL (`sslmode=require`)
* **Encryption at Rest:** Managed AES-256 block-level disk encryption
* **Key Entities Stored:**
  - `User`: Primary identifier, email, bcrypt-hashed password, name, role (`USER`, `TRAVELER`, `EXPERT`, `ADMIN`), phone number, avatar URL, travel interests, preferred currency.
  - `OAuthAccount`: Google subject identifier (`sub`), linked user ID, authentication provider.
  - `TripRequest` / `Itinerary`: Destinations, tentative dates, budget, duration, travel style, interests, special requirements, and full traveler rosters (`travelers` array: Name, Gender, Age, Phone, Email).
  - `Booking`: Booking reference, status, total cost, currency, escrow release date.
  - `Payment`: PayPal order ID, capture ID, payer email, payer name, payer ID, escrow hold state, idempotency keys.
  - `Conversation` & `Message`: Chat history between travelers, AI assistants, and destination specialists.
  - `AuditLog`: Action tracking for operational traceability and security compliance.

### 2.2 User Authentication & Credentials
* **Email & Password Authentication:**
  - Passwords are **never** stored in plaintext.
  - Encrypted using `bcrypt` with **10 salt rounds**.
  - Password reset tokens use cryptographically random hex strings with 60-minute expiration windows.
* **Google OAuth 2.0:**
  - Authorization Code Flow with **PKCE (S256 code challenge and code verifier)**.
  - Anti-tampering signed state tokens via `crypto.createHmac('sha256', JWT_SECRET)`.
  - Only public profile info (name, email, avatar, Google `sub`) is retrieved; Google passwords are never touched or accessible.
* **Session Management:**
  - Signed JSON Web Tokens (JWT) using HMAC-SHA256 (`JWT_SECRET`).
  - Access tokens stored in client `LocalStorage` or HttpOnly cookies.

### 2.3 Travel Data & Traveler Rosters
* **Trip Creation Pipeline (`/traveler/create-trip`):**
  - Origin city, destination, travel dates, budget, group type, and style preferences.
  - **Traveler Roster:** Captures full name, gender, age, phone number, and email address for all travelers in the traveling party.
  - **Usage Scope:** Shared exclusively with the destination expert selected and confirmed by the traveler for issuing tickets, reserving accommodations, and local permit registration.

### 2.4 Payment & Escrow Processing (PayPal Integration)
* **Provider:** PayPal Holdings, Inc. via PayPal Orders v2 REST API (Sandbox / Production).
* **Payment Credentials Disclaimer:** WayRivo AI **does not** collect, transmit, or store raw credit or debit card numbers, card expiration dates, CVV/CVC codes, or PayPal account login passwords.
* **Escrow Holding State:** Funds are captured into WayRivo Escrow and locked (`HELD`) until itinerary delivery milestones are fulfilled.
* **Refunds:** Triggered via the official PayPal Refund API directly back to the original funding source.

### 2.5 Artificial Intelligence & Google Gemini API
* **Provider:** Google Cloud Generative Language API (`gemini-1.5-flash` or configured Gemini model).
* **Data Transmitted to AI:** Destination name, duration in days, budget amount, group size, travel style, and activity tags.
* **AI Terms:** Data transmitted to the Gemini API is subject to Google Cloud’s Generative AI terms and Google’s Privacy Policy. WayRivo does not send passwords, bank details, or government IDs to AI endpoints.

---

## 3. Privacy Policy Sections Displayed on the Website (`/privacy-policy`)

The public `/privacy-policy` web page displays 21 structured sections with an interactive desktop and mobile table of contents:

1. **Introduction** — Platform overview, scope, and effective date.
2. **Information We Collect** — Categorization of direct, automatic, and third-party inputs.
3. **Personal Information** — Identity and contact records.
4. **Account and Authentication Information** — Password hashing (bcrypt), Google OAuth 2.0 with PKCE, and JWT sessions.
5. **Travel and Booking Information** — Trip requests, group parameters, and detailed traveler rosters.
6. **Payment Information** — PayPal Orders v2, escrow metadata, and PCI-DSS compliance clarification.
7. **AI-Powered Services and Gemini Integration** — Gemini prompt handling and Google Cloud AI policies.
8. **Cookies and Similar Technologies** — Essential session tokens and UI state caching (no advertising trackers).
9. **How We Use Your Information** — Itinerary synthesis, expert matching, payment custody, and security audits.
10. **How We Share Your Information** — Disclosures to selected experts, payment gateways, and legal authorities (zero data selling).
11. **Third-Party Services** — Supabase, PayPal, Google Cloud, and Google OAuth.
12. **PayPal Payment Processing** — Escrow mechanics, Buyer Protection, and refund workflows.
13. **Supabase Database and Data Storage** — PostgreSQL clustering, TLS 1.3 encryption, and Prisma isolation.
14. **Data Security** — Salted hashing, RBAC enforcement, Zod schema validation, and vulnerability disclosures.
15. **Data Retention** — Retention schedules for accounts (active), bookings (7 years for tax/audit), and logs (12 months).
16. **User Rights and Data Access** — Access, rectification, data portability, and restriction procedures.
17. **Account Deletion** — Account closure workflow via `support@wayrivo.com` within 30 days.
18. **Children’s Privacy** — 18+ platform policy and minor data collection via guardian consent.
19. **International Data Transfers** — Cross-border cloud data center safeguards (SCCs, TLS).
20. **Changes to This Privacy Policy** — Modification notices and version updates.
21. **Contact Information** — Official verified support channels.

---

## 4. Verified Project Contact Points

* **General & Privacy Inquiries:** `support@wayrivo.com`
* **Telephone Support:** `+91 98765 43210` (Monday – Saturday, 9:00 AM – 7:00 PM IST)
* **Physical Registered Address:** *[Configuration Item: Pending legal entity incorporation / registered office address confirmation]*
* **Data Protection Officer (DPO):** *[Configuration Item: To be appointed upon enterprise scaling / regulatory filing threshold]*

---

## 5. Items Requiring Confirmation Prior to Production Launch

| Configuration Item | Current Status | Required Action Before Live Launch |
|---|---|---|
| Registered Legal Entity Name | WayRivo AI (Project Name) | Insert formal corporate entity name (e.g., WayRivo Technologies Pvt. Ltd. / LLC) |
| Physical Office Address | Unset (Cloud-based development) | Insert physical legal mailing address for statutory notices |
| Formal DPO Contact | Handled via `support@wayrivo.com` | Appoint and list formal DPO if mandatory under GDPR / DPDP Act |
| Jurisdiction / Governing Law | Configurable (India / Delaware) | Specify definitive governing law and dispute jurisdiction |
| Cookie Consent Banner | Essential cookies only | Add explicit opt-in banner if third-party analytics (e.g. GA4) are added |

---

*This document is maintained as part of the official WayRivo AI 2.0 codebase.*

