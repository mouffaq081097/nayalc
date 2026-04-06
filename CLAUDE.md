# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (HTTPS on 0.0.0.0 with self-signed certs)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## What This Is

**Naya Lumière Cosmetics** — a luxury beauty/skincare e-commerce platform for the UAE market, featuring brands GERnétic, Zorah, and Naya Lumière Perfumes. Built with Next.js 15 App Router, PostgreSQL (Vercel Postgres), and no ORM (raw parameterized SQL).

## Architecture

### Provider Stack (app/Providers.js)
```
SessionProvider (NextAuth)
  → AuthProvider (login/register/logout + toasts)
    → UserProvider (user profile state)
      → AppProvider (global data: products, categories, orders, brands, concerns, loyalty)
        → CartProvider
          → HeaderProvider
```

`AppContext` is the central data hub — it fetches and caches all product/category/order data and exposes CRUD operations. Components consume this via `useApp()`.

### Authentication
- **NextAuth.js** with JWT strategy, credentials provider (email + password + bcrypt)
- Admin role is hardcoded: `email === 'mouffaq@nayalc.com'`
- Middleware (`middleware.js`) protects: `/api/users`, `/api/orders`, `/api/chat*`, `/api/admin`, `/api/payment-methods`
- Authenticated API calls go through `fetchWithAuth()` in `AppContext`, which uses the helper from `app/lib/api.js`

### Database
- **Vercel Postgres** connection pool via `lib/db.js` (`createPool()`)
- No ORM — raw SQL with parameterized queries everywhere
- Schema: users, products, brands, categories, orders, product_images, reviews, concerns, product_concerns, user_addresses, coupons, wishlist, loyalty data, and order lifecycle tables (delivered_orders, cancelled_orders, archived_orders)

### Key Integrations
| Service | Files |
|---|---|
| Stripe (payments) | `lib/stripe.js`, `/api/create-payment-intent`, `/api/webhook` |
| Cloudinary (images) | `lib/cloudinary.js` (server upload), `lib/cloudinaryClient.js` (URL gen) |
| Nodemailer (email) | `lib/mail.js` — welcome, order, chat, reset, invoice emails |
| Google Gemini (AI) | `/api/ai/chat`, `/api/ai/product-info`, `/api/ai/suggest` |
| Socket.io (real-time chat) | `/api/chat*`, `app/components/ChatWidget.js` |
| Google Maps | Product/store location features |

### Styling System
Tailwind CSS 4 with custom CSS variable-based colors defined in `tailwind.config.js` and `app/globals.css`.
Custom fonts: Cormorant Garamond (serif/luxury headings), Montserrat, Instrument Sans.
Radix UI primitives + Lucide icons + Framer Motion animations.

**Active design system: Cloud Luxe** — dreamy lavender-rose gradients, glassmorphism, glowing auras.

#### Cloud Luxe Design Tokens (`app/globals.css`)
| Token | Value | Usage |
|---|---|---|
| `--cl-purple` | `#9333ea` | Primary accent, buttons, active states |
| `--cl-pink` | `#db2777` | Secondary accent, gradient endpoint |
| `--cl-gradient` | `linear-gradient(135deg,#9333ea,#db2777)` | Buttons, badges, highlights |
| `--cl-bg` | `#fdf8ff` | Page background |
| `--cl-bg-lavender` | `#f8f0ff` | Section backgrounds |
| `--cl-bg-rose` | `#fff0f8` | Section backgrounds |
| `--cl-glass` | `rgba(255,255,255,0.72)` | Card backgrounds |
| `--cl-glass-border` | `rgba(216,180,254,0.35)` | Card borders |
| `--cl-text-deep` | `#3b0764` | Primary text, headings |
| `--cl-text-mid` | `#6b21a8` | Secondary text |
| `--cl-text-soft` | `#9333ea` | Labels, accents |
| `--cl-text-light` | `rgba(59,7,100,0.50)` | Body text |
| `--cl-aura-1` | `rgba(216,180,254,0.45)` | Lavender aura orbs |
| `--cl-aura-2` | `rgba(249,168,212,0.30)` | Rose aura orbs |

#### Cloud Luxe Tailwind Aliases
`text-cl-deep`, `text-cl-mid`, `text-cl-soft`, `text-cl-light`, `bg-cl-bg`, `bg-cl-bg-lavender`, `bg-cl-bg-rose`, `shadow-cl-card`, `shadow-cl-card-hover`, `shadow-cl-glow`, `shadow-cl-btn`, `animate-cl-aura-float`, `animate-cl-aura-float-slow`

#### Cloud Luxe Utility Classes (`globals.css`)
- `cl-glass-card` — frosted glass panel (bg, blur, border, shadow)
- `cl-gradient-text` — gradient purple→pink text
- `cl-gradient-btn` — gradient purple→pink button
- `cl-ghost-btn` — transparent button with lavender border
- `cl-aura` + `cl-aura-purple` / `cl-aura-rose` — glowing background aura orbs
- `hero-radial-cloud-luxe` — page/hero gradient mesh background

#### Brand Assets
- **Logo**: `public/Adobe Express - file (5).png` — use as `<Image>`, never text
- **Brand name**: Always "Naya Lumière Cosmetics" (full name including "Cosmetics")
- **Brands**: GERnétic, Zorah, Naya Lumière Perfumes

> Full design system reference: `.claude/skills/cloud-luxe.md`

### Route Structure
- `app/admin/` — Admin dashboard (products, categories, orders, chat, analytics)
- `app/account/` — User account area (dashboard, orders, wishlist, loyalty, addresses, settings)
- `app/collections/[categoryId]/` — Product collection pages
- `app/SkinCare/` — Skincare-specific landing
- `app/api/` — All backend API routes
- `app/auth/` — Login/register/reset-password pages

### Ongoing Roadmap (GEMINI.md)
Active development phases include: chat UI modernization, unified email design, admin portal improvements, multi-image product upload, dashboard redesign (Noon/Shopify style), UI/UX unification, auth fixes (forgot password), and "Shop by Concern" product categorization.
