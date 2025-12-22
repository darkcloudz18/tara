-- Remove rickroll URLs - these videos will display as beautiful photo cards
-- First, allow video_url to be NULL
ALTER TABLE curated_videos ALTER COLUMN video_url DROP NOT NULL;

-- Remove the rickroll URLs and youtube_id for videos without working embeds
UPDATE curated_videos
SET video_url = NULL, youtube_id = NULL
WHERE video_url LIKE '%dQw4w9WgXcQ%';

-- Keep only the two working videos with embed capability
-- The rest will show as photo cards with location info
