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
- **Phones**: the admin shell is `h-[100dvh]` (not `h-screen`, which hides the bottom under the phone browser's bar); the top bar drops the search box under `sm` and shrinks the logo. Under 768px every table in `.sp-admin main` scrolls sideways inside its card (`globals.css`), so wide tables never push the page off-screen — still give new multi-column layouts a phone fallback (`grid-cols-1 sm:grid-cols-2`, `flex-wrap`).

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
- Section headers use `<SectionHeading>` (`app/components/home/SectionHeading.js`): a centred uppercase Montserrat title (`headingFont`, from `app/components/home/headingFont.js` — a plain module so server components can use it too), optional small lavender eyebrow and `tone="dark"` for black bands. Buttons are its `<Pill>` (`dark` outline, `light` outline on photos/black, `solid`). Sections are `py-8 md:py-12`; never hand-roll a header. Homepage sections use `<Container wide>` (`app/components/ui/Container.js`): nearly edge to edge, 40px sides on laptops and 4% from 1536px (≈77px at 1920, as on Pitaka); product grids/rows are 4 across on desktop (`lg`, `(100%-48px)/4`), 3 on tablets (`md`, `(100%-32px)/3`), 2 on phones, with 16px gaps (`md:gap-4`); brand grids show 8 on desktop (`Grid desktopMax`) and 9 elsewhere. Other pages keep the default 1280px `Container`.
- Prices on cards go through `formatAED()` (`app/lib/utils.js`) — "AED 70", "AED 578.10", never "AED 578.1". Deterministic, so no hydration mismatch.
- Shipping facts come from `lib/shipping.js` only: `FREE_SHIPPING_FROM`, `TRANSIT_LABEL`, `getDeliveryInfo().rangeLabel` ("Tue 13 – Thu 15 Oct", 1–3 working days, no same-day cutoff at weekends). The courier is "our courier partners" — never name one in delivery promises. Once an order ships, the email and the account order pages do show the actual courier and a tracking link: always via `courierLabel()` / `trackingUrl()` in `lib/courier.js` (builds Aramex/DHL/FedEx/UPS links from the tracking number, else uses the saved link).
- Storefront chrome (after Pitaka): `Header.js` is Menu · logo (`<BrandLogo tone>`: lotus + "NAYA LUMIÈRE" in the sans (Inter, regular, 0.22em tracking) + spread "COSMETICS"; `tone="light"` — white text and `/naya-lotus-white.png` — over the hero, dark when solid; centred from md up, beside the menu on phones) · search/account/bag on every screen size. There is no mobile bottom bar and no floating chat button: the chat window (`ChatWidget`, signed-in only) opens from Support on My account (`setIsChatOpen(true)` from AppContext). The product page's sticky buy bar sits at the very bottom. The Menu button (✕ while open) opens a plain white menu under the header — full width on phones, a 400px column on desktop: the nav links with ⌄ for Shop and Brands, skin concerns, then the account links at the bottom (after Pitaka). The search icon opens a white panel in the same place: a field with an underline and ✕, "Popular searches" chips and four "Top picks" (best sellers), switching to up to 6 matching products as you type; Enter or "See all results" opens `/search?q=`. Signed in, clicking the account icon (with a ⌄ on desktop) opens a small white panel (closes on outside click, Esc, a link or a page change): photo/initials, "Hi, name", email, "Silver member · N points", then plain links between thin dark rules — My account, My orders, Naya Rewards, Wishlist (+ Admin panel) — and a grey Sign out; signed out, the icon goes to `/auth`. Only one of menu and search is open at a time, and the header turns solid while either is open. On `/` the header floats see-through over the hero (`#home-hero`) and turns white once the hero scrolls away; other pages get a white header and a spacer. Height is `HEADER_H` / `--header-h` (56px phone, 64px desktop, snug around the logo) — offset fixed layouts by it (e.g. `AccountShell`). No promo bar; WELCOME10 lives in the welcome popup and the footer sign-up (`/api/subscribe`). `Footer.js` is black and opens with "Glow with Naya Lumière". Instagram link: `INSTAGRAM_URL` in `lib/seo.js`.
- Homepage layout (`app/page.js`) — the GERnétic range comes straight after the hero; the perfume and Zorah photos are each followed by that brand's products. Hero → `CategoryStrip` (collections under the hero: each top-level collection's best-selling product photo on a round `#f6f5f2` tile, name, "N products" or a lavender "New in" when it holds one of the 3 newest products; up to 10, by size; swipes on phones, centred on desktop) → free-shipping note (only with items in the bag) → `BrandProducts` GERnétic ("Explore GERnétic skincare", up to 9) → campaign, buy again, recently viewed (only when they apply) → `BestSellers` (3) → GERnétic `FeatureBanner` → `ShopByConcern` chips (`/all-products?concern=<slug>`) → perfumes `FeatureBanner` (dark) → `BrandProducts` perfumes on black (`tone="dark"`) → `BrandPhotoBanner` Zorah (brand photo from Admin → Brands) → `BrandProducts` Zorah → `StoryVideos` black band ("The Naya ritual", two videos; hidden until one is uploaded) → journal (3 articles) → Instagram strip (6 posts) → footer. `BrandProducts` lists the whole active range, sold-out last, centred when short; hidden under 3 products.
- Hero (`HeroSection.js`): slides from Admin → Hero banner change every 7 s; hovering or using the arrows/dots pauses them, and the pause/play button after the dots stops both the slide changes and the video until pressed again. Visitors with reduced motion turned on start paused.
- `FeatureBanner` photos are homepage image slots (`lib/homepageImageSlots.js`, Admin → Homepage images), shown whole, never cropped: a wide desktop photo with the copy on its empty left side, and a portrait phone photo with the copy in a panel above it. `bg` / `mobileBg` match each photo's empty edge; `mobileTrimTop` (a fraction, e.g. GERnétic's `0.22`) crops a phone photo's empty top so it sits close to the copy — revisit it when that photo is replaced. Defaults live in `public/home/`.
- `StoryVideos` (`app/components/home/StoryVideos.js`, after Pitaka's "For a lighter future"): black band, title + lavender arrow linking to `/journal` and a short line on the left, up to two 9:10 videos on the right that play muted on loop while on screen (reduced motion starts paused) with a round play/pause button. Videos are homepage slots `story_video_1/2` (`media: 'video'`, no default) uploaded in Admin → Homepage images straight from the browser to Cloudinary, signed by `POST /api/admin/cloudinary-sign` (Vercel caps our own request bodies at 4.5 MB); Cloudinary URLs get `q_auto,w_1000` and a `so_0` poster frame.
- Homepage personal and campaign pieces: `FreeShippingNote` under the hero (only when the bag has items; counts items toward `FREE_SHIPPING_FROM`), `CampaignBanner` under the hero, then `BuyAgainShelf` (signed-in, `/api/users/[id]/buy-again`) and `RecentlyViewedShelf` (`useRecentlyViewed()`, browser storage). Personal rows map stored ids to live products so price and stock are current.
- Campaigns — `lib/campaigns.js` (DB) + `lib/campaignRules.js` (isomorphic): table `homepage_campaigns`, created on first use by `ensureCampaignsTable()` and by migration `016`. Admin → Homepage → Campaign banner (`/api/admin/campaigns`, photo upload via `/api/admin/campaigns/image`, own-Cloudinary URLs only). Times are entered in Dubai time (`dubaiInputToDate()`, fixed +04:00). `getActiveCampaign()` picks the live one ending soonest; `app/page.js` has `revalidate = 60` so a scheduled start shows within a minute, and the banner hides itself at the end time.
- Homepage palette: white, warm off-white panels (`#f6f5f2`) and black bands; ink (`#111114`) buttons and outlines; lavender only for tags (discount/pre-order), eyebrows, the bag count and the closing "Glow".
- Product grids and rows use `HomeProductCard` (`app/components/home/`): on phones an off-white panel holding a 3:4 photo box with the bag button (left) and price (right) below it inside the panel, and the name and brand underneath; from md up a 3:4 panel with the name (`cardName()` drops "by Gernetic:") and brand + flag top-left, tag top-right, photo centred, bag button bottom-left, price bottom-right; under it the same live facts as `ProductCard` — views this month from 5 up (`viewCountLabel()`), delivery range or pre-order date, "Only N left". `tone="dark"` recolours those facts on black. `ProductRow` is the swipe row (4 across desktop, 3 on tablets, 2 on phones). `variant="gallery"` (only the homepage "Explore GERnétic skincare" grid, via `BrandProducts cardVariant="gallery"`) is Pitaka's Explore card: large name, price + tag under it, the origin flag top-right and a round black bag button bottom-right, inside a 3:4 panel; from md up it's the 3-across (4 from `lg`) grid with thin ( ) arrows on hover that flip through `product.imageUrls`; on phones `GalleryCarousel` shows one big card at a time, swiped or moved with ( ) arrows, with a "2 / 9" count.
- `ProductCard` (every product list: all products, collections, brands, Skincare, Fragrance, New arrivals, Offers, search, wishlist, related rows) uses the same panel design as `HomeProductCard`: one tag top-right (Sold out › Pre-order › discount › rank › Best seller › New), bag + wishlist buttons bottom-left (quick view and AI insights appear on hover), price bottom-right, live facts underneath. Stars only when a product has real reviews; origin as a small `FranceFlag`/`UAEFlag`. Homepage product rows skip items that can't be bought — out of stock with no pre-orders (`orderableQty()`); brand rows list them last as "Sold out".
- Listing page headers use `<ListingHeader>` (`app/components/ListingHeader.js`): with `image` a full-width photo + uppercase title (collections use the category photo, brands the brand photo), otherwise a white block with a centred uppercase title; `StoreHeader` (Skincare, Fragrance, New arrivals, Offers) wraps it and adds the AI specialist link. Sticky filter bars sit at `top-[var(--header-h)]`, below the fixed header. All products opens (after Pitaka) with a big left-aligned "All products ⌄" title whose menu jumps to Best sellers / New arrivals / Offers, each brand and each collection (`PageSwitcher`), then a "Brand" row of large rounded brand cards — photo, name, "Made in France · 15 products" — that toggle the brand filter (`BrandCards`; swipe row on phones). There is no collection-pill / search bar (collections are in the title menu and the phone Filters drawer; search is in the header). It has no side column on desktop: its filters (Price, In stock only, Clear all — brand is the cards above) sit in a row above the grid as dropdown pills (`FilterDropdown` in `AllProducts.js`), with the count, sort and view toggle on the right, and the grid is 4 across from `xl`, as wide as the homepage (`max-w-[2400px]`, `lg:px-10 2xl:px-[4%]`, `md:gap-4`); phones keep the Filters drawer. `ui/slider` draws one thumb per value, so price ranges get two handles.
- Side cart (`SideCart.js`, after Pitaka): plain white drawer — items (grey photo tile, trash, − qty +, old price struck through), "Remove all items" with an inline confirm, one best-seller recommendation at a time with + Add, "Have a discount code?" (`applyCoupon` from CartContext), free-delivery line, a Total that expands to subtotal / discount / delivery (`calcShipping`), a black Checkout button to `/checkout` and a "View full bag" link to `/cart`. Adding to the bag must pass `originalPrice` and `slug` so the cart can show them.
- Product page (`app/product/[productId]/ProductClient.js`, after Pitaka): desktop splits 55/45 — every photo stacked full-height on `#f6f5f2` on the left ("1 / N" on the first), a buying panel on the right that stays in view (`sticky top-[calc(var(--header-h)+32px)]`): breadcrumb, name, brand + origin, rating, price with −% tag, size chips, a foldable Overview, stock line, quantity + black Add to cart + wishlist, Tabby, delivery card, three promises. Phones keep `ProductGallery` (edge-to-edge swipe + thumbnails). Below: centred Details | Reviews | You may also like links, then details, bought-together, reviews and four `ProductCard`s. Colours and headings come from `_components/theme.js` (ink `BUTTON`, uppercase `SECTION_TITLE`).
- My account (`app/account/page.js`, after Pitaka), same on every screen size: a greeting column (photo or grey avatar, "Hi, name", Log out) beside the points balance ("You have N Naya points now", → Naya Rewards), four icon links (Orders, Wishlist, Addresses, Support = `setIsChatOpen(true)`; Profile and Settings were removed — the photo is changed on the avatar here) and the 3 latest orders; then Membership tiers and Ways to earn points, built only from `lib/loyalty.js` (`TIERS`, `AED_PER_POINT`, `WELCOME_BONUS_POINTS`, `pointsToAed`), then the journal. No referral, newsletter or social-follow rewards exist, so none are shown. Addresses, Orders (+ order detail) and Wishlist have no side panel: they use `<AccountPage>` (`app/account/_components/AccountPage.js`: "← Back to …", big title, optional action, plus `OUTLINE_PILL` / `SOLID_PILL` / `TEXT_LINK` / `Spinner`). Orders: status tabs (ink when chosen), underline search and sort, then a ruled list (photos on `#f6f5f2`, status badge, total) with underlined Buy again / Track order / Invoice. Wishlist: `ProductCard` grid, off-white empty state. Only Profile, Settings and the single-address page still use `AccountShell` — keep `SIDEBAR_PAGES` in `app/LayoutContent.js` in step so the footer clears the sidebar. Addresses (`app/account/addresses/page.js`, after Pitaka): "← Back to account", a big "Your addresses" title with an outlined "+ Add address" pill, then 2-across cards with a thin ink border (default first, tagged "Default"), the address lines and phone, and small underlined Edit / Delete (inline confirm) / Set as default links.
- Naya Rewards (`app/account/loyalty/page.js`, after Pitaka's rewards page, no `AccountShell`): back link, big "Naya Rewards" title, then `BigTitle` sections — Ways to earn points (balance card + Place an order / First order delivered (Completed once the bonus is in) / Move up a tier), Ways to spend points (AED 5 / 25 / 50 / 100 off for 100 / 500 / 1,000 / 2,000 points: "Use at checkout" or "N points to go"), Membership tiers ("Level N: Silver" tabs over goal/reward cards, "Your tier" badge) and Points activity. All from `lib/loyalty.js`; no referral or social rewards exist, so none are shown.
- Cart (`app/cart/page.js`) and checkout (`app/checkout/page.js`) use the storefront palette, not Cloud Luxe: every action (Checkout, Place order, Pay, Apply, the phone bars) is an `ACTION` solid violet `#5b35ec` button, 52px with 12px corners (`rounded-xl`), and the card field, discount field and Stripe wallet button (clipped by its wrapper) share those corners; selections stay ink (black radio, ink border on the chosen card), warm `#f6f5f2` panels for the order summary and photo tiles, hairlines, uppercase `headingFont` titles, lavender `ACCENT` only for small tags (pre-order, Default) and progress. Checkout is one page: a single card with rows — Deliver to (opens the address picker in place — Shopify's list: the chosen address on a grey `#f5f5f5` panel, two lines each (name + street bold; area, emirate, AE, phone), a grey "Default" tag, a ⋮ menu (`AddressMenu`: Edit / Remove) and "+ Use a different address"), Delivery (standard service, cost and `getDeliveryInfo().rangeLabel` or the pre-order ship-by date), Extras (gift wrap / loyalty points toggles, opened in place) and Payment (one list: Apple Pay / Google Pay — only when `ExpressCheckoutButton` reports the device has one via `onAvailable` — · Card · Cash on delivery · Tabby, the chosen row opening the card field or Tabby's plan details) — then ONE main button for every method: Stripe's own wallet button replaces it when the wallet row is chosen (an always-mounted hidden instance detects the wallet), "Pay AED …" submits the card field (`CheckoutForm` is only the field, `<form id="card-payment-form">`, and reports `{ ready, processing }` via `onStatusChange`), "Place order" for COD, "Continue to Tabby". Stripe Link is turned off (`disableLink` on the card field, `disableWallets: ['link']` on the wallet button). Terms / Privacy links under the button. The layout is Shopify's: a header with the logo over the left column and a bag icon (back to `/cart`) over the right, then a two-half split from `lg` — the form column on white, right-aligned (`max-w-[600px]`, 38px padding), and the order summary on `#f5f5f5` filling the right half with a `#dedede` hairline, sticky (`max-w-[500px]`): photo tiles with a black quantity badge, the always-open discount field (grey Apply until a code is typed), Subtotal · N items / Shipping, then Total with a small "AED" before the amount and "Including AED … in VAT". Phones get Shopify's grey "Order summary ⌄ / total" bar under the header. Only the summary and frame changed — the left column's rows and buttons are as described above. The card form says to choose an address first when none is selected. Only classes changed — the order, Stripe, Tabby, COD, points, gift-wrap and coupon logic is untouched.
- The bag (`/cart`) uses checkout's frame: the same logo header (with "← Continue shopping" on the right), items on white in the left half, and the order summary on the grey `#f5f5f5` right half — Subtotal / Shipping, the always-open discount field (grey Apply until typed), Total with a small "AED" and "Including AED … in VAT", the Checkout button, Tabby, then a white card with the shipping tiers, gift and points. Routine advice, "You may also like" and "Buy it again" sit under the items (after the summary on phones; the grid places them with `lg:row-start-2`).
- The bag's Checkout goes straight to `/checkout` for everyone; signed out, checkout runs as a guest checkout (see Guest checkout below). The old "Need anything else?" step (`/need-anything-else`) was removed; that route only redirects to `/checkout`.
- Under the bag (`/cart`), "You may also like" (`PairItWithSection`, up to 8 buyable products) and "Buy it again" (`BuyAgainSection`, "Ordered 12 Oct", "View orders" link) are Shopify-style `CartSuggestionCarousel` panels: grey `#f5f5f5`, title with ‹ › arrows and an "N / M" count, one product at a time — white photo tile, name, brand, price (old price struck through) and a black "+ Add" (full width on phones). `toCardProduct()` swaps API payloads for the live AppContext product. `SideCart` never opens on `/cart` (adding there closes it).
- Reviews (`app/components/Reviews.js`, after Pitaka): centred title, average + black stars + 5→1 bar chart beside a black "Write a review" (signed-in only), sort (latest / highest / lowest) and rating filter, initials avatar + "Kareem D." name, relative date, 5 at a time with "Show more". Reviews have only rating, comment, date and username — no titles, photos or helpful votes.

### Storefront upgrades (Oct 2026)
- **Search** (`lib/search.js`, isomorphic): `searchCatalog(products, query, { concerns, categories, brands })` folds accents/capitals/punctuation (`fold()`), matches name, brand, collections + concern names (via `concern_ids`), size/form and description, treats generic words ("skin", "cream") as optional, falls back to close spellings (`close: true`), and returns matching brands/collections/concerns for shortcut chips. Used by the header search panel and `/search` (which searches the AppContext catalogue; no API call). Never hand-roll another matcher.
- **Header**: Skincare / Fragrance / Brands beside Menu from `lg`, + New in / Offers from `xl` (`QUICK_LINKS` in `Header.js`). Phones unchanged.
- **Homepage loading**: `CategoryStrip`, `BrandProducts` and `BestSellers` render grey placeholders at the cards' size while `loading && !products.length`. `BestSellers` shows 4 (3 on tablets via `Grid tabletMax`).
- **Welcome offer** (`LayoutContent.js`): shows once per visitor after the 2nd page view or 30 s, never on arrival. Desktop gets the card; phones get `WelcomeBar` (slim bar at the bottom, above the product page's sticky buy bar via the `nayalc:sticky-buy-bar` event) whose "Get code" opens the card as a bottom sheet.
- **Readability**: small grey text on the storefront uses `#6b6b73` (4.8:1 on `#f6f5f2`); avoid `#9a9aa2` / `gray-400` for text. 32px card buttons get a 40px tap area with `relative after:absolute after:-inset-1`.
- **Help**: `lib/contact.js` (`CONTACT_EMAIL` = info@nayalc.com; WhatsApp from `NEXT_PUBLIC_WHATSAPP_NUMBER`, every WhatsApp link hidden until it's set), `lib/policies.js` (`RETURN_WINDOW_DAYS`, `REFUND_WITHIN_DAYS`, also read by the Terms). Pages `/contact`, `/shipping-returns`, `/faq` (FAQPage JSON-LD) use `<InfoPage>` / `<InfoSection>` (`app/components/InfoPage.js`); delivery facts come from `lib/shipping.js`. The product page has a "Questions about this product?" line (WhatsApp or /contact).
- **Reviews**: stars on the product page only once a product has a review. `POST /api/reviews` takes the reviewer from the session or a signed review token (`lib/reviewTokens.js`), never from the body; one review per customer per product. `DELETE` needs an admin session.
- **Review request email**: daily cron `/api/cron/customer-emails` (vercel.json, `CRON_SECRET`) → `sendDueReviewRequests()` (`lib/reviewRequests.js`): orders delivered 5–21 days ago get `buildReviewRequestEmail()` once (`delivered_orders.review_requested_at`, migration 017). Each star links to `/product/<slug>?rt=<token>&review=<n>#reviews`; `Reviews.js` opens the form with that rating and posts the token.
- **Back in stock** (`lib/stockAlerts.js`): sold-out products without pre-orders show `StockAlertForm` → `POST /api/stock-alerts` (public, rate-limited) → `stock_alerts` (migration 018; one waiting alert per product+email). `allocateStock()` schedules `notifyStockAlerts()` with `next/server` `after()`; the daily cron sweeps the rest. Admin → Backorders lists "Waiting for restock".
- **Sizes** (`lib/sizeGroups.js`): sizes are separate products linked by `products.size_group` (migration 019), set in the product editor's Sizes card (`PUT /api/admin/products/[id]/sizes`). The product page shows `product.sizeOptions` (from the page query and `/api/products/[id]`) as chips that link to each size; no chips otherwise.

### Guest checkout — `lib/guestCheckout.js`
- Signed out, `/checkout` asks for email, name and an address (the same `AddressInputForm`, kept in the tab's sessionStorage) and offers "Sign in". Card, Apple/Google Pay and Tabby work; cash on delivery and points need sign-in (the COD row says "Sign in to use it"; `/api/checkout/guest-order` refuses COD).
- Right before charging (`CheckoutForm`/`ExpressCheckoutButton` `onBeforePay`, or before Tabby), `POST /api/checkout/guest` → `startGuestCheckout()`: a new email gets a new unverified account; an existing email gets the order on that account but the address is `from_guest_checkout` (migration 020) and hidden from its address book (`VISIBLE_ADDRESS_SQL`). The response never says which. It returns a 3-hour signed checkout token naming the account + address.
- `POST /api/checkout/guest-order` (token + order) calls `placeOrder()` unchanged and returns an order link token; the confirmation is `/order-confirmed/<id>?access=<token>`, read via `GET /api/checkout/guest-order/[orderId]`. Tabby: `/api/tabby/checkout` accepts `guestToken`; `/api/tabby/complete` returns `access` for guest checkouts.
- A signed-out bag lives in localStorage (`nayalc_guest_cart`, `CartContext`) and is merged into the account's bag on sign-in (it used to be lost on reload or sign-in).

### Account data access
- `/api/users/[userId]/…` routes must call `requireSelf(request, userId)` (`lib/requireSelf.js`): the middleware only checks that someone is signed in. `GET /api/orders/[orderId]` returns the order only to its owner or an admin (lookup in `lib/orderDetails.js`).

### Arabic version — `lib/i18n/` + `app/context/LocaleContext.js`
- The language is a cookie (`nl_lang=ar`) applied in the browser only, so every page stays static/ISR for English visitors — never read `cookies()` on the server for it. `LOCALE_SCRIPT` (inline, first in `<head>`) sets `<html lang="ar" dir="rtl" class="i18n-pending">` before paint; `.i18n-splash` (white cover with the name, `globals.css`) hides the English HTML until the Arabic text is in and lifts itself after 4 s whatever happens. `LocaleProvider` renders English first (matching the HTML), loads `lib/i18n/ar.js` (its own chunk, never downloaded by English visitors), then re-renders in Arabic. `LanguageSwitch` ("العربية" / "English": header, phone menu, footer) calls `setLocale()`, which writes the cookie and reloads so Stripe and Tabby restart in the new language.
- Text: `const { t, rich, date, locale, dir } = useLocale()` (or `useT()`). The English text is the key: `t('Add to bag')`, `t('{n} items', { n })`; `rich('Use code {code} at checkout', { code: <b>…</b> })` for elements inside text; `date(label)` for the day and month names in `lib/shipping.js` labels. Add every new storefront string to `lib/i18n/ar.js` (a missing key shows the English). Counts take plural forms (`{ zero, one, two, few, many, other }`, picked from `vars.n`). `t()` passes non-strings through, and DB values (collection, concern and emirate names, admin copy) may go through it — they translate when the dictionary has them.
- Translated (`TRANSLATED_PAGES` in `lib/i18n/index.js`): header, menus, search, footer, homepage, product pages, listings (all products, search, Skincare, Fragrance, New in, brands, collections), bag, side cart, checkout (Stripe Elements get `locale`, Tabby `lang`), sign-in, order confirmed, Tabby return. Every other page renders through `LocaleScope` in English, left to right, inside the Arabic header and footer — add a route to `TRANSLATED_PAGES` only once its page is translated. `/admin` is always English (`isEnglishOnlyArea`); `/sales` is left out on purpose. Product names, descriptions and other admin-entered copy show as entered (phase 2).
- Right to left: use logical classes (`ms/me/ps/pe/start/end/text-start/text-end/border-s/rounded-s…`) and `rtl:` variants, not `left/right`, for anything that should mirror. Forward arrows and chevrons get `.flip-rtl`. Drawers slide in from the start side (`dir` from `useLocale()`), carousels get `direction`, scroll code uses `Math.abs(scrollLeft)` (it's negative right to left). Latin text from the DB goes in `<bdi>` (names, sizes, short copy — keeps the layout's alignment) or gets `dir="auto"` (paragraphs: descriptions, reviews; also single-line `truncate` text, with `rtl:text-right`), otherwise "5 Lift Serum" reads "Lift Serum 5" and full stops jump to the wrong end. Phone numbers and order refs get `dir="ltr"`, negative amounts `<bdi>`.
- Fonts: Arabic letters in IBM Plex Sans Arabic (`--font-arabic`, `app/layout.js`), Latin ones still in Inter / Montserrat (the family names come first in `globals.css` — see the comment there). Letter-spacing breaks Arabic letters, so Arabic mode switches it off except on `.latin` (the logo) and left-to-right text.

### Sign in — `app/auth/page.js` + `lib/emailLoginCodes.js`
- Sign-in is a pop-up, not a page: `useSignIn().openSignIn(callbackUrl?)` (`app/context/SignInContext.js`, inside `HeaderProvider`) shows `<SignInPanel>` (`app/components/auth/SignInPanel.js`) in a centred card over the current page (a bottom sheet on phones; ✕, Esc and a click outside close it). After signing in it goes to `callbackUrl` or refreshes the page in place. The header account icon and menu, wishlist hearts, reviews, the bag (Checkout → `openSignIn('/checkout')`), the delivery card, share panel and rewards page all open it. `/auth` renders the same panel as a page only for protected pages that redirect there (account, checkout, admin) and old links. Use `openSignIn()` for new sign-in prompts, never `router.push('/auth')`.
- After Shopify: one card "Sign in or create account" — Google / Apple (when configured), OR, an Email field with → and "Email me with news and offers", then "Enter code". There is no register form: `POST /api/auth/email-code` emails a 6-digit code (`buildLoginCodeEmail()`), and `signIn('email-code', { email, code })` (provider in `lib/auth.js`) signs in, creating the account on first use (`findOrCreateUserByEmail()`: first name from the email, `email_verified = true`, no password). The code field auto-submits on the sixth digit; "send a new code" after 30 s.
- Codes live in `email_login_codes` (created on first use by `ensureLoginCodesTable()`): one per email, only a SHA-256 hash, 10-minute expiry, locked after 5 wrong tries, deleted once used. Sending is rate-limited per IP and per email, and answers the same for every address (no account enumeration). Errors come back as `CODE_WRONG` / `CODE_EXPIRED` / `CODE_LOCKED` / `ACCOUNT_SUSPENDED`.
- The news opt-in on a NEW account sends the WELCOME10 subscription email. Code sign-ins skip the "you signed in" confirmation email (the code email was just sent).
- "Sign in with password instead" keeps the old credentials login, with "Forgot password?" (`/api/auth/forgot-password`). `/api/auth/signup` still exists but the page no longer uses it.

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
Every email (customer, admin, marketing) renders through one layout, `renderEmail()` in `lib/email/theme.js`, styled after the website (after Pitaka): warm page, white 600px card, optional black strip, logo lockup + nav header (an "Admin" pill for internal mail), body, trust row, then the site's black footer band opening with "Glow with Naya Lumière". `T` tokens: ink `#111114` buttons (uppercase pills) and underlined links, warm off-white `#f6f5f2` panels (notices, code ticket, product cards, photo tiles), `#e6e4df` hairlines, black `band`, lavender `T.accent` only for eyebrows and small tags; `T.violet*` now resolve to ink/off-white for older call sites. Titles are uppercase `HEAD_FONT` (Montserrat, Helvetica fallback).
- Build emails from the components there: `intro`, `section`, `notice` (tones info/success/warning/danger/neutral), `infoTable`/`infoRow`, `lineItems`, `totals`, `tracker`, `button`/`buttonRow`, `panel`, `productGrid`, `recommendations`, `codeTicket`, `fallbackLink`, `signOff`. Never hand-roll a wrapper or `class="btn"`.
- Each email is a pure `buildXEmail()` → `{ subject, html }` plus a `sendXEmail()` that calls `deliver()`. Keep that split so it stays previewable.
- Preview all emails without DB/SMTP: `node scripts/preview-emails.mjs [dir]` → open `index.html`.
- The email header and the HTML invoice use `brandLockup()` (theme.js): the lotus + "NAYA LUMIÈRE" in spaced sans capitals + "COSMETICS", as text so it shows even with images blocked — the same lockup as the site's `BrandLogo`. The invoice and PO PDFs draw it with `drawBrand()` (`lib/invoicePdf.js`).
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
- **PRs carry a price**: every line has a required estimated unit price (`purchase_requisition_items.unit_price`) in the PR's `currency` — a "Prices in [AED ▾]" select in the Products card header (AED, EUR, USD, GBP, CHF, SAR; picking a preferred supplier switches it to theirs), shown with amounts and a total, and an "Estimated total" column in the list. Drafts saved before prices existed can't be submitted until priced. Converting to a PO copies those prices when the PO's supplier bills in the same currency; otherwise the PO takes the supplier's last price. Columns are added by `ensurePurchasingTables()` (it re-runs the idempotent SQL when `unit_price` is missing) and migration `015`.
- Read-only PR/PO lines (`LinesEditor readOnly`) are a list, not a table: names wrap (two lines), each row shows "N units × price" and the amount on the right, so long names never push the figures off the card. The PR page's side column has Details (supplier, needed by, currency, estimated total, requester's notes) and a History card (created → sent → approved/rejected).
- **Approval email**: submitting a PR (create with `submit` or the `submit` action) emails every admin with full access or the Approver role — the requester only if they have full access — after the transaction commits (`sendApprovalEmail()` in `lib/erp/approvalEmail.js`, template `buildRequisitionApprovalEmail()` in `lib/mail.js`, styled after the homepage: black band, off-white panel, ink pills). The outcome is stored on the PR (`approval_email_sent_at`, `approval_email_error`; cleared on each submit). A failed send never undoes the submit: the PR page shows a warning with "Send approval email" (also for PRs submitted before the email existed) and a "Resend email" action once sent — both call action `resend_email`, which returns `emailError` instead of throwing.
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
- The homepage is prerendered on Vercel (`revalidate` in `app/page.js`), so `usePathname()` reports it as `/index`, not `/`. Check for the homepage with `isHomePath()` (`app/lib/utils.js`), never `pathname === '/'` — the dev server reports `/`, so the bug only shows on the live site.
- `fetchWithAuth` must come from `useAppContext()` — do NOT import from `lib/api.js` (that file exports `createFetchWithAuth` factory, not a ready-to-use function).
- `addToCart(product, quantity)` takes two separate args — NOT a single `{ product, quantity }` object.
- APIs (`/api/products/suggestions`, buy-again) return `stockQuantity` (camelCase); CartContext reads `stock_quantity` (snake_case). Always normalize: `{ ...product, stock_quantity: product.stockQuantity || product.stock_quantity }` before calling `addToCart`.
- Never hand-roll phone parsing. `internationalPhone()` in `app/admin/_components/phone.js` is now a re-export of `toWhatsApp()` and returns **null** for unusable numbers (it used to return a wrong-but-plausible number). Call sites already guard on falsy.
- Email CSS must be email-safe: no `backdrop-filter`, no CSS variables, no Tailwind — use embedded `<style>` tags and inline styles only. Use `Georgia` for serif/italic fallback.
