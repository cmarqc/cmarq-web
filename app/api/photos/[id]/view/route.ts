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
  if (!rateLimit(`view:${clientKey(request)}`, 120, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    const pool = await db()
    await pool.query(
      `INSERT INTO photo_stats (photo_id, views) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE views = views + 1`,
      [photoId],
    )
    const [rows] = await pool.query('SELECT views, likes FROM photo_stats WHERE photo_id = ?', [
      photoId,
    ])
    const row = (rows as { views: number; likes: number }[])[0]
    return NextResponse.json({ views: row.views, likes: row.likes })
  } catch (err) {
    console.error('[stats] failed to record view:', describeDbError(err))
    return NextResponse.json({ error: 'stats_unavailable' }, { status: 503 })
  }
}
