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

### Product-specific discount codes
- `coupons.product_ids INTEGER[]` — NULL means the code applies to the entire order. The column is added on first use by `ensureCouponProductsColumn()` in `lib/couponRules.js` (also migration `012` in `/api/admin/migrate`).
- `lib/couponDiscount.js` `calcCouponDiscount(coupon, items)` is the single discount calculation, used by both `CartContext` and `POST /api/orders` so totals always match. A restricted code only discounts its products' lines; a fixed amount is capped at what those lines cost.
- `/api/coupons/validate` takes `productIds` from the cart and rejects a restricted code when none of its products are in the bag.
- Admin: "Applies to" card in `CouponEditor.jsx` with `ProductPicker.jsx`.

### Tabby orders
- Tabby offers several plans (4, 6, 12 months…) — never write "Pay in 4". Emails and invoices read the customer's plan with `fetchTabbyPlan(tabby_payment_id)` (`lib/tabby.js`; `installments_count` excludes the first payment, so 11 = 12 payments).
- Tabby's API reports statuses in capitals (`AUTHORIZED`, `CLOSED`), webhooks in lowercase. Always compare with `isTabbyPaid()` / `tabbyStatus()` from `lib/tabby.js`. (Comparing to lowercase strings rejected every Tabby payment, so no Tabby order was ever created automatically.)
- Order creation lives in `lib/placeOrder.js` (`placeOrder(payload)` → `{ status, body }`); `POST /api/orders` is a thin wrapper.
- `/api/tabby/checkout` saves the order details in `tabby_pending_orders` (keyed by Tabby payment ID) before the customer leaves. `completeTabbyOrder()` in `lib/tabbyOrders.js` creates the order from it, called by `/api/tabby/complete` (the `/tabby-return` page) and by the Tabby webhook. An advisory lock stops both creating it.
- Admin → Recover order supports Tabby (payment ID lookup, editable products, paid-vs-order difference). Admin → Payments → Tabby shows each payment's order, or "No order" with a Recover button.
- `tabby_payment_id` is copied to `delivered_orders` / `cancelled_orders` when archiving (`ensureTabbyPaymentColumns()`).
- Admin order page: "Discount code" card applies/removes a code on an open order (`POST /api/admin/orders/[orderId]/discount`, recalculates discount, total and VAT, adjusts usage counts), shows paid-on-Tabby vs order total, and resends the confirmation (`POST /api/admin/orders/[orderId]/send-confirmation`). Recover order also takes a discount code.
- Resend logic lives in `lib/orderConfirmation.js`; `sendOrderConfirmationEmail` returns `{ success }` instead of throwing, so check it.

### Homepage & product cards
- Section headers use `<SectionHeading>` (`app/components/home/SectionHeading.js`): a centred uppercase Montserrat title (`headingFont`), optional small lavender eyebrow and `tone="dark"` for black bands. Buttons are its `<Pill>` (`dark` outline, `light` outline on photos/black, `solid`). Sections are `py-14 md:py-24`; never hand-roll a header.
- Prices on cards go through `formatAED()` (`app/lib/utils.js`) — "AED 70", "AED 578.10", never "AED 578.1". Deterministic, so no hydration mismatch.
- Shipping facts come from `lib/shipping.js` only: `FREE_SHIPPING_FROM`, `TRANSIT_LABEL`, `getDeliveryInfo().rangeLabel` ("Tue 13 – Thu 15 Oct", 1–3 working days, no same-day cutoff at weekends). The courier is "our courier partners" — never name one in delivery promises. Once an order ships, the email and the account order pages do show the actual courier and a tracking link: always via `courierLabel()` / `trackingUrl()` in `lib/courier.js` (builds Aramex/DHL/FedEx/UPS links from the tracking number, else uses the saved link).
- Storefront chrome (after Pitaka): `Header.js` is Menu · centred logo (`/naya-logo-white.png`, `invert` when solid) · search/account/bag; the Menu button opens the drawer on every screen size. On `/` the header floats see-through over the hero (`#home-hero`) and turns white once the hero scrolls away; other pages get a white header and a spacer. Height is `HEADER_H` / `--header-h` (70px phone, 88px desktop) — offset fixed layouts by it (e.g. `AccountShell`). No promo bar; WELCOME10 lives in the welcome popup and the footer sign-up (`/api/subscribe`). `Footer.js` is black and opens with "Glow with Naya Lumière". Instagram link: `INSTAGRAM_URL` in `lib/seo.js`.
- Homepage layout (`app/page.js`) — rule: each brand photo is followed by that brand's products, and the shopping help sits with the skincare. Hero → free-shipping note, campaign, buy again, recently viewed (only when they apply) → `BestSellers` (4) → GERnétic `FeatureBanner` → `BrandProducts` GERnétic (up to 8) → `ShopByConcern` chips (`/all-products?concern=<slug>`) → routine → perfumes `FeatureBanner` (dark) → `BrandProducts` perfumes on black (`tone="dark"`) → `BrandPhotoBanner` Zorah (brand photo from Admin → Brands) → `BrandProducts` Zorah → rewards → journal (3 articles) → Instagram strip (6 posts) → footer. `BrandProducts` lists the whole active range, sold-out last, centred when short; hidden under 3 products.
- Hero (`HeroSection.js`): slides from Admin → Hero banner change every 7 s; hovering or using the arrows/dots pauses them, and the pause/play button after the dots stops both the slide changes and the video until pressed again. Visitors with reduced motion turned on start paused.
- `FeatureBanner` photos are homepage image slots (`lib/homepageImageSlots.js`, Admin → Homepage images), shown whole, never cropped: a wide desktop photo with the copy on its empty left side, and a portrait phone photo with the copy in a panel above it. `bg` / `mobileBg` match each photo's empty edge. Defaults live in `public/home/`.
- Homepage personal and campaign pieces: `FreeShippingNote` under the hero (only when the bag has items; counts items toward `FREE_SHIPPING_FROM`), `CampaignBanner` under the hero, then `BuyAgainShelf` (signed-in, `/api/users/[id]/buy-again`) and `RecentlyViewedShelf` (`useRecentlyViewed()`, browser storage). Personal rows map stored ids to live products so price and stock are current.
- Campaigns — `lib/campaigns.js` (DB) + `lib/campaignRules.js` (isomorphic): table `homepage_campaigns`, created on first use by `ensureCampaignsTable()` and by migration `016`. Admin → Homepage → Campaign banner (`/api/admin/campaigns`, photo upload via `/api/admin/campaigns/image`, own-Cloudinary URLs only). Times are entered in Dubai time (`dubaiInputToDate()`, fixed +04:00). `getActiveCampaign()` picks the live one ending soonest; `app/page.js` has `revalidate = 60` so a scheduled start shows within a minute, and the banner hides itself at the end time.
- Homepage palette: white, warm off-white panels (`#f6f5f2`) and black bands; ink (`#111114`) buttons and outlines; lavender only for tags (discount/pre-order), eyebrows, the bag count and the closing "Glow".
- Product grids and rows use `HomeProductCard` (`app/components/home/`): a portrait off-white panel (2:3 phone, 3:4 desktop) with the name (`cardName()` drops "by Gernetic:") and brand + flag top-left, tag top-right, photo centred, bag button bottom-left, price bottom-right; under it the same live facts as `ProductCard` — views this month from 5 up (`viewCountLabel()`), delivery range or pre-order date, "Only N left". `tone="dark"` recolours those facts on black. `ProductRow` is the swipe row (4 across desktop, 2 on phones).
- `ProductCard` (every product list: all products, collections, brands, Skincare, Fragrance, New arrivals, Offers, search, wishlist, related rows) uses the same panel design as `HomeProductCard`: one tag top-right (Sold out › Pre-order › discount › rank › Best seller › New), bag + wishlist buttons bottom-left (quick view and AI insights appear on hover), price bottom-right, live facts underneath. Stars only when a product has real reviews; origin as a small `FranceFlag`/`UAEFlag`. Homepage product rows skip items that can't be bought — out of stock with no pre-orders (`orderableQty()`); brand rows list them last as "Sold out".
- Listing page headers use `<ListingHeader>` (`app/components/ListingHeader.js`): with `image` a full-width photo + uppercase title (collections use the category photo, brands the brand photo), otherwise a white block with a centred uppercase title; `StoreHeader` (Skincare, Fragrance, New arrivals, Offers) wraps it and adds the AI specialist link. Sticky filter bars sit at `top-[var(--header-h)]`, below the fixed header.
- Side cart (`SideCart.js`, after Pitaka): plain white drawer — items (grey photo tile, trash, − qty +, old price struck through), "Remove all items" with an inline confirm, one best-seller recommendation at a time with + Add, "Have a discount code?" (`applyCoupon` from CartContext), free-delivery line, a Total that expands to subtotal / discount / delivery (`calcShipping`), a black Checkout button to `/checkout` and a "View full bag" link to `/cart`. Adding to the bag must pass `originalPrice` and `slug` so the cart can show them.
- Product page (`app/product/[productId]/ProductClient.js`, after Pitaka): desktop splits 55/45 — every photo stacked full-height on `#f6f5f2` on the left ("1 / N" on the first), a buying panel on the right that stays in view (`sticky top-[calc(var(--header-h)+32px)]`): breadcrumb, name, brand + origin, rating, price with −% tag, size chips, a foldable Overview, stock line, quantity + black Add to cart + wishlist, Tabby, delivery card, three promises. Phones keep `ProductGallery` (edge-to-edge swipe + thumbnails). Below: centred Details | Reviews | You may also like links, then details, bought-together, reviews and four `ProductCard`s. Colours and headings come from `_components/theme.js` (ink `BUTTON`, uppercase `SECTION_TITLE`).
- Reviews (`app/components/Reviews.js`, after Pitaka): centred title, average + black stars + 5→1 bar chart beside a black "Write a review" (signed-in only), sort (latest / highest / lowest) and rating filter, initials avatar + "Kareem D." name, relative date, 5 at a time with "Show more". Reviews have only rating, comment, date and username — no titles, photos or helpful votes.

### SEO — `lib/seo.js`
- Product JSON-LD is a plain `<script type="application/ld+json">` in the server render (`app/product/[productId]/page.js`). Never `next/script` for JSON-LD — it injects after load and Google doesn't see it.
- Titles/brand/description text for search go through `productTitle()`, `shortBrand()`, `plainText()` so the page, JSON-LD and feed agree.
- Google Merchant Center feed: `/feeds/google-merchant.xml` (active products with an image). No GTINs stored yet, so items carry `identifier_exists=no`.

### OTO shipping — `lib/oto.js`
- Admin order page → "Ship with OTO" (`POST /api/admin/orders/[orderId]/oto`) calls OTO `createOrder` with `createShipment: true` from `OTO_PICKUP_LOCATION_CODE`. COD orders (`payment_method = 'cashOnDelivery'`) go as `cod` with the total as `amount_due`.
- OTO reports progress to `/api/oto/webhook` (public; HMAC-SHA256 of `orderId:status:timestamp` with `OTO_WEBHOOK_SECRET`, fails closed). It fills `tracking_number`/`courier_name`/`courier_website`/`oto_awb_url`, and `siteStatusFor()` moves the order to Shipped/Delivered. OTO cancel/return statuses are only recorded — cancelling refunds, so that stays manual.
- Status changes go through `updateOrderStatus()` in `lib/orderStatus.js` — shared by the admin `PUT /api/orders/[orderId]` and the webhook. Never duplicate the archive/loyalty/refund logic.
- It returns `emailSent` / `emailError` for the customer's status email; the admin order page shows a failed send and offers "Resend status email" (`POST /api/admin/orders/[orderId]/send-status-email`, open orders only).
- Columns `orders.oto_id/oto_status/oto_awb_url/oto_updated_at` are added on first use (`ensureOtoColumns()`) and by migration `013`.
- Register the webhook once: `node scripts/oto-register-webhook.mjs https://nayalc.com`.

### Pre-orders (backorders) — `lib/backorders.js` + `lib/backorderRules.js`
- Per product: `allow_backorder`, `backorder_lead_days` (working days), `backorder_limit` (max units owed at once), set in the product editor's Inventory card. Columns added by `ensureBackorderColumns()` / migration `014`.
- `stock_quantity` is shelf stock and **never goes negative**. Units the shelf can't cover are stored as `order_items.backordered_qty`; the order gets `awaiting_stock = true` and `promised_ship_by` (from `getPreorderInfo()` in `lib/shipping.js`).
- Storefront rules (isomorphic) are in `lib/backorderRules.js`: `orderableQty()`, `preorderUnits()`, `isPreorderOnly()`. Product APIs add `BACKORDER_SELECT` (`backorderable` = units that may still be pre-ordered). Never compare `stock_quantity` alone to decide whether something can be bought.
- One parcel per order: OTO shipping and Shipped/Delivered are refused while `awaiting_stock`. Cash on delivery is refused for pre-orders (`placeOrder` and checkout).
- Raising stock calls `allocateStock()` (product PUT, cancellations), which gives units to the oldest owed lines first and releases orders that owe nothing, emailing the customer and the team. Cancelling returns only `quantity - backordered_qty` to the shelf.
- Daily Vercel cron `/api/cron/backorders` (needs `CRON_SECRET`) moves late orders' date forward by `BACKORDER_DELAY_DAYS` and emails an apology. Customers can cancel a waiting order from their account (`POST /api/orders/[orderId]/cancel`). Tabby refunds stay manual.
- Admin → Orders → Backorders (`/admin/backorders`) is the logistics view: units owed per product (the purchase list) and the orders waiting.

### Emails — `lib/email/theme.js` + `lib/mail.js`
Every email (customer, admin, marketing) renders through one layout, `renderEmail()` in `lib/email/theme.js`: grey page, white 600px card, optional purple PromoBar strip, logo + nav header (an "Admin" pill for internal mail), body, trust row + help footer. The palette mirrors the storefront (`T` tokens: ink text, `#9368ec` violet pills, gray-100 hairlines).
- Build emails from the components there: `intro`, `section`, `notice` (tones info/success/warning/danger/neutral), `infoTable`/`infoRow`, `lineItems`, `totals`, `tracker`, `button`/`buttonRow`, `panel`, `productGrid`, `recommendations`, `codeTicket`, `fallbackLink`, `signOff`. Never hand-roll a wrapper or `class="btn"`.
- Each email is a pure `buildXEmail()` → `{ subject, html }` plus a `sendXEmail()` that calls `deliver()`. Keep that split so it stays previewable.
- Preview all emails without DB/SMTP: `node scripts/preview-emails.mjs [dir]` → open `index.html`.
- Escape every interpolated value with `escapeHtml`; hrefs go through `safeUrl`. Never put `align="left"` on a layout table (it floats).
- `generateInvoiceHtml()` shares the tokens; COD invoices show "Due on delivery" until status is Delivered.

### Reports — `lib/productReport.js`
- Admin → Reports (`/admin/reports`): most viewed and most ordered products for a Dubai-time date range; "Download Excel" calls `GET /api/admin/reports/products?from&to&format=xlsx` (exceljs; sheets Summary / Most viewed / Most ordered / All products).
- Views come from `product_views` (storefront beacon, bots filtered; data starts 29 Aug 2026). Sales = open + delivered order lines at item prices, before order discounts; cancelled and "Payment Failed" are excluded.

### Purchasing (ERP) — `lib/erp/`
Admin → Purchasing: requisition (PR) → purchase order (PO) → goods received note (GRN) → costing. Tables are created on first use by `ensurePurchasingTables()` (`lib/erp/schema.js`) and by migration `015`.
- **Roles** (`lib/erp/roles.js`): requester, approver, buyer, storekeeper, finance, stored in `users.purchasing_roles TEXT[]` on top of `is_admin`. NULL = full access (every existing admin). Only full-access admins change roles (Purchasing → Team & roles). A role-limited approver can't approve their own PR.
- **Role-limited admins are "staff"**: `sessionRole()` in `lib/auth.js` gives them session role `'staff'`, not `'admin'`, so every existing `role === 'admin'` check refuses them. The middleware lets staff reach `/api/admin/purchasing` only. They open only `STAFF_PAGES` for their roles (the admin layout redirects everything else), and each purchasing read checks the same roles. An approver-only member sees just requisitions awaiting approval, plus the ones they decided. Admin and staff roles are re-read from the DB every minute in the `jwt` callback. A customer who is newly given access must sign out and in again.
- Every API route goes through `handle(fn)` in `lib/erp/access.js`, which reads the roles fresh from the DB. Check permissions with `requireRole(access, role)` and throw `PurchasingError(message, status)` for anything the user should see.
- POs are in the supplier's currency. The PO's `exchange_rate` is a planning estimate; the GRN's rate is what costing uses. A non-AED PO can't be sent at rate 1.
- **Posting a GRN** adds accepted units to `stock_quantity` at supplier price × GRN rate, blends that into `products.average_cost` (weighted average), then calls `allocateStock()` so pre-orders get the stock first. Rejected units stay outstanding on the PO. Posted GRNs can't be edited or reversed.
- **Finalising costing** spreads landed charges (freight, customs, bank, other; each with its own currency and rate, by value or quantity) with `costReceipt()` in `lib/erp/landedCost.js`. That function is pure and the GRN page uses it for the live preview. Only the share for units still on the shelf goes into the average cost; the rest is booked as `expensed_value` (it belongs in COGS).
- Every cost change is in `inventory_cost_ledger` (receipt / landed_cost / opening / adjustment). Stock from before purchasing gets an opening cost on the Costing page.
- PO PDF for suppliers: `GET /api/admin/purchasing/orders/[id]/pdf` (`lib/erp/purchaseOrderPdf.js`, pdfkit like the invoice).
- Lock products in ascending id order (`FOR UPDATE ... ORDER BY id`), as `placeOrder()` and `allocateStock()` do.

### Phone Numbers — `lib/phone.js`
Single source of truth for every phone number. UAE-only numbering plan, no dependencies, isomorphic (browser, API routes, emails, scripts).

- **Canonical storage shape is E.164**: `+971501234567`. Never store anything else; format at render time with `formatPhone()`.
- `parsePhone(input, { requireMobile = true })` → `{ ok, e164, national, display, whatsapp, tel, type, carrier, reason }`. `reason` is a customer-facing message.
- Handles: leading trunk zero after the country code (`+9710501234567`), doubled country code (`+971971…`), `00971`, Arabic-Indic digits (`٠٥٠…`), spaces/dashes/brackets.
- Rejects unassigned prefixes (051, 053, 057) — valid mobile prefixes are 50, 52, 54, 55, 56, 58.
- Landlines are rejected for delivery contacts by default; pass `requireMobile: false` for display/`tel:` helpers.
- `toNsn()` / `formatAsYouType()` are for input-box state — they hold the bare 9 national digits.
- Validation runs **both** in the form and in the API route; the route is the last gate before the column.
- Backfill existing rows: `node scripts/normalize-phones.mjs` (dry run) / `--apply`. Rows it cannot parse are listed rather than guessed at, and `<PhoneNeedsCheck>` flags them in the admin.

### Known Gotchas
- `fetchWithAuth` must come from `useAppContext()` — do NOT import from `lib/api.js` (that file exports `createFetchWithAuth` factory, not a ready-to-use function).
- `addToCart(product, quantity)` takes two separate args — NOT a single `{ product, quantity }` object.
- APIs (`/api/products/suggestions`, buy-again) return `stockQuantity` (camelCase); CartContext reads `stock_quantity` (snake_case). Always normalize: `{ ...product, stock_quantity: product.stockQuantity || product.stock_quantity }` before calling `addToCart`.
- Never hand-roll phone parsing. `internationalPhone()` in `app/admin/_components/phone.js` is now a re-export of `toWhatsApp()` and returns **null** for unusable numbers (it used to return a wrong-but-plausible number). Call sites already guard on falsy.
- Email CSS must be email-safe: no `backdrop-filter`, no CSS variables, no Tailwind — use embedded `<style>` tags and inline styles only. Use `Georgia` for serif/italic fallback.
