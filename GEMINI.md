# Naya Lumière Cosmetics Enhancement Plan

## ✅ Completed Enhancements
- **Unified Email Design System (Phase 2):** Implemented a reusable `emailWrapper` in `lib/mail.js` with Cloud Luxe branding (lavender/purple), brand header, and consistent styling across all 10+ automated email types.
- **Marketing Campaign Studio:** Advanced admin tool for creating and sending targeted email campaigns with pre-built professional templates and searchable user selection.
- **Account Loyalty Integration:** Added dedicated Loyalty tab to the user account page showing points, tier progression, and transaction history.
- **Admin Payments Dashboard:** Integrated Stripe balance tracking, manual payout triggers, and automated transaction/payout notification emails.
- **UI/UX Fixes:** Fixed profile image overflow in Header, resolved `toLocaleString` undefined errors in loyalty/account pages, and improved modal accessibility.
- **SEO Optimization:** Implemented global metadata, robots.txt, and automated sitemap generation for products, categories, and brands.

## Phase 1: Chat UI Modernization & AI Integration
- **UI Overhaul (`app/components/ChatWidget.js`):** Redesign the chat window to be more compact, modern, and floating. Add typing indicators and read receipts.
- **AI Suggestions:** Integrate an AI endpoint (`app/api/ai`) to intercept incoming user messages and suggest answers based on store FAQs.
- **Admin Email Notifications (Done):** Admin notification triggers when a user sends a message and no admin is active.

## Phase 3: Category Clarity & Admin Portal Gaps
- **Customer Side:** Add descriptive subtext and visual banners to Category pages. Implement "Educational Tooltips" under category names.
- **Admin Portal Gaps:** Update `app/admin/categories` to allow admins to upload Category Banners and write Rich Descriptions.

## Phase 4: Product Images Configuration
- **Admin Side (`app/admin/products`):** Verify multi-image upload drag-and-drop zone with Cloudinary integration.
- **User Side (`app/product/[id]`):** Implement image carousel or thumbnail gallery on product details page.

## Phase 5: Noon-Inspired Admin Dashboard
- **Dashboard Redesign (`app/admin/page.jsx`):** Replace current layout with a grid-based Noon/Shopify style dashboard showing key metrics, interactive charts, and recent orders.

## Phase 6: UI/UX Unification (Typography & Loading States)
- **Typography Consistency:** Define strict typography scale in `tailwind.config.js`.
- **Unified Loading Screens:** Central `<GlobalLoader />` component with brand colors.

## Phase 7: Authentication Fixes (Forgot Password)
- **Forgot Password Flow (Done):** Implemented `/api/auth/forgot-password` and `sendPasswordResetEmail` in `lib/mail.js`.
- **Reset Mechanism:** Create `/auth/reset-password` page to handle new password submission.

## Phase 8: Product Categorization & "Shop by Concern" Restructuring
- **Database Schema Updates:** Support `parent_id` for nested categories and create `product_concerns` table.
- **Admin Panel Updates:** Add multi-select dropdowns for "Skin Concerns" and structured fields for Brand/Category.
- **Frontend Navigation:** Implement "Shop by Concern" navigation and Brand Collections.
