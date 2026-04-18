# Auth Page Redesign — Cloud Luxe Lavender

**Date:** 2026-04-18  
**File:** `app/auth/page.js`  
**Status:** Approved

---

## Goal

Fully retheme the login and register page (`/auth`) to the Cloud Luxe lavender design system. All `brand-pink` / `brand-blue` / `bg-black` / `#FAF9F6` references are replaced with Cloud Luxe tokens. No changes to logic, routing, or form submission.

---

## Typography Rules (apply everywhere on this page)

- **No letter-spacing** — remove every `tracking-*` class. Use `tracking-normal` if a reset is needed.
- **Title Case** — every label, button text, heading, placeholder, and UI string must use Title Case (first letter of each word capitalized). No ALL CAPS, no all-lowercase.

---

## Layout

Split two-column on desktop (`lg:grid-cols-12`):
- **Left:** `lg:col-span-5` — atmospheric lavender panel (no product images)
- **Right:** `lg:col-span-7` — glass form card

On mobile: form only (left panel hidden with `hidden lg:flex`).

---

## Page Shell

- Background: `bg-[#fdf8ff]` (`--cl-bg`)
- Remove the `transparenttextures.com` texture overlay entirely
- Top nav bar stays (Back to store ← + brand badge), but colors updated:
  - Back button: `text-purple-400 hover:text-purple-700`
  - Brand badge: `bg-white/75 border-[rgba(216,180,254,0.3)]` · dot: `bg-[rgb(196,167,254)]` · text: `text-[#3b0764] font-black`
  - Badge text changes to `"Naya Lumière Cosmetics"` (Title Case, no tracking)

---

## Left Panel — Atmospheric Lavender

Full-height panel, no product images. Everything positioned with flexbox (`flex flex-col justify-between`).

**Background:**  
`bg-gradient-to-br from-[#f3e8ff] via-[#fdf4ff] to-[#fce7f3]`

**Aura orbs (3 total):**
- Top-left: `w-72 h-72 bg-[rgba(216,180,254,0.45)] blur-[80px]`
- Bottom-right: `w-60 h-60 bg-[rgba(249,168,212,0.3)] blur-[70px]`
- Center-mid: `w-40 h-40 bg-[rgba(196,167,254,0.2)] blur-[50px]`
- All: `absolute rounded-full pointer-events-none`

**Top — brand indicator:**
```
● Naya Lumière Cosmetics
```
- Dot: `w-2 h-2 rounded-full` with soft lavender gradient + `shadow-[0_0_10px_rgba(147,51,234,0.4)]`
- Text: `text-[10px] font-black text-[#3b0764]`

**Center — brand quote:**
```
✦

"A commitment
to the purity
of light."

—— Geneva Laboratory ——
```
- `✦` icon: `text-[rgba(196,167,254,0.8)] text-xl mb-3`
- Quote: `font-serif italic text-[22px] leading-relaxed text-[#3b0764]`
- Attribution: two `w-6 h-px bg-[rgba(147,51,234,0.25)]` lines flanking `text-[9px] font-semibold text-[rgba(107,33,168,0.5)]`

**Bottom — member benefits card:**
- Container: `bg-white/60 backdrop-blur-2xl border border-[rgba(216,180,254,0.4)] rounded-2xl p-5`
- Title: `text-[10px] font-black text-[#3b0764] mb-2` — `"Member Privileges"`
- Items: flex row with `w-1.5 h-1.5 rounded-full` dot (soft lavender gradient) + `text-[10px] text-[#6b21a8] font-medium`
- Three items: `"Bespoke Ai Skincare Analysis"` / `"Avant-Première Launch Access"` / `"Boutique Exclusive Curation"`

---

## Right Panel — Form Card

```
bg-white/82 backdrop-blur-3xl
border-l border-[rgba(216,180,254,0.25)]
p-10 lg:p-14
flex flex-col justify-center
```

### Tab Switcher

```
bg-[rgba(248,240,255,0.7)] border border-[rgba(216,180,254,0.25)] rounded-full p-1
```

- Inactive tab: `text-[rgba(107,33,168,0.45)] font-bold text-[11px]`
- Active tab: `bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)] text-white shadow-[0_4px_16px_rgba(126,105,230,0.35)] rounded-full`
- Tab labels: `"Sign In"` and `"Register"` (Title Case)

### Form Heading Pattern (both Login and Register)

Eyebrow:
```jsx
<span className="w-5 h-px bg-[rgba(216,180,254,0.6)]" />
<span className="text-[9px] font-bold text-[rgba(147,51,234,0.6)]">Secure Access</span>
```
(Register eyebrow text: `"New Account"`)

Heading — serif italic body + font-black gradient accent:
```jsx
<h3 className="font-serif italic text-[26px] leading-snug text-[#3b0764]">
  Welcome Back <br />
  <strong className="not-italic font-black cl-gradient-text">To Your Sanctuary</strong>
</h3>
```
Register heading: `"Create Your"` / `"Personal Account"`

Sub-text: `text-[12px] text-[rgba(59,7,100,0.45)] font-medium`

### Input Fields

```
h-12 rounded-[14px]
border-[1.5px] border-[rgba(216,180,254,0.35)]
bg-[rgba(248,240,255,0.5)]
focus:border-[rgba(147,51,234,0.5)]
focus:bg-white
focus:ring-4 focus:ring-[rgba(196,167,254,0.15)]
text-[#3b0764] text-sm font-medium
outline-none transition-all duration-300
```

- Icon color (unfocused): `text-[rgba(196,167,254,0.7)]`
- Icon color (focused, via `group-focus-within`): `text-[#9333ea]`
- Labels: `text-[10px] font-bold text-[rgba(107,33,168,0.55)]` — Title Case, no tracking

### "Forgot Password?" Link

`text-[9px] font-bold text-[rgba(147,51,234,0.55)] hover:text-[#9333ea]` — Title Case

### "Remember Me" Checkbox

- Checkbox: `border-[rgba(196,167,254,0.5)] bg-[rgba(248,240,255,0.5)] rounded`
- Label: `text-[10px] text-[rgba(59,7,100,0.45)] font-medium` — `"Remember Me"`

### Primary Button

```
w-full h-12 rounded-full
bg-gradient-to-r from-[rgb(216,180,254)] to-[rgb(126,105,230)]
text-white text-[11px] font-black uppercase
shadow-[0_8px_24px_rgba(126,105,230,0.35)]
hover:shadow-[0_12px_32px_rgba(126,105,230,0.45)]
active:scale-95 transition-all duration-300
flex items-center justify-center gap-3
```

- Login button: `"Sign In"` + `<ArrowRight size={14} />`
- Register button: `"Create Account"` + `<ArrowRight size={14} />`
- Forgot password button: `"Send Reset Link"` + `<ArrowRight size={14} />`
- Loading state: lavender spinner `border-white/30 border-t-white`

### "Or Continue With" Divider

- Lines: `border-[rgba(216,180,254,0.25)]`
- Text: `text-[9px] font-semibold text-[rgba(147,51,234,0.35)]` — `"Or Continue With"`

### Social Buttons (Google, Facebook)

```
h-10 rounded-xl
border-[1.5px] border-[rgba(216,180,254,0.3)]
bg-[rgba(248,240,255,0.4)]
text-[10px] font-bold text-[#6b21a8]
hover:bg-[rgba(248,240,255,0.8)] transition-all
```

- Google icon: `text-[rgba(196,167,254,0.7)] group-hover:text-[#9333ea]`
- Facebook icon: `text-[rgba(196,167,254,0.7)] group-hover:text-[#9333ea]`

### Forgot Password Sub-form

Same structure, replaces Login content when triggered:
- Back button: `text-[rgba(107,33,168,0.5)] hover:text-[#9333ea]` — `"← Back To Sign In"`
- Heading: `"Restore Access"` (serif italic, same size)
- Sub: `"Enter your email and we'll send you a secure link to reset your password."`
- Success msg: `bg-[rgba(240,253,244,0.8)] border-[rgba(187,247,208,0.5)] text-green-700`
- Error msg: `bg-[rgba(254,242,242,0.8)] border-[rgba(254,202,202,0.5)] text-red-600`

---

## Page Footer

```
"Est. 2026 — Naya Atelier Privé"
```
- `text-[10px] font-medium text-[rgba(107,33,168,0.35)]` — Title Case, no tracking
- Icons: `ShieldCheck`, `Lock`, `Sparkles` in `text-[rgba(196,167,254,0.4)]`

---

## What Does NOT Change

- All form logic (`handleSubmit`, `login`, `register`, `forgot-password` API calls)
- Router navigation (`router.push('/')`)
- `useAuth`, `useRouter` hooks
- Tab switching state (`authMode`)
- Framer Motion `initial/animate` entry animations
- The `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` Radix structure
- Social buttons remain non-functional placeholders (no OAuth wired)
- Image imports — left panel has no images, so product image `<Image>` tags are removed
