# Naya Lumière Cosmetics - UI/UX Enhancement Roadmap

This roadmap outlines the steps to unify the design language, improve legibility, and streamline the visual identity of the Naya Lumière Cosmetics website.

## Phase 1: Brand Identity & Logo Refinement
- [ ] **Navbar Primacy**: Maintain the logo in the fixed Navbar as the primary brand anchor.
- [ ] **Hero Logo Removal**: Remove the secondary logo from the `HeroSection.js` to avoid redundancy and declutter the first fold.

## Phase 2: Typography & Style Unification
- [ ] **Hero Banner Typography**: 
    - Update the subtitle and headline styles in the `HeroSection.js`.
    - Adopt the "Join the Lumière Club" aesthetic: High-contrast mix of Serif Italic (`Cormorant Garamond`) and Sans-Serif Black (`Instrument Sans`).
    - Implement the premium silver-to-gray text gradient: `bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500`.
- [ ] **Global Font Standards**: 
    - Audit all sections to ensure consistency with the established luxury typography scale.
    - Standardize color usage for headings using the premium dark-gray palette.

## Phase 3: Color Palette Unification
- [ ] **Homepage Color Sync**: 
    - Apply the "Blush Pink" theme (`var(--cl-bg-rose)` or `#fff0f8`) across the entire homepage.
    - Ensure seamless transitions between the Hero, Categories, and Product sections by removing disparate background colors.

## Phase 4: Product Display Optimization
- [ ] **Product Card Clarity**:
    - Update `ProductCard.js` to improve brand name legibility.
    - **Action**: Change the font weight to bold/black, slightly increase the font size (e.g., to `text-[11px]`).
    - **Letter Spacing**: Reduce the horizontal space between letters (tracking) to make the brand name appear more compact and modern (e.g., change from `tracking-[0.3em]` to `tracking-tight` or a minimal custom value).
    - Ensure the brand name is clearly visible even on smaller mobile screens.

## Phase 5: Consistency Audit
- [ ] **Section Pass**: Review all components (Newsletter, FeaturedProducts, Categories) to verify they adhere to the unified font, color, and style guidelines.
- [ ] **Final Polish**: Verify that the "Lumière Club" font and style are effectively integrated as the primary design motif across the website.
