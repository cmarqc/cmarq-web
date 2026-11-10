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
3. Generate a long-lived access token and set it as `INSTAGRAM_ACCESS_TOKEN`. These expire after 60 days, but the app renews them for you — see [Token renewal](#token-renewal) below.
4. To map a specific gallery photo to its Instagram post, set the photo's `instagram` field in [data/photos.ts](data/photos.ts) to the post shortcode — the part after `/p/` in the post URL. Mapped photos show "+N likes on Instagram" in the lightbox.

Instagram data is cached server-side for 1 hour and the site degrades gracefully if the token expires or the API is down.

### Token renewal

Instagram tokens last 60 days. Rather than leaving you to notice the stats have gone blank and re-issue one by hand, [lib/instagram-token.ts](lib/instagram-token.ts) trades the current token for a fresh 60-day one whenever it drops below 30 days remaining, so in normal operation it never expires.

Because a refresh returns a *new* token string, the live token is kept in MySQL (`instagram_token`, created automatically) rather than in the env var. `INSTAGRAM_ACCESS_TOKEN` is the seed for the first run and the fallback if the database is unreachable — pasting a new value in there always wins, so manual rotation still works exactly as before.

**Alerts.** When renewal can't fix things — a revoked token, a removed permission, an app in the wrong state — you get an email (via Resend) with the expiry date, what Instagram reported, and the steps to re-issue. Alerts escalate at 14 days, 3 days and expiry, send once per stage rather than on every run, re-send every 3 days while unresolved, and reset once the token is healthy again. Set `ALERT_EMAIL_TO` for the destination; it falls back to `EMAIL_REPLY_TO`.

**What drives it.** Normal `/photography` traffic triggers a check at most every 6 hours, which is enough on its own. For quiet periods, point a daily cron at the upkeep endpoint:

```sh
curl -fsS -H "Authorization: Bearer PASTE_THE_LITERAL_SECRET" https://your-domain.com/api/instagram/token
```

On Hostinger that's hPanel → Advanced → Cron Jobs. `CRON_SECRET` is a value you invent (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) and set in the app's environment variables — it isn't issued by anyone, it just has to match what the caller sends.

Paste the **literal** secret into the cron command rather than writing `$CRON_SECRET`: cron runs as a plain shell outside the Node app's environment, so that variable would expand to nothing and every run would quietly 401. The route also accepts `?key=<secret>` instead of the header, for schedulers that can't send one.

Leaving `CRON_SECRET` unset locally is deliberate — the route is then open in development, so you can hit it without a header while testing. It's only ever required in production. It returns the token's state and days remaining without ever exposing the token, and answers `503` when something needs you — so a cron that mails on failure flags it independently of our own alert email. Add `?force=1` to refresh immediately, which is worth doing right after pasting in a new token (Meta still refuses tokens under 24 hours old).

## Deployment (Hostinger)

The site runs as a Node.js web app (SSR + API routes), so it can no longer deploy to GitHub Pages — the old workflow ([.github/workflows/nextjs.yml](.github/workflows/nextjs.yml)) is disabled and can be deleted once Hostinger is live.

1. In hPanel, create a **Node.js web app** and connect this GitHub repo (framework auto-detected).
2. Create a MySQL database in hPanel → Databases, and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (and optionally `INSTAGRAM_ACCESS_TOKEN`, `CRON_SECRET`, `ALERT_EMAIL_TO`) in the app's environment variables.
3. Point the domain's DNS at Hostinger.
