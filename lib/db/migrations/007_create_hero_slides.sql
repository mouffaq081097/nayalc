-- Migration: Create hero_slides table
CREATE TABLE IF NOT EXISTS hero_slides (
    id SERIAL PRIMARY KEY,
    eyebrow VARCHAR(255),
    headline TEXT NOT NULL,
    body TEXT,
    cta_text VARCHAR(100),
    cta_href TEXT,
    image_src_mobile TEXT NOT NULL,
    image_src_desktop TEXT NOT NULL,
    is_video_mobile BOOLEAN DEFAULT FALSE,
    is_video_desktop BOOLEAN DEFAULT FALSE,
    image_position VARCHAR(100) DEFAULT 'object-center',
    text_position VARCHAR(50) DEFAULT 'left',
    cta_style VARCHAR(50) DEFAULT 'lavender-cloud',
    scrim_direction VARCHAR(50) DEFAULT 'none',
    text_theme VARCHAR(20) DEFAULT 'light',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_slides_updated_at
    BEFORE UPDATE ON hero_slides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
