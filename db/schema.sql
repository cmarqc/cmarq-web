-- Likes/Views storage for the photography page.
-- The app creates this table automatically on first API call (see lib/db.ts);
-- this file exists for reference and for manual setup via phpMyAdmin/hPanel.

CREATE TABLE IF NOT EXISTS photo_stats (
  photo_id VARCHAR(64) NOT NULL PRIMARY KEY,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  likes INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
