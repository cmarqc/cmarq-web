# cmarq-web

Personal portfolio — Next.js 14 (App Router), Tailwind CSS, deployed on Hostinger Node.js web app hosting.

## Development

```bash
npm install
cp .env.example .env   # fill in MySQL credentials (optional in dev)
npm run dev
```

Without database credentials the site runs fine; the photography likes/views counters simply stay hidden.

## Photography likes & views

Each photo on `/photography` has a like button and view counter, stored in MySQL:

- `GET /api/photos/stats` — all counters (plus Instagram data when configured)
- `POST /api/photos/[id]/view` — increment views (deduped per browser session client-side)
- `POST /api/photos/[id]/like` — body `{ "action": "like" | "unlike" }` (deduped via localStorage)

The `photo_stats` table is created automatically on first API call ([db/schema.sql](db/schema.sql) has the reference schema). Endpoints are rate-limited per IP in memory.

### Instagram aggregation (optional)

Set `INSTAGRAM_ACCESS_TOKEN` to fold Instagram likes from [@cmc.snaps](https://www.instagram.com/cmc.snaps) into photo stats. Setup:

1. Convert @cmc.snaps to a **Professional** (Creator/Business) account.
2. Create a Meta app at [developers.facebook.com](https://developers.facebook.com) and add the **Instagram API with Instagram Login** product.
3. Generate a long-lived access token (60-day expiry — needs periodic refresh via `GET /refresh_access_token`).
4. To map a specific gallery photo to its Instagram post, set the photo's `instagram` field in [data/photos.ts](data/photos.ts) to the post shortcode — the part after `/p/` in the post URL. Mapped photos show "+N likes on Instagram" in the lightbox.

Instagram data is cached server-side for 1 hour and the site degrades gracefully if the token expires or the API is down.

## Deployment (Hostinger)

The site runs as a Node.js web app (SSR + API routes), so it can no longer deploy to GitHub Pages — the old workflow ([.github/workflows/nextjs.yml](.github/workflows/nextjs.yml)) is disabled and can be deleted once Hostinger is live.

1. In hPanel, create a **Node.js web app** and connect this GitHub repo (framework auto-detected).
2. Create a MySQL database in hPanel → Databases, and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (and optionally `INSTAGRAM_ACCESS_TOKEN`) in the app's environment variables.
3. Point the domain's DNS at Hostinger.
