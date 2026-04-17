-- Migration: Add is_active toggle to products, brands, and categories
-- Run once against the Vercel Postgres database
-- Coupons already have is_active

-- Products: add is_active column (keep existing status field for draft/published semantics)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Brands: add is_active column
ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Categories: add is_active column
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Ensure all existing rows are active
UPDATE products  SET is_active = true WHERE is_active IS NULL;
UPDATE brands    SET is_active = true WHERE is_active IS NULL;
UPDATE categories SET is_active = true WHERE is_active IS NULL;
