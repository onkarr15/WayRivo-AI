# WayRivo AI: Secure Password Reset System Architecture & Deployment Guide

This document describes the enterprise-grade, NIST SP 800-63B compliant password recovery system implemented for **WayRivo AI**.

---

## 1. Architecture Overview

```
[User Browser]
      │
      │ 1. Submits Email
      ▼
[Frontend: ForgotPasswordPage]
      │
      │ 2. POST /api/v1/auth/forgot-password
      ▼
[Backend: AuthService]
      │
      ├─ 3. Anti-Enumeration: Normalize email, look up user
      ├─ 4. Generate 32-byte cryptographically secure random token (Node.js crypto)
      ├─ 5. Compute SHA-256 hash: tokenHash = sha256(rawToken)
      ├─ 6. Store ONLY tokenHash in Supabase DB with 15-minute expiration
      ├─ 7. Invalidate any existing unused tokens for this user
      ├─ 8. Dispatch transactional email with reset link via Resend SDK
      │      URL: https://<frontend-url>/reset-password?token=<rawToken>
      │
      ▼
[User Inbox]
      │
      │ 9. User clicks secure link
      ▼
[Frontend: ResetPasswordPage]
      │
      ├─ 10. Extract token from URL & remove from browser address bar (window.history.replaceState)
      ├─ 11. Apply <meta name="referrer" content="no-referrer">
      ├─ 12. POST /api/v1/auth/verify-reset-token (Verify validity without consuming)
      │
      ▼
[User Submits New Password]
      │
      │ 13. POST /api/v1/auth/reset-password
      ▼
[Backend: Transactional Consumption]
      │
      ├─ 14. Check password policy (12-128 chars, non-compromised)
      ├─ 15. Atomically in Prisma Transaction:
      │       a. Hash token and verify unexpired & unused
      │       b. Hash new password with bcrypt (10 rounds)
      │       c. Update user.passwordHash
      │       d. Increment user.tokenVersion (+1) -> IMMEDIATELY revokes all prior JWT sessions
      │       e. Mark current token used (usedAt = now())
      │       f. Invalidate any other outstanding reset tokens for user
      │       g. Write security audit log entry
      │
      ▼
[Frontend: Success Screen & Redirect to Login]
```

---

## 2. Database Schema

### `PasswordResetToken` Model

Added to [schema.prisma](file:///d:/WayRivo_Hackathon/backend/prisma/schema.prisma):

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  // Relations
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
}
```

### `User` Model Session Revocation Field

```prisma
model User {
  // ... existing fields ...
  tokenVersion           Int                  @default(0)
  passwordResetTokens    PasswordResetToken[]
}
```

- **`tokenVersion`**: Stored in the signed JWT payload. When a password is reset or changed, `tokenVersion` is incremented. The `authenticate` middleware compares `jwtPayload.tokenVersion < user.tokenVersion` and immediately invalidates active sessions across all devices.

---

## 3. REST API Endpoints

All endpoints support both `/api/v1/auth/...` and `/api/auth/...`.

### 1. Request Password Reset Link
- **Endpoint**: `POST /api/v1/auth/forgot-password`
- **Rate Limit**: Applied via `authRateLimiter`
- **Request Body**:
  ```json
  {
    "email": "traveler@example.com"
  }
  ```
- **Response** (`200 OK` - Identical response for registered and unregistered accounts):
  ```json
  {
    "success": true,
    "message": "If an account exists with this email address, you will receive password reset instructions shortly."
  }
  ```
- **Security Rule**: The raw token is **never** returned in the response and **never** stored in the database.

---

### 2. Verify Reset Token (Non-Destructive)
- **Endpoint**: `POST /api/v1/auth/verify-reset-token`
- **Rate Limit**: Applied via `authRateLimiter`
- **Request Body**:
  ```json
  {
    "token": "4a2b91c8...64-char-hex..."
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "valid": true,
    "message": "Password reset link is valid."
  }
  ```
- **Error Response** (`400 Bad Request`):
  ```json
  {
    "success": false,
    "error": "This password reset link is invalid or has expired."
  }
  ```
- **Security Rule**: Does not mark the token as used; consumption occurs only upon submitting a new password.

---

### 3. Submit New Password
- **Endpoint**: `POST /api/v1/auth/reset-password`
- **Rate Limit**: Applied via `authRateLimiter`
- **Request Body**:
  ```json
  {
    "token": "4a2b91c8...64-char-hex...",
    "newPassword": "MySecurePassphrase2026!"
  }
  ```
- **Password Policy Enforcement**:
  - Minimum 12 characters, Maximum 128 characters.
  - Rejects blocklisted passwords (e.g. `password123456`, `qwerty123456`).
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Password reset successfully. You may now log in with your new password."
  }
  ```
- **Security Rule**: Executed inside an atomic database transaction. Any concurrent race attempts are rejected.

---

## 4. Email Delivery with Resend

### Setup Instructions

1. **Create an Account**:
   - Go to [https://resend.com](https://resend.com) and create an account.
2. **Generate an API Key**:
   - Navigate to **API Keys** -> **Create API Key**.
   - Copy key (starts with `re_...`).
3. **Sender Configuration**:
   - **Sandbox / Development**: You can immediately use `WayRivo AI <onboarding@resend.dev>` to send emails to the email address registered on your Resend account.
   - **Production (Render)**: Navigate to **Domains** on Resend, add your domain (e.g. `wayrivo.com`), add the DKIM/SPF DNS records, and update `EMAIL_FROM="WayRivo AI <auth@wayrivo.com>"`.

---

## 5. Environment Variables

### Backend Configuration (.env)

```ini
# Server & Frontend Origins
FRONTEND_URL="http://localhost:5173"

# Transactional Email (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="WayRivo AI <onboarding@resend.dev>"
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=15
```

### Vercel Deployment Configuration

| Key | Example Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://wayrivo-api.onrender.com/api/v1` | Production backend base URL |

### Render Deployment Configuration

| Key | Example Value | Description |
|---|---|---|
| `FRONTEND_URL` | `https://wayrivo.vercel.app` | Base URL used to construct the reset link |
| `RESEND_API_KEY` | `re_1234567890abcdef...` | Resend Production API Key |
| `EMAIL_FROM` | `WayRivo AI <auth@yourdomain.com>` | Verified sender address |
| `PASSWORD_RESET_TOKEN_EXPIRY_MINUTES` | `15` | Reset token lifetime in minutes |

---

## 6. Automated Verification

Execute the automated test suite locally:

```bash
# Run the complete password reset test suite (31 automated assertions)
npx --prefix backend tsx backend/test-password-reset.ts
```

All 16 test scenarios are verified:
- [x] Valid registered email (anti-enumeration response, SHA-256 hash in DB, raw token hidden)
- [x] Unregistered email (identical response)
- [x] Password policy (<12 chars rejected, blocklisted passwords rejected)
- [x] Token verification (valid token confirmed without consuming)
- [x] Tampered / invalid token rejected
- [x] Expired token rejected
- [x] Already-used token rejected
- [x] Weak password rejected on reset endpoint
- [x] Successful reset with bcrypt hash update
- [x] Token reuse prevention (single-use)
- [x] Invalidation of older outstanding tokens
- [x] Session revocation (prior JWT rejected with 401 via `tokenVersion`)
- [x] Old password fails login
- [x] New password succeeds login
- [x] Concurrent reset race condition protection (atomic transaction)
- [x] Safe error handling & token invalidation on email delivery failure

