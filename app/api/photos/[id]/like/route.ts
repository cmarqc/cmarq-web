import { NextResponse } from 'next/server'
import { db, describeDbError, isDbConfigured, warnDbNotConfigured } from '@/lib/db'
import { photos } from '@/data/photos'
import { clientKey, rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isDbConfigured()) {
    warnDbNotConfigured()
    return NextResponse.json({ error: 'stats_unavailable' }, { status: 503 })
  }
  const photoId = decodeURIComponent(params.id)
  if (!photos.some((p) => p.id === photoId)) {
    return NextResponse.json({ error: 'unknown_photo' }, { status: 404 })
  }
  if (!rateLimit(`like:${clientKey(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let action: unknown
  try {
    action = ((await request.json()) as { action?: unknown }).action
  } catch {
    action = undefined
  }
  if (action !== 'like' && action !== 'unlike') {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
  }

  try {
    const pool = await db()
    if (action === 'like') {
      await pool.query(
        `INSERT INTO photo_stats (photo_id, likes) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE likes = likes + 1`,
        [photoId],
      )
    } else {
      await pool.query(
        `INSERT INTO photo_stats (photo_id, likes) VALUES (?, 0)
         ON DUPLICATE KEY UPDATE likes = IF(likes > 0, likes - 1, 0)`,
        [photoId],
      )
    }
    const [rows] = await pool.query('SELECT views, likes FROM photo_stats WHERE photo_id = ?', [
      photoId,
    ])
    const row = (rows as { views: number; likes: number }[])[0]
    return NextResponse.json({ views: row.views, likes: row.likes })
  } catch (err) {
    console.error('[stats] failed to record like:', describeDbError(err))
    return NextResponse.json({ error: 'stats_unavailable' }, { status: 503 })
  }
}
