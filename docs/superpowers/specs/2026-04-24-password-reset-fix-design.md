# Password Reset Fix — Design Spec
**Date:** 2026-04-24  
**Status:** Approved  
**Scope:** Two independent fixes — token replay vulnerability + Cloud Luxe styling on reset page

---

## Problem Summary

1. **Security gap**: The reset token is a stateless JWT with no invalidation mechanism. An attacker who intercepts the link can reuse it to overwrite the password again at any point within the 1-hour expiry window.
2. **Stale styling**: `app/auth/reset-password/page.js` still uses the old pink/black aesthetic (`bg-black hover:bg-brand-pink`, `text-brand-pink`) instead of the Cloud Luxe lavender system used everywhere else.

---

## Section 1 — Security Fix (Token Self-Invalidation)

### Approach
Bind the JWT to the user's current password hash at issuance time. No schema migration required.

### How it works

**Token issuance (`/api/auth/forgot-password/route.js`)**
- After fetching the user from the DB, read their `password_hash`
- Take the first 16 characters as `pwdHash`
- Include `pwdHash` as an additional field in the JWT payload alongside `userId` and `email`

**Token verification (`/api/auth/reset-password/route.js`)**
1. Verify JWT signature and expiry (existing)
2. Fetch the user's *current* `password_hash` from the DB using `payload.userId`
3. Check `currentHash.startsWith(payload.pwdHash)` — if false, return `401 Invalid or expired reset token`
4. If true, proceed to hash and save the new password (existing)

**Self-invalidation property**: Once the password is reset, `password_hash` changes. Any subsequent attempt with the same token fails the prefix check at step 3. The token is cryptographically dead without any DB state.

### Files changed
- `app/api/auth/forgot-password/route.js` — add `pwdHash` to JWT payload
- `app/api/auth/reset-password/route.js` — add DB re-fetch + prefix check before updating password

---

## Section 2 — Cloud Luxe Styling (`/auth/reset-password/page.js`)

### Changes

| Element | Before | After |
|---|---|---|
| Submit button background | `bg-black` | soft lavender gradient `from-[rgb(216,180,254)] to-[rgb(147,104,236)]` |
| Submit button hover | `hover:bg-brand-pink` | removed (gradient handles it) |
| Submit button text style | `font-bold text-[14px]` | `font-black uppercase tracking-widest` |
| Loader icon color | `text-brand-pink` | `text-purple-400` |
| Input focus border | `focus:border-brand-pink` | `focus:border-purple-300` |
| Input focus ring | `focus:ring-brand-pink/5` | `focus:ring-purple-100` |
| "Back to Sign in" link | `text-brand-pink` | `text-[rgba(107,33,168,0.5)] hover:text-[#9333ea]` |
| Success icon circle | `bg-green-50 / text-green-500` | unchanged (universal success color) |
| Page wrapper / background | `#FAF9F6` + paper texture | unchanged (standalone page) |

### Files changed
- `app/auth/reset-password/page.js` — replace all `brand-pink` and `bg-black` references with Cloud Luxe equivalents

---

## Edge Cases
- **Null password_hash**: If a user account has no `password_hash` (e.g. created via OAuth and never set a password), the forgot-password route must detect `null` hash and return the standard "If an account exists, a reset link has been sent" response without attempting to include `pwdHash` in the token — preventing a crash and not leaking account type.

## Out of Scope
- Adding a `password_reset_tokens` DB table (not needed with Option B)
- Rate-limiting the forgot-password endpoint (separate concern)
- Testing the email delivery in staging (environment-level, not code)
