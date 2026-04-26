# Performance, Accessibility & Security Improvement — Design Spec

**Date:** 2026-04-26
**Scope:** Approach B — targeted fixes across all four Lighthouse categories
**Baseline scores:** Performance Desktop 60 / Mobile 75 · Accessibility 82 · Best Practices 96 · SEO 100
**Target scores:** Performance Desktop ~85–90 / Mobile ~85–90 · Accessibility ~95+ · Best Practices 100 · SEO 100

---

## 1. Performance

### 1.1 Lazy-load ChatWidget (P0)

**Problem:** `LayoutContent.js` statically imports `ChatWidget`, which statically imports `socket.io-client` at module evaluation time. On desktop (no network throttle), Socket.io immediately connects and fires polling, producing 5,150ms TBT. On mobile (Slow 4G), network latency suppresses this — hence only 40ms TBT there.

**Fix:** Replace the static import in `app/LayoutContent.js` with a `dynamic()` import:

```js
const ChatWidget = dynamic(() => import('./components/ChatWidget'), { ssr: false });
```

Socket.io bundle is deferred until after hydration. No UX impact — the widget is not needed in the first second.

**Expected impact:** Desktop TBT 5,150ms → ~100–200ms.

---

### 1.2 Replace Google Fonts `<link>` with `next/font`

**Problem:** `app/layout.js` loads 5 font families (37 weight variants) via a render-blocking `<link rel="stylesheet">`. Lighthouse flags this under "Render blocking requests — est. savings 140ms."

**Families currently loaded:**
- Cormorant Garamond: 10 variants
- Montserrat: 9 weights
- Instrument Sans: 4 weights
- Playfair Display: 8 variants
- Cinzel: 6 weights

**Fix:**
1. Audit actual usage: grep for `font-playfair` and `font-cinzel` (or equivalent Tailwind classes/CSS references) across the codebase.
2. Remove any family used in fewer than 3 places (inline the font-family directly or replace with the nearest active family).
3. Migrate remaining families to `next/font/google` with `display: 'swap'` and `subsets: ['latin']`.
4. Load only required weights per family:
   - Cormorant Garamond: `400`, `600`, `700` (roman + italic)
   - Montserrat: `400`, `500`, `700`, `900`
   - Instrument Sans: `400`, `600`
5. Remove the `<link>` tags and `<link rel="preconnect">` tags from `app/layout.js` — `next/font` self-hosts and handles preloading automatically.

**Expected impact:** Eliminates render-blocking font request. FCP improvement ~140ms (desktop), ~160ms (mobile).

---

### 1.3 Fix hero aura orb animations (non-composited)

**Problem:** `HeroSection.js` renders two `motion.div` elements with `blur-[100px]` / `blur-[80px]` filters, animating `opacity`, `scale`, `x`, and `y` with infinite loops. Animating `opacity` on a filtered element forces the browser to repaint on every frame (not just GPU rasterize), contributing to 22.4s of main-thread work on desktop. Lighthouse flags this under "Avoid non-composited animations — 1 animated element found."

**Fix:**
- Remove `opacity` from the `animate` prop on both orbs. Set a constant `opacity` via the element's `style` or `initial` prop.
- Keep `scale` and `x`/`y` animations (these use `transform` which is GPU-composited).
- Add `style={{ willChange: 'transform' }}` to both orbs so the browser promotes them to their own compositor layer before animation starts.

```jsx
// Before
animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2], x: [0, 40, 0], y: [0, -20, 0] }}

// After
style={{ opacity: 0.25, willChange: 'transform' }}
animate={{ scale: [1, 1.1, 1], x: [0, 40, 0], y: [0, -20, 0] }}
```

Apply the same pattern to the second orb.

**Expected impact:** Eliminates non-composited animation. Main-thread work reduced significantly on desktop.

---

### 1.4 Lazy-load below-fold home sections

**Problem:** `app/page.js` is a server component that imports `FeaturedProducts`, `ForYouSection`, `EditorialShowcase`, and `SocialFeed`. While data fetching is server-side, their client JS hydrates synchronously on load, adding to the initial JS bundle evaluated on the main thread.

**Fix:** Wrap each below-fold section in `dynamic()` with a height-preserving skeleton placeholder to prevent layout shift:

```js
const FeaturedProducts  = dynamic(() => import('./components/FeaturedProducts'),  { loading: () => <div style={{ minHeight: 480 }} /> });
const ForYouSection     = dynamic(() => import('./components/ForYouSection'),      { loading: () => <div style={{ minHeight: 400 }} /> });
const EditorialShowcase = dynamic(() => import('./components/EditorialShowcase'),  { loading: () => <div style={{ minHeight: 480 }} /> });
const SocialFeed        = dynamic(() => import('./components/SocialFeed'),         { loading: () => <div style={{ minHeight: 320 }} /> });
```

`HeroSection` and `Categories` remain statically imported — they are above the fold.

**Expected impact:** Reduces initial JS parse time. Speed Index improvement on both desktop and mobile.

---

## 2. Accessibility

### 2.1 Buttons without accessible names

**`MobileBottomNav.js`:** The five nav `<Button>` elements render icon-only with no accessible label. Fix:

```jsx
<Button
  aria-label={item.label}
  aria-current={isActive ? 'page' : undefined}
  ...
>
```

**Icon-only buttons elsewhere:** Grep for `<button` and `<Button` whose only child is a Lucide icon component and which lack `aria-label`. Add `aria-label` describing the action (e.g., `aria-label="Remove item"`, `aria-label="Close"`, `aria-label="Open cart"`).

Specific known locations:
- `Header.js` — cart badge button, search toggle button
- `SideCart.js` — close button, quantity increment/decrement buttons
- `HeroSection.js` — already labelled ✅

---

### 2.2 Links without a discernible name

Pattern: `<Link>` wrapping an `<Image>` where `alt=""` and no `aria-label` on the link.

Fix: For every `<Link>` whose only child is an image (logo links, brand links, product card images):
- Either set a meaningful `alt` on the `<Image>` (e.g., `alt="Naya Lumière Cosmetics — home"`)
- Or add `aria-label` to the `<Link>` itself

The logo link in `Header.js` is the most likely flagged instance. Confirm by running the audit.

---

### 2.3 Contrast ratio failures

Two patterns to fix:

**`text-gray-400` (#9ca3af) on white — ratio ~2.85:1 (fails 4.5:1 AA)**
Replace with `text-gray-500` (#6b7280, ratio ~4.6:1) for any text that conveys information. Purely decorative separators/dividers can stay.

**`--cl-text-light` (`rgba(59,7,100,0.50)`) on `--cl-bg` (`#fdf8ff`) — ratio ~3.2:1**
For body copy, increase opacity to `0.70` (ratio ~5.1:1). Update the CSS variable value in `app/globals.css`. This affects all uses of `text-cl-light` across the app — verify no design regressions.

---

### 2.4 Touch target sizing

Lighthouse requires interactive elements to have a minimum 44×44px tap target.

**`MobileBottomNav.js`:** The icon container is `h-9 w-9` (36px). The outer `<Button>` must be at least 44×44px. Add `min-h-[44px] min-w-[44px]` (or ensure the `navTab` variant in the Button component enforces this).

**Other small targets:** Any icon button with `h-8 w-8` or smaller needs a wrapper with adequate spacing or a larger clickable area via padding.

---

## 3. Security Headers

All headers added to `next.config.mjs` via the `headers()` async function, applied to `source: '/(.*)'`.

### 3.1 Enforced immediately (safe)

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

### 3.2 CSP — report-only mode

Header name: `Content-Security-Policy-Report-Only` (not enforcing).

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' *.stripe.com *.vercel-insights.com;
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com data:;
img-src 'self' data: blob: *.cloudinary.com *.unsplash.com *.nayalc.com res.cloudinary.com placehold.co;
connect-src 'self' *.stripe.com wss://nayalc.com *.vercel-insights.com vitals.vercel-insights.com;
frame-src *.stripe.com;
worker-src 'self' blob:;
```

`'unsafe-eval'` is included in the initial report-only allowlist because some third-party scripts (Stripe, Vercel Analytics) may require it. After reviewing the violation log, remove it if no violations reference it — tighter is better. After deploying report-only, monitor the browser console for CSP violations for at least one full user session across all pages (home, checkout, account, chat). Once the violation log is clean, rename the header to `Content-Security-Policy` to enforce.

---

## 4. Best Practices (console errors)

### 4.1 Eliminate console errors on page load

Lighthouse docks Best Practices for any console error during the audited page load. Steps:

1. Run `npm run build && npm start` locally (production mode, where hydration warnings are more prominent).
2. Open the home page with DevTools console open, filter to Errors only.
3. Fix each error before user interaction. Common sources:
   - **Socket.io connection refused** — fixed by lazy-loading ChatWidget (Section 1.1)
   - **React hydration mismatch** — usually from `Date.now()`, `Math.random()`, or `window`-dependent code running in SSR. Wrap in `useEffect` or use `suppressHydrationWarning` only where truly unavoidable.
   - **Missing `key` props** — add keys to any list render missing them.

---

## Out of Scope

- CSP enforcement (deferred until violation log is clean)
- AppContext RSC migration (Approach C — separate effort)
- Socket.io → SSE replacement (Approach C)
- SEO changes (already at 100)

---

## Success Criteria

| Metric | Before | Target |
|---|---|---|
| Desktop Performance | 60 | 85+ |
| Mobile Performance | 75 | 85+ |
| Desktop TBT | 5,150ms | <300ms |
| Mobile LCP | 4.7s | <2.5s |
| Accessibility | 82 | 95+ |
| Best Practices | 96 | 100 |
| Console errors on load | present | 0 |
| Render-blocking fonts | yes | no |
| Non-composited animations | 1 | 0 |
