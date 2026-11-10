-- Likes/Views storage for the photography page.
-- The app creates this table automatically on first API call (see lib/db.ts);
-- this file exists for reference and for manual setup via phpMyAdmin/hPanel.

CREATE TABLE IF NOT EXISTS photo_stats (
  photo_id VARCHAR(64) NOT NULL PRIMARY KEY,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  likes INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Photography storefront ──────────────────────────────────────────────────
-- Orders and their downloadable items. The app also creates these automatically
-- on first checkout (see lib/db.ts). `stripe_session_id` is UNIQUE so webhook
-- retries and the success-page fallback can't create duplicate orders.

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  stripe_session_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_payment_intent VARCHAR(255) NULL,
  customer_email VARCHAR(320) NULL,
  -- Random bearer token in the buyer's purchase URL (/purchases/<token>).
  access_token CHAR(64) NOT NULL UNIQUE,
  amount_total INT UNSIGNED NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status VARCHAR(32) NOT NULL DEFAULT 'paid',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(128) NOT NULL,
  product_type VARCHAR(32) NOT NULL,
  license VARCHAR(32) NOT NULL DEFAULT 'personal',
  title VARCHAR(255) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  download_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS download_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_item_id BIGINT UNSIGNED NOT NULL,
  ip VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_download_events_item (order_item_id),
  CONSTRAINT fk_download_events_item FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE
);

-- ── Instagram access token ──────────────────────────────────────────────────
-- Single row (id = 1) holding the live long-lived Instagram token so it can be
-- refreshed automatically — a refresh returns a NEW token string, which has to
-- be persisted somewhere writable. Seeded from INSTAGRAM_ACCESS_TOKEN; the app
-- creates this table automatically too (see lib/db.ts).
--
-- `seed_fingerprint` is the SHA-256 of the INSTAGRAM_ACCESS_TOKEN this row grew
-- from, so that hand-rotating the env var is detected and takes over the row.
-- Timestamps are epoch milliseconds (BIGINT) to stay free of server/DB timezone
-- disagreements; read them with FROM_UNIXTIME(expires_at / 1000).

CREATE TABLE IF NOT EXISTS instagram_token (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  access_token TEXT NOT NULL,
  seed_fingerprint CHAR(64) NOT NULL,
  expires_at BIGINT UNSIGNED NULL,
  refreshed_at BIGINT UNSIGNED NULL,
  -- Most recent alert emailed about this token, so the same warning isn't
  -- repeated on every run: warning | urgent | refresh_failed | expired.
  alert_stage VARCHAR(16) NULL,
  alert_sent_at BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
