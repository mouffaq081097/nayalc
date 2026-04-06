# Naya Lumière Cosmetics Enhancement Plan

## Phase 1: Chat UI Modernization & AI Integration
- **UI Overhaul (`app/components/ChatWidget.js`):** Redesign the chat window to be more compact, modern, and floating (similar to Shopify Inbox or Intercom). Add typing indicators, read receipts, and better timestamp formatting. Implement "Quick Reply" chips for common questions.
- **AI Suggestions:** Integrate an AI endpoint (`app/api/ai`) to intercept incoming user messages. If support is offline, the AI can suggest answers based on store FAQs or product data before routing to a human agent.
- **Admin Email Notifications:** Update the `/api/chat/conversation/[id]/messages` endpoint to trigger the existing `sendNewChatMessageNotificationEmail` function in `lib/mail.js` whenever a user sends a message and no admin is currently active in the chat room.

## Phase 2: Unified Email Design System
- **Global Email Template (`lib/mail.js`):** Create a reusable wrapper template for all emails (Welcome, Order Confirmation, Admin Notifications).
- **Branding Consistency:** Inject the exact logo used in the Navbar at the top of every email (hosted securely). Standardize the font family and use the exact brand colors (`brand-pink`, `brand-blue`). Ensure buttons, footers, and spacing are identical across all automated emails.

## Phase 3: Category Clarity & Admin Portal Gaps
- **Customer Side:** Add descriptive subtext and visual banners to Category pages (`app/collections/page.js`, `app/SkinCare/page.js`). Implement "Educational Tooltips" or short descriptions under category names so users know exactly what "Clinical Botanicals" or "Serums" target.
- **Admin Portal Gaps:** Update `app/admin/categories` to allow admins to upload Category Banners and write Rich Descriptions, resolving the gap where categories might only have a name and slug.

## Phase 4: Product Images Configuration
- **Admin Side (`app/admin/products`):** Verify the product creation/edit form has a multi-image upload drag-and-drop zone. Ensure images are uploaded to Cloudinary and saved as an array (`additionalImages: []`) in the database.
- **User Side (`app/product/[id]` & `app/components/ProductCard.js`):** Implement an image carousel or thumbnail gallery on the product details page. Implement "hover to swap image" functionality on the product cards in the store.

## Phase 5: Noon-Inspired Admin Dashboard
- **Dashboard Redesign (`app/admin/page.jsx`):** Replace the current layout with a grid-based Noon/Shopify style dashboard.
- **Top Row:** Key metrics cards (Total Sales, Orders Today, Active Visitors, Pending Tickets) with trend indicators.
- **Middle Row:** Interactive charts (Revenue over time, Top selling categories).
- **Bottom Row:** Recent Orders table and low-stock alerts side-by-side.

## Phase 6: UI/UX Unification (Typography & Loading States)
- **Typography Consistency:** Define a strict typography scale in `tailwind.config.js` and replace hardcoded values (e.g., `text-[10px]`) to ensure the front-end and admin panel match perfectly.
- **Unified Loading Screens:** Replace the scattered "Loading...", text pulses, and basic spinners with a central `<GlobalLoader />` component using brand colors (pink/blue gradient) or a subtle logo pulse for cohesive transitions.

## Phase 7: Authentication Fixes (Forgot Password)
- **Forgot Password Flow:** Create a `/api/auth/forgot-password` endpoint. Create a "Forgot Password" UI modal/state on `app/auth/page.js`.
- **Reset Mechanism:** Use `lib/mail.js` to send a secure, time-limited password reset link, and create a `/auth/reset-password` page to handle the new password submission.

## Phase 8: Product Categorization & "Shop by Concern" Restructuring
- **Database Schema Updates:** 
  - Update `Categories` table to support `parent_id` for nested categories (e.g., Skincare -> Serums).
  - Create a new relational table `product_concerns` allowing a single product to be tagged with multiple concerns (Anti-Aging, Hydration, etc.).
- **Admin Panel Updates (`app/admin/products` & `categories`):**
  - Add multi-select dropdowns for "Skin Concerns" and structured fields for "Primary Category" and "Brand".
- **Frontend Navigation & Filters (`app/components/Header.js`, `/collections`):**
  - **Primary Categories:** Cleansers, Serums, Moisturizers, Eye/Lip Care, Masks, Sun Care.
  - **Secondary Navigation:** "Shop by Concern" (Anti-Aging, Acne/Oil Control, Dryness/Hydration, Sensitivity, Dullness).
  - **Brand Collections:** Separate pages or filters for GERnétic, Zorah, and Naya Lumière Perfumes.
