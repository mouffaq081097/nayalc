# Profile Page — Split Hero Redesign

**Date:** 2026-04-18  
**Status:** Approved  
**File:** `app/account/profile/page.js`

---

## Context

The current profile page is a standard single-column form inside a glass card — functional but generic. For a luxury UAE beauty brand (Naya Lumière Cosmetics), the account area should feel as premium as the storefront. The redesign adopts a **Split Hero** layout that elevates the user's identity (avatar, tier, loyalty) to a persistent left panel, turning a utility page into a personal sanctuary experience.

---

## Layout

### Desktop (md and above)

Two-column split:

```
┌──────────────────────────────────────────────────────────┐
│  LEFT PANEL (260px fixed)  │  RIGHT PANEL (flex 1)       │
│  white glass               │  #fdf8ff background          │
│                            │                              │
│  · Avatar (initials)       │  Eyebrow + "Personal         │
│  · Full name               │  details" heading            │
│  · Email (small, muted)    │                              │
│  · Tier badge              │  ── Personal info ──         │
│  · Divider                 │  [ First name ] [ Last name ]│
│  · Points  |  Orders       │                              │
│  · Brand quote (italic)    │  ── Contact ──               │
│  · Mini nav                │  [ Email — read only ]       │
│    Dashboard               │  [ Phone number ]            │
│    Profile ← active        │                              │
│    Orders                  │  [ Save changes ] [ Discard ]│
│    Wishlist                │                              │
│    Loyalty                 │                              │
└──────────────────────────────────────────────────────────┘
```

### Mobile (below md)

Stacked:
1. `AccountMobileTopBar` — existing back button + "My Profile" title
2. **Identity bar** — white glass, horizontal: small avatar + name + tier + loyalty points in one row
3. **Form** — Personal info group (first + last in 2-col grid), Contact group (email read-only, phone), full-width save button

---

## Components

### Left Panel
- **Avatar circle**: initials from `user.first_name[0]`, `linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))`, 84px desktop / 52px mobile identity bar, `box-shadow: 0 8px 28px rgba(147,104,236,0.35)`, white border
- **Tier badge**: icon + "Gold Member" text, `rgba(196,167,254,0.18)` bg, lavender border, pill shape
- **Stats row**: Points (from loyalty data) + Orders count (from orders data) — pulled from existing `useAccountData` hook
- **Brand quote**: `"Luxury is in each detail."` — italic, muted `rgba(59,7,100,0.45)`
- **Mini nav**: 5 items (Dashboard, Profile, Orders, Wishlist, Loyalty) — active item highlighted with `rgba(196,167,254,0.15)` bg + `rgb(126,105,230)` text/icon. Uses `setAccountNavDirection` + `router.push` (same pattern as `AccountMenuList`)

### Right Panel — Form
- **Section eyebrow**: gradient line + "MY PROFILE" label (existing `AccountSectionTitle` pattern)
- **Field groups**: labeled with `group-label` style (same as other account pages)
- **Field grid**: 2-col for first/last name, full-width for email + phone
- **Fields**: `rgba(255,255,255,0.85)` bg + `rgba(216,180,254,0.4)` border + `border-radius: 10px`
- **Email field**: read-only, value shown in muted italic with "· Read only" note
- **Save button**: soft lavender gradient `rgb(196,167,254) → rgb(126,105,230)`, pill, `font-black uppercase tracking-widest`
- **Discard button**: ghost, `border: 1.5px solid rgba(216,180,254,0.5)`, lavender text

---

## Style Tokens

| Element | Value |
|---|---|
| Left panel bg | `rgba(255,255,255,0.95)` |
| Left panel border | `1px solid rgba(216,180,254,0.25)` |
| Field bg | `rgba(255,255,255,0.85)` |
| Field border | `1px solid rgba(216,180,254,0.4)` |
| Field border-radius | `10px` |
| Avatar gradient | `linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))` |
| Save button | `linear-gradient(135deg, rgb(196,167,254), rgb(126,105,230))` |
| Active nav item bg | `rgba(196,167,254,0.15)` |
| Page background | `#fdf8ff` (`--cl-bg`) |

---

## Data Sources

| Data | Source |
|---|---|
| `user.first_name`, `user.last_name`, `user.email`, `user.phone_number` | Fetched from `/api/users/${user.id}/profile` on mount (existing) |
| Loyalty points | `useAccountData()` → `loyaltyData.points` |
| Orders count | `useAccountData()` → `orders.length` |

---

## No-Conflict Notes

- `AccountMenuList` is `md:hidden` — only shown on the `/account` index page on mobile. No overlap with the profile page's left panel.
- The left panel's white glass style (`rgba(255,255,255,0.95)` + lavender border) is intentionally consistent with the account menu card glass style (`rgba(255,255,255,0.72)`).
- The mini nav in the left panel uses the same routing pattern as `AccountMenuList` (`setAccountNavDirection` + `router.push`).

---

## Verification

1. `npm run dev` — navigate to `/account/profile` logged in
2. **Desktop**: Confirm left panel is visible, mini nav highlights "Profile" as active, stats show real points + orders count
3. **Mobile**: Confirm left panel is hidden, identity bar shows at top, form is scrollable
4. **Save flow**: Edit first name → save → confirm API call succeeds and name updates
5. **Nav links**: Click "Orders" in mini nav → confirm navigates to `/account/orders` with correct animation direction
6. **Read-only email**: Confirm email field is not editable
7. **Discard**: Confirm resets form to fetched values
