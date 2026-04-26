# Performance, Accessibility & Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Lighthouse scores from Desktop 60 / Mobile 75 / Accessibility 82 / Best Practices 96 to Desktop 85+ / Mobile 85+ / Accessibility 95+ / Best Practices 100.

**Architecture:** Targeted, surgical fixes to existing files — no architectural rewrites. Performance gains come primarily from deferring heavy client-side JS (Socket.io, below-fold components) and eliminating render-blocking fonts. Accessibility fixes add missing ARIA attributes and fix contrast. Security headers are added to `next.config.mjs`.

**Tech Stack:** Next.js 15 App Router, `next/font/google`, Framer Motion, Tailwind CSS 4, React 18

**Spec:** `docs/superpowers/specs/2026-04-26-performance-accessibility-security-design.md`

---

## File Map

| File | Change |
|---|---|
| `app/LayoutContent.js` | Lazy-load ChatWidget via `dynamic()` |
| `app/layout.js` | Replace Google Fonts `<link>` with `next/font`; remove font preconnect tags |
| `tailwind.config.js` | Update `fontFamily` to use CSS variables from `next/font` |
| `app/components/HeroSection.js` | Remove `opacity` from animated aura orbs; add `willChange: 'transform'` |
| `app/page.js` | Lazy-load `FeaturedProducts`, `ForYouSection`, `EditorialShowcase`, `SocialFeed` |
| `app/components/MobileBottomNav.js` | Add `aria-label` + `aria-current` to nav buttons; fix touch target size |
| `app/components/SideCart.js` | Add `aria-label` to close, qty, and remove buttons |
| `app/globals.css` | Fix `--cl-text-light` opacity for contrast compliance |
| `next.config.mjs` | Add security headers (HSTS, XFO, XCTO, RP, COOP, Permissions-Policy, CSP-RO) |

---

## Task 1: Lazy-load ChatWidget

**Files:**
- Modify: `app/LayoutContent.js`

This is the single highest-impact change. `ChatWidget` imports `socket.io-client` at module level. Static import means Socket.io initialises synchronously on every page load, causing 5,150ms TBT on desktop.

- [ ] **Step 1: Add dynamic import**

Open `app/LayoutContent.js`. Replace the static import at the top:

```js
// Remove this line:
import ChatWidget from './components/ChatWidget';
```

Add at the top of the file, alongside the other imports:

```js
import dynamic from 'next/dynamic';
const ChatWidget = dynamic(() => import('./components/ChatWidget'), { ssr: false });
```

The rest of the file is unchanged — `<ChatWidget />` JSX stays exactly where it is.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build completes with no errors. You may see a note that ChatWidget is now a dynamic chunk — that is correct.

- [ ] **Step 3: Verify no console errors on load**

```bash
npm start
```

Open `http://localhost:3000` in a browser. Open DevTools → Console. Confirm no Socket.io connection errors appear before the chat widget is interacted with.

- [ ] **Step 4: Commit**

```bash
git add app/LayoutContent.js
git commit -m "perf: lazy-load ChatWidget to eliminate Socket.io eager init"
```

---

## Task 2: Migrate Google Fonts to next/font

**Files:**
- Modify: `app/layout.js`
- Modify: `tailwind.config.js`

Currently 5 font families (37 weight variants) are loaded via a render-blocking `<link>`. Cinzel and Playfair Display are not referenced in `tailwind.config.js` or any component — they are loaded but never applied. Remove both. Migrate the 3 used families to `next/font/google`, which self-hosts fonts and eliminates the render-blocking request.

- [ ] **Step 1: Replace font imports in layout.js**

Open `app/layout.js`. Make the following changes:

**Remove** these lines from `<head>`:
```jsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Instrument+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Cinzel:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
```

**Add** at the very top of `app/layout.js`, after `import "./globals.css";`:
```js
import { Cormorant_Garamond, Montserrat, Instrument_Sans } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-montserrat',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-instrument',
});
```

- [ ] **Step 2: Apply font variables to html element**

In `app/layout.js`, find the `<html lang="en">` opening tag inside `RootLayout` and update it:

```jsx
// Before
<html lang="en">

// After
<html lang="en" className={`${cormorant.variable} ${montserrat.variable} ${instrumentSans.variable}`}>
```

- [ ] **Step 3: Update tailwind.config.js to use CSS variables**

Open `tailwind.config.js`. Find the `fontFamily` block and replace it:

```js
// Before
fontFamily: {
  'serif': ['"Cormorant Garamond"', 'serif'],
  'sans': ['"Instrument Sans"', '"Montserrat"', 'sans-serif'],
  'instrument': ['"Instrument Sans"', 'sans-serif'],
},

// After
fontFamily: {
  'serif': ['var(--font-cormorant)', 'serif'],
  'sans': ['var(--font-instrument)', 'var(--font-montserrat)', 'sans-serif'],
  'instrument': ['var(--font-instrument)', 'sans-serif'],
},
```

- [ ] **Step 4: Verify build and visual check**

```bash
npm run build && npm start
```

Open `http://localhost:3000`. Confirm:
- Headings still render in Cormorant Garamond (serif, elegant)
- Body/UI text still renders in Instrument Sans / Montserrat
- No font-related console errors

- [ ] **Step 5: Commit**

```bash
git add app/layout.js tailwind.config.js
git commit -m "perf: migrate Google Fonts to next/font, remove unused Cinzel and Playfair Display"
```

---

## Task 3: Fix hero aura orb non-composited animations

**Files:**
- Modify: `app/components/HeroSection.js`

The two `motion.div` aura orbs in `HeroSection` animate `opacity` alongside `scale`/`x`/`y`. Animating `opacity` on an element with `filter: blur()` forces the browser to repaint on every frame. Removing `opacity` from `animate` and setting it statically lets the browser keep the element on its own GPU layer.

- [ ] **Step 1: Fix the primary (lavender) aura orb**

In `app/components/HeroSection.js`, find the primary glow orb (around line 317). Replace it:

```jsx
// Before
<motion.div
  animate={{
    scale: [1, 1.1, 1],
    opacity: [0.2, 0.3, 0.2],
    x: [0, 40, 0],
    y: [0, -20, 0],
  }}
  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
  className="absolute -top-[10%] -left-[5%] w-[70%] h-[70%] rounded-full blur-[100px]"
  style={{ background: 'radial-gradient(circle, rgba(196,167,254,0.3) 0%, transparent 75%)' }}
/>

// After
<motion.div
  animate={{
    scale: [1, 1.1, 1],
    x: [0, 40, 0],
    y: [0, -20, 0],
  }}
  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
  className="absolute -top-[10%] -left-[5%] w-[70%] h-[70%] rounded-full blur-[100px]"
  style={{
    background: 'radial-gradient(circle, rgba(196,167,254,0.25) 0%, transparent 75%)',
    willChange: 'transform',
  }}
/>
```

- [ ] **Step 2: Fix the secondary (rose) aura orb**

Find the secondary glow orb (around line 329). Replace it:

```jsx
// Before
<motion.div
  animate={{
    scale: [1.1, 1, 1.1],
    opacity: [0.15, 0.25, 0.15],
    x: [0, -30, 0],
    y: [0, 30, 0],
  }}
  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
  className="absolute -bottom-[15%] -right-[5%] w-[60%] h-[60%] rounded-full blur-[80px]"
  style={{ background: 'radial-gradient(circle, rgba(216,180,254,0.2) 0%, transparent 75%)' }}
/>

// After
<motion.div
  animate={{
    scale: [1.1, 1, 1.1],
    x: [0, -30, 0],
    y: [0, 30, 0],
  }}
  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
  className="absolute -bottom-[15%] -right-[5%] w-[60%] h-[60%] rounded-full blur-[80px]"
  style={{
    background: 'radial-gradient(circle, rgba(216,180,254,0.20) 0%, transparent 75%)',
    willChange: 'transform',
  }}
/>
```

- [ ] **Step 3: Verify visual appearance**

```bash
npm start
```

Open `http://localhost:3000`. The hero section should look identical — the orbs are set to a fixed midpoint opacity that matches the original animated average. No flickering or disappearing orbs.

- [ ] **Step 4: Commit**

```bash
git add app/components/HeroSection.js
git commit -m "perf: remove opacity animation from hero aura orbs to enable GPU compositing"
```

---

## Task 4: Lazy-load below-fold home sections

**Files:**
- Modify: `app/page.js`

`FeaturedProducts`, `ForYouSection`, `EditorialShowcase`, and `SocialFeed` are below the fold. Their client JS shouldn't block initial interactivity. Wrapping in `dynamic()` defers their hydration. `HeroSection` and `Categories` remain statically imported — they are above the fold.

- [ ] **Step 1: Add dynamic imports to page.js**

Open `app/page.js`. The current imports are:

```js
import { HeroSection } from './components/HeroSection';
import { Categories } from './components/Categories';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ForYouSection } from './components/ForYouSection';
import { EditorialShowcase } from './components/EditorialShowcase';
import { SocialFeed } from './components/SocialFeed';
```

Replace with:

```js
import dynamic from 'next/dynamic';
import { HeroSection } from './components/HeroSection';
import { Categories } from './components/Categories';

const FeaturedProducts  = dynamic(() => import('./components/FeaturedProducts').then(m => ({ default: m.FeaturedProducts })),   { loading: () => <div style={{ minHeight: 480 }} /> });
const ForYouSection     = dynamic(() => import('./components/ForYouSection').then(m => ({ default: m.ForYouSection })),         { loading: () => <div style={{ minHeight: 400 }} /> });
const EditorialShowcase = dynamic(() => import('./components/EditorialShowcase').then(m => ({ default: m.EditorialShowcase })), { loading: () => <div style={{ minHeight: 480 }} /> });
const SocialFeed        = dynamic(() => import('./components/SocialFeed').then(m => ({ default: m.SocialFeed })),               { loading: () => <div style={{ minHeight: 320 }} /> });
```

> **Note:** The `.then(m => ({ default: m.ComponentName }))` pattern is required when the module uses named exports instead of default exports. Check the export style of each component: if it uses `export default function ...` use the simpler form `dynamic(() => import('./components/X'))`. If it uses `export function X` (named export, as seen in HeroSection), use the `.then()` pattern above.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build completes. You should see new dynamic chunks created for the four lazy-loaded components in the build output.

- [ ] **Step 3: Visual check**

```bash
npm start
```

Open `http://localhost:3000`. Scroll down — all sections should appear (the skeleton placeholders flash briefly then fill). No missing content.

- [ ] **Step 4: Commit**

```bash
git add app/page.js
git commit -m "perf: lazy-load below-fold home sections to reduce initial JS parse time"
```

---

## Task 5: Fix MobileBottomNav accessibility

**Files:**
- Modify: `app/components/MobileBottomNav.js`

The five nav buttons are icon-only with no accessible label, and the clickable area is 36px — below the 44px minimum.

- [ ] **Step 1: Add aria-label and aria-current to nav buttons**

Open `app/components/MobileBottomNav.js`. Find the `<Button>` inside the `navItems.map(...)` (around line 112). Add `aria-label` and `aria-current`:

```jsx
// Before
<Button
  key={item.id}
  type="button"
  variant="navTab"
  onClick={() => handleItemClick(item.id)}
  className={cn(
    isActive ? 'text-[#1d1d1f]' : 'text-gray-400 hover:text-gray-500'
  )}
>

// After
<Button
  key={item.id}
  type="button"
  variant="navTab"
  aria-label={item.label}
  aria-current={isActive ? 'page' : undefined}
  onClick={() => handleItemClick(item.id)}
  className={cn(
    'min-h-[44px] min-w-[44px]',
    isActive ? 'text-[#1d1d1f]' : 'text-gray-400 hover:text-gray-500'
  )}
>
```

- [ ] **Step 2: Verify visually**

```bash
npm start
```

Open `http://localhost:3000` on a mobile viewport (or DevTools mobile emulation). Bottom nav should look identical. Inspect a nav button in DevTools → Accessibility panel — it should show the label (e.g., "Home", "Wishlist").

- [ ] **Step 3: Commit**

```bash
git add app/components/MobileBottomNav.js
git commit -m "a11y: add aria-label and aria-current to mobile nav buttons, fix touch target size"
```

---

## Task 6: Fix SideCart accessibility

**Files:**
- Modify: `app/components/SideCart.js`

Four buttons have no accessible label: the close button (icon only), qty decrement (`-`), qty increment (`+`), and remove item (trash icon).

- [ ] **Step 1: Add aria-labels to all four buttons**

Open `app/components/SideCart.js`.

**Close button** (around line 35):
```jsx
// Before
<Button variant="ghost" size="sm" onClick={closeCart}>
  <X className="h-6 w-6" />
</Button>

// After
<Button variant="ghost" size="sm" onClick={closeCart} aria-label="Close cart">
  <X className="h-6 w-6" />
</Button>
```

**Qty decrement button** (around line 69):
```jsx
// Before
<Button
  variant="outline"
  size="sm"
  onClick={() => updateQuantity(item.id, item.quantity - 1)}
  disabled={item.quantity <= 1}
>
  -
</Button>

// After
<Button
  variant="outline"
  size="sm"
  onClick={() => updateQuantity(item.id, item.quantity - 1)}
  disabled={item.quantity <= 1}
  aria-label={`Decrease quantity of ${item.name}`}
>
  -
</Button>
```

**Qty increment button** (around line 78):
```jsx
// Before
<Button
  variant="outline"
  size="sm"
  onClick={() => updateQuantity(item.id, item.quantity + 1)}
>
  +
</Button>

// After
<Button
  variant="outline"
  size="sm"
  onClick={() => updateQuantity(item.id, item.quantity + 1)}
  aria-label={`Increase quantity of ${item.name}`}
>
  +
</Button>
```

**Remove button** (around line 87):
```jsx
// Before
<Button
  variant="ghost"
  className="font-medium text-red-600 hover:text-red-500"
  onClick={() => removeFromCart(item.id)}
>
  <Trash2 className="h-4 w-4" />
</Button>

// After
<Button
  variant="ghost"
  className="font-medium text-red-600 hover:text-red-500"
  onClick={() => removeFromCart(item.id)}
  aria-label={`Remove ${item.name} from cart`}
>
  <Trash2 className="h-4 w-4" />
</Button>
```

- [ ] **Step 2: Fix logo link in Header**

Open `app/components/Header.js`. Find the logo `<Link>` (the one wrapping the `<Image>` for the brand logo). If the `<Image>` has `alt=""` or no alt, add a descriptive alt:

```jsx
// Before
<Link href="/">
  <Image src="/Adobe Express - file (5).png" alt="" ... />
</Link>

// After
<Link href="/">
  <Image src="/Adobe Express - file (5).png" alt="Naya Lumière Cosmetics — home" ... />
</Link>
```

If the `<Image>` already has a meaningful alt, no change is needed. The link inherits its accessible name from the image alt text.

- [ ] **Step 3: Verify**

```bash
npm start
```

Open the site, add a product to cart, open the side cart. Inspect the close/qty/remove buttons in DevTools → Accessibility. Each should have a meaningful label. Also inspect the header logo link — it should show "Naya Lumière Cosmetics — home" as its accessible name.

- [ ] **Step 4: Commit**

```bash
git add app/components/SideCart.js app/components/Header.js
git commit -m "a11y: add aria-labels to SideCart buttons and fix logo link accessible name"
```

---

## Task 7: Fix contrast ratios

**Files:**
- Modify: `app/globals.css`

`--cl-text-light` is `rgba(59,7,100,0.50)` — a semi-transparent deep purple on near-white background. Contrast ratio is ~3.2:1, failing WCAG AA (4.5:1 required for normal text). Increasing opacity to `0.70` brings it to ~5.1:1.

- [ ] **Step 1: Update the CSS variable**

Open `app/globals.css`. Find the `--cl-text-light` variable definition and update it:

```css
/* Before */
--cl-text-light: rgba(59, 7, 100, 0.50);

/* After */
--cl-text-light: rgba(59, 7, 100, 0.70);
```

- [ ] **Step 2: Check for gray-400 text on white**

Search the codebase for `text-gray-400` used for informational text (not decorative dividers):

```bash
grep -rn "text-gray-400" app/components/ --include="*.js" | head -30
```

For any instance where `text-gray-400` conveys information (labels, descriptions, captions), replace with `text-gray-500`. Purely decorative separator lines or icons can stay. Common locations: card subtitles, form helper text, empty state descriptions.

- [ ] **Step 3: Visual check**

```bash
npm start
```

Open `http://localhost:3000`. The text using `--cl-text-light` (body copy, subtle labels) should appear slightly darker but still visually lighter than the primary text. No jarring visual change.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "a11y: increase --cl-text-light opacity for WCAG AA contrast compliance"
```

---

## Task 8: Add security headers

**Files:**
- Modify: `next.config.mjs`

Add HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP, Permissions-Policy enforced immediately. Add CSP in report-only mode — violations log to the console but nothing is blocked.

- [ ] **Step 1: Add headers() function to next.config.mjs**

Open `next.config.mjs`. Replace the entire file with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Report-only — logs violations to console, enforces nothing.
            // Once the violation log is clean across all pages (home, checkout,
            // account, chat), rename this key to 'Content-Security-Policy'.
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.stripe.com *.vercel-insights.com vitals.vercel-insights.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com data:",
              "img-src 'self' data: blob: *.cloudinary.com res.cloudinary.com *.unsplash.com *.nayalc.com nayalc.com placehold.co via.placeholder.com",
              "connect-src 'self' *.stripe.com wss://nayalc.com *.vercel-insights.com vitals.vercel-insights.com",
              "frame-src *.stripe.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/apple-developer-merchantid-domain-association',
        destination: '/.well-known/apple-developer-merchantid-domain-association',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.nayalc.com', port: '', pathname: '/uploads/**' },
      { protocol: 'http',  hostname: 'localhost',       port: '5000', pathname: '/uploads/**' },
      { protocol: 'http',  hostname: '217.165.41.108',  port: '5000', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'gernetic.com',    port: '', pathname: '/cdn/shop/files/**' },
      { protocol: 'https', hostname: 'zorah.ca',        port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co',    port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'img.freepik.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', port: '', pathname: '/**' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify headers are present**

```bash
npm run build && npm start
```

In another terminal:
```bash
curl -I http://localhost:3000 | grep -E "strict-transport|x-frame|x-content|referrer|cross-origin|permissions|content-security"
```

Expected output includes all 7 headers. Example:
```
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
cross-origin-opener-policy: same-origin
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy-report-only: default-src 'self'; ...
```

- [ ] **Step 3: Check CSP violations in browser**

Open `http://localhost:3000` in a browser. Open DevTools → Console. Navigate through: home → product page → cart → checkout. Look for any lines starting with `[Report Only]`. If you see violations, note the blocked resource and add it to the appropriate CSP directive in `next.config.mjs`.

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs
git commit -m "security: add HSTS, XFO, XCTO, RP, COOP, Permissions-Policy, CSP report-only"
```

---

## Task 9: Fix console errors on load

**Files:**
- Various (determined during verification)

Lighthouse Best Practices docks points for any console error logged during the audited page load. With Tasks 1–8 complete, most errors should already be gone (Socket.io connection errors are resolved by Task 1). This task sweeps up any remaining errors.

- [ ] **Step 1: Run a production build and check console**

```bash
npm run build && npm start
```

Open `http://localhost:3000` in a browser. Open DevTools → Console, filter to **Errors only**. Do NOT interact with the page — Lighthouse audits the load, not interactive use.

Document every error you see. Common patterns and fixes:

**React hydration mismatch** (message: "Hydration failed because the server rendered HTML didn't match the client"):
- Usually caused by code that reads `window`, `Date.now()`, or `Math.random()` during render.
- Fix: wrap in `useEffect` or use `useState` with an initial server-safe value.
- Example fix:
  ```js
  // Before (causes mismatch)
  const timestamp = Date.now();

  // After
  const [timestamp, setTimestamp] = useState(null);
  useEffect(() => setTimestamp(Date.now()), []);
  ```

**Missing key prop** (message: "Each child in a list should have a unique key prop"):
- Fix: add `key={uniqueId}` to the outermost element in every `.map()` call missing one.

**Failed to load resource** (network 404):
- If a static asset 404s, check the file exists in `public/` or the URL is correct.

- [ ] **Step 2: Fix each identified error**

Apply fixes file by file. After each fix, re-run `npm start` and confirm the error is gone.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Fix any new lint errors introduced by Tasks 1–8.

- [ ] **Step 4: Commit**

```bash
git add <files changed>
git commit -m "fix: resolve console errors on page load for Lighthouse Best Practices score"
```

---

## Task 10: Final verification

- [ ] **Step 1: Full production build**

```bash
npm run build
```

Expected: clean build, no errors, no warnings about missing exports.

- [ ] **Step 2: Run Lighthouse on localhost**

Install `lighthouse` CLI if not already present:
```bash
npx lighthouse http://localhost:3000 --view --preset=desktop
```

Then mobile:
```bash
npx lighthouse http://localhost:3000 --view
```

**Targets:**
- Performance Desktop: 85+
- Performance Mobile: 75+
- TBT Desktop: <500ms
- Accessibility: 90+
- Best Practices: 96+ (100 if console errors are fully clear)

If any metric is below target, check which audit failed and trace it back to the relevant task.

- [ ] **Step 3: Deploy and re-run PageSpeed Insights**

Push to production and re-run the PageSpeed Insights report at `pagespeed.web.dev`. The production CDN (Vercel Edge) adds additional improvements (HTTP/2, edge caching) not present in the localhost test.

- [ ] **Step 4: Monitor CSP violations**

After deploying, navigate through all key flows in production (home → browse → product → cart → checkout → account → chat). Check DevTools console for `[Report Only]` CSP violations. When none are seen across a complete session, upgrade the header in `next.config.mjs`:

```js
// Before
key: 'Content-Security-Policy-Report-Only',

// After
key: 'Content-Security-Policy',
```

Redeploy. Verify checkout (Stripe) and chat (Socket.io) still function correctly.

- [ ] **Step 5: Final commit**

```bash
git add next.config.mjs
git commit -m "security: enforce CSP after verifying report-only violations are clear"
```
