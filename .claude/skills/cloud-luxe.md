---
name: cloud-luxe
description: Cloud Luxe design system reference for Naya Lumière Cosmetics. Use when building or modifying any frontend component in this project to ensure consistent Cloud Luxe styling.
type: reference
---

# Cloud Luxe Design System — Naya Lumière Cosmetics

## Brand Rules
- **Logo**: Always use `<Image src="/Adobe Express - file (5).png" />` — never render brand name as plain text in headers/navs
- **Brand name**: Always "Naya Lumière Cosmetics" (full name, never drop "Cosmetics")
- **Brands carried**: GERnétic, Zorah, Naya Lumière Perfumes

## Color Tokens (CSS vars in `app/globals.css`)

```css
--cl-purple: #9333ea          /* Primary */
--cl-pink: #db2777            /* Secondary */
--cl-gradient: linear-gradient(135deg, #9333ea 0%, #db2777 100%)
--cl-gradient-soft: linear-gradient(135deg, #a855f7 0%, #ec4899 100%)
--cl-bg: #fdf8ff              /* Page bg */
--cl-bg-lavender: #f8f0ff     /* Section bg */
--cl-bg-rose: #fff0f8         /* Section bg alt */
--cl-glass: rgba(255,255,255,0.72)
--cl-glass-border: rgba(216,180,254,0.35)
--cl-glass-border-hover: rgba(167,139,250,0.55)
--cl-text-deep: #3b0764       /* Headings */
--cl-text-mid: #6b21a8        /* Secondary text */
--cl-text-soft: #9333ea       /* Labels */
--cl-text-light: rgba(59,7,100,0.50)  /* Body */
--cl-text-muted: rgba(59,7,100,0.35)  /* Captions */
--cl-aura-1: rgba(216,180,254,0.45)   /* Lavender aura */
--cl-aura-2: rgba(249,168,212,0.30)   /* Rose aura */
--cl-shadow-card: 0 8px 32px rgba(147,51,234,0.10)
--cl-shadow-card-hover: 0 20px 48px rgba(147,51,234,0.22)
```

## Utility Classes (defined in `globals.css`)

### Glass Card
```jsx
<div className="cl-glass-card">
  {/* white/72, backdrop-blur-14, lavender border, purple shadow */}
</div>
```

### Gradient Text
```jsx
<span className="cl-gradient-text">Purple to pink gradient text</span>
```

### Gradient Button
```jsx
<button className="cl-gradient-btn px-6 py-3 text-white rounded-full">
  Shop Now
</button>
```

### Ghost Button
```jsx
<button className="cl-ghost-btn px-6 py-3 rounded-full">
  Learn More
</button>
```

### Aura Orbs (background decoration)
```jsx
{/* Large purple aura, top-left */}
<div
  className="cl-aura cl-aura-purple animate-cl-aura-float pointer-events-none absolute"
  style={{ width: 400, height: 400, top: '-10%', left: '-10%' }}
/>
{/* Rose aura, bottom-right */}
<div
  className="cl-aura cl-aura-rose animate-cl-aura-float-slow pointer-events-none absolute"
  style={{ width: 300, height: 300, bottom: '-10%', right: '-10%' }}
/>
```

### Page / Section Backgrounds
```jsx
<section className="hero-radial-cloud-luxe">  {/* gradient mesh hero bg */}
<section style={{ background: 'var(--cl-bg-lavender)' }}>  {/* light lavender section */}
<section style={{ background: 'var(--cl-bg-rose)' }}>  {/* light rose section */}
```

## Tailwind Aliases

| Class | Resolves to |
|-------|-------------|
| `text-cl-deep` | `#3b0764` |
| `text-cl-mid` | `#6b21a8` |
| `text-cl-soft` | `#9333ea` |
| `text-cl-light` | `rgba(59,7,100,0.50)` |
| `text-cl-muted` | `rgba(59,7,100,0.35)` |
| `bg-cl-bg` | `#fdf8ff` |
| `bg-cl-bg-lavender` | `#f8f0ff` |
| `bg-cl-bg-rose` | `#fff0f8` |
| `shadow-cl-card` | purple card shadow |
| `shadow-cl-card-hover` | stronger purple shadow |
| `shadow-cl-glow` | purple glow |
| `shadow-cl-btn` | button purple shadow |
| `animate-cl-aura-float` | 10s float animation |
| `animate-cl-aura-float-slow` | 14s float animation |

## Typography

| Use | Font | Style |
|-----|------|-------|
| Display headings | Cormorant Garamond | italic, weight 300, `--cl-text-deep` |
| Section labels | Montserrat | 9-10px, tracking-[0.4em], uppercase, `--cl-text-soft` |
| Body | Montserrat | 400, 13-15px, `--cl-text-light` |
| Price | any | `cl-gradient-text` |

## Component Patterns

### Section Header
```jsx
<div className="text-center space-y-3">
  <div className="flex items-center justify-center gap-3">
    <span className="w-8 h-px" style={{ background: 'var(--cl-gradient)' }} />
    <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: 'var(--cl-text-soft)' }}>
      Section Label
    </span>
    <span className="w-8 h-px" style={{ background: 'var(--cl-gradient)' }} />
  </div>
  <h2 className="font-serif italic text-3xl" style={{ color: 'var(--cl-text-deep)' }}>
    Heading with <span className="cl-gradient-text font-sans not-italic font-black">Accent</span>
  </h2>
</div>
```

### Card with Glass Treatment
```jsx
<div
  className="cl-glass-card p-6 transition-all duration-300"
  style={{
    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
    boxShadow: isHovered ? 'var(--cl-shadow-card-hover)' : 'var(--cl-shadow-card)',
  }}
>
  content
</div>
```

### Input with Cloud Luxe focus
```jsx
<input
  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
  style={{
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid var(--cl-glass-border)',
  }}
  onFocus={e => {
    e.currentTarget.style.borderColor = 'var(--cl-purple)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,51,234,0.12)';
  }}
  onBlur={e => {
    e.currentTarget.style.borderColor = 'var(--cl-glass-border)';
    e.currentTarget.style.boxShadow = 'none';
  }}
/>
```

## What NOT to do
- Don't use `brand-pink` or `brand-blue` in new code — use `cl-*` vars instead
- Don't render the logo as text — always use the Image component
- Don't use solid white card backgrounds — use `cl-glass-card` or `var(--cl-glass)`
- Don't use black buttons — use `cl-gradient-btn`
- Don't hardcode `#ec4899` or `#2563eb` — those are the old brand colors
