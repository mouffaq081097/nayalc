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

### Route Structure (expanded)
- `app/account/orders/[orderId]/page.js` — Order detail page (items, shipping, payment, status timeline)
- `app/account/addresses/[addressId]/page.js` — Address detail page (read-only map, edit/delete)

### Ongoing Roadmap (GEMINI.md)
Active development phases include: chat UI modernization, admin portal improvements, multi-image product upload, dashboard redesign (Noon/Shopify style), and "Shop by Concern" product categorization.

---

## Completed Work Log

### Cloud Luxe Lavender Theme — Account Pages
- **`app/account/page.js`**: Letter-spacing fixed on tier/loyalty labels (`tracking-[0.3em]` → `tracking-[0.12em]`); orders tab rows wrapped in `<Link>` to detail pages; Modal size set to `max-w-3xl` for address form.
- **`app/account/_components/AccountSectionTitle.js`**: Eyebrow tracking fixed; accent line gradient → lavender.
- **`app/account/_components/AccountMenuList.js`**: Same tracking fix; gradient and active color → lavender.
- **`app/account/dashboard/page.js`**: Shop Now button gradient → lavender; "Silver Member" tracking → `tracking-[0.12em]`.
- **`app/account/orders/page.js`**: Full rewrite — each order row is a `<Link href="/account/orders/${order.id}">` with lavender arrow; tracking-widest labels fixed.
- **`app/account/addresses/page.js`**: Address cards link to detail page; Add/Edit button gradients → lavender; "Primary" badge tracking fixed; Modal `size="max-w-3xl"`.
- **`app/account/loyalty/page.js`**: Tier dot gradient and "Current" badge → lavender.
- **`app/account/wishlist/page.js`**: Add-to-cart button gradient → lavender.
- **`app/account/orders/[orderId]/page.js`** *(new)*: Order detail page — fetches `/api/orders/${orderId}` via `fetchWithAuth` from `useAppContext()`; shows items, shipping address, payment info, status timeline with lavender gradient dots.
- **`app/account/addresses/[addressId]/page.js`** *(new)*: Address detail page — reads from UserContext `shippingAddresses`; shows read-only MapPicker, glass info card, Edit/Delete buttons; Edit opens Modal with AddressInputForm.

### Cloud Luxe Lavender Theme — Shared Components
- **`app/components/Modal.js`**: Full rewrite — lavender glass background (`rgba(248,240,255,0.98)`), lavender border, lavender accent bar, reduced padding (`p-6 md:p-7`), `size` prop for max-width control, removed "Operational Protocol" language.
- **`app/components/AddressInputForm.js`**: Full rewrite — 2-column desktop layout (left: fields, right: map); all `var(--brand-pink)`/`var(--brand-blue)` replaced with lavender values; Save button → lavender gradient; Cancel → lavender ghost.
- **`app/components/BuyAgainSection.js`**: Bug fix — `addToCart` was called as `addToCart({ product, quantity })` (wrong); corrected to `addToCart(normalized, 1)`. Also normalizes `stockQuantity` (API camelCase) → `stock_quantity` (CartContext snake_case). Full lavender glass card design.
- **`app/components/PairItWithSection.js`**: Same add-to-cart bug fix and `stockQuantity` normalization. 2×4 grid layout with lavender glass cards and hover overlay.

### Cloud Luxe Lavender Theme — Cart & Checkout
- **`app/cart/page.js`**: Full remaster — `#fdf8ff` background, lavender aura orbs, sticky lavender header, item cards with `rgba(248,240,255,0.8)` image backgrounds, lavender qty controls, lavender shipping progress bar, lavender coupon input, lavender CTA button.
- **`app/checkout/page.js`**: Full remaster — lavender step progress indicators, lavender address/payment selection states, lavender gift wrap row, lavender mobile sticky CTA bar, address modal `size="max-w-3xl"`.

### Email Templates — Cloud Luxe Lavender Theme
- **`lib/mail.js`**: Full rewrite covering all 8 automatic email types + invoice:
  - Logo: changed from `favicon.jpeg` to `https://nayalc.com/Adobe%20Express%20-%20file%20(5).png`
  - Brand header: two-line "NAYA" (bold uppercase `#3b0764`) + "Lumière Cosmetics" (Georgia italic `#6b21a8`) — matches navbar
  - `emailWrapper()`: `#fdf8ff` background, lavender gradient accent bar, `rgba(216,180,254,0.35)` container border, lavender buttons (`linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))`), `#f8f0ff` summary boxes + footer, lavender table headers, lavender footer links
  - Fixed 3 inline color references: discount text, chat quote border-left, order status color
  - `generateInvoiceHtml()`: fully lavender-themed invoice — accent bar, two-line brand header, lavender table headers, lavender totals row

### Cloud Luxe Lavender Theme — Admin Portal
- **`app/admin/orders/[orderId]/page.js`**: Full rewrite — lavender card borders (`border-purple-100`), lavender section headers (`text-purple-700` on `bg-purple-50/40`), lavender ghost button for "Export invoice", gradient primary button (`linear-gradient(135deg,#9333ea,#db2777)`), plain readable labels (no `tracking-[0.4em]`), sentence-case text throughout.

#### Admin Page Design Standards (apply to ALL admin pages)
- **No extreme tracking**: Never use `tracking-[0.3em]` or `tracking-[0.4em]` — use `tracking-wide` at most.
- **Sentence case only**: Labels, section titles, and button text use sentence case (first letter capital, rest lowercase). No ALL CAPS.
- **Lavender cards**: Admin cards use `border-purple-100`, section headers use `bg-purple-50/40` with `text-purple-700`.
- **Buttons**: Primary action = `linear-gradient(135deg,#9333ea,#db2777)` white text. Secondary/outline = `border-purple-200 text-purple-600 hover:bg-purple-50`. No invisible gray buttons.
- **Labels**: Use `text-xs font-medium text-purple-400` for field labels — never `text-gray-300` (too faint).
- **Plain terminology**: Use plain English — "Order items" not "Acquired Masterpieces", "Shipping address" not "Logistics Hub", "Order summary" not "Market Analysis", "Email" not "Direct Portal", "Save status" not "Commit State Update".
- **Reduced spacing**: `space-y-5` or `space-y-6` for sections, `p-6` for card padding — not `space-y-10` or `p-10`.

### Known Gotchas
- `fetchWithAuth` must come from `useAppContext()` — do NOT import from `lib/api.js` (that file exports `createFetchWithAuth` factory, not a ready-to-use function).
- `addToCart(product, quantity)` takes two separate args — NOT a single `{ product, quantity }` object.
- APIs (`/api/products/suggestions`, buy-again) return `stockQuantity` (camelCase); CartContext reads `stock_quantity` (snake_case). Always normalize: `{ ...product, stock_quantity: product.stockQuantity || product.stock_quantity }` before calling `addToCart`.
- Email CSS must be email-safe: no `backdrop-filter`, no CSS variables, no Tailwind — use embedded `<style>` tags and inline styles only. Use `Georgia` for serif/italic fallback.
