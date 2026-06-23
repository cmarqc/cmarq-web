import { NextResponse } from 'next/server'
import { db, describeDbError, isDbConfigured, warnDbNotConfigured } from '@/lib/db'
import { getInstagramStats, parseInstagramRef, withImgIndex } from '@/lib/instagram'
import { photos } from '@/data/photos'

export const dynamic = 'force-dynamic'

export interface PhotoStatsEntry {
  views: number
  likes: number
  instagramLikes?: number
  instagramUrl?: string
}

// A configured `instagram` value that yields no stats is almost always a typo'd
// shortcode. Surface it in dev so it doesn't fail invisibly; stay quiet in
// production where logs are noisier and the page degrades gracefully anyway.
function warnInstagram(photoId: string, reason: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[stats] photo "${photoId}": ${reason}`)
  }
}

export async function GET() {
  if (!isDbConfigured()) {
    warnDbNotConfigured()
    return NextResponse.json({ error: 'stats_unavailable' }, { status: 503 })
  }
  try {
    const pool = await db()
    const [rows] = await pool.query('SELECT photo_id, views, likes FROM photo_stats')

    const stats: Record<string, PhotoStatsEntry> = {}
    for (const row of rows as { photo_id: string; views: number; likes: number }[]) {
      stats[row.photo_id] = { views: row.views, likes: row.likes }
    }

    const instagram = await getInstagramStats()
    if (instagram) {
      for (const photo of photos) {
        if (!photo.instagram) continue
        const ref = parseInstagramRef(photo.instagram)
        if (!ref) {
          warnInstagram(photo.id, `unparseable instagram value "${photo.instagram}"`)
          continue
        }
        const igPost = instagram.byShortcode[ref.shortcode]
        if (!igPost) {
          warnInstagram(photo.id, `no Instagram post matched shortcode "${ref.shortcode}"`)
          continue
        }
        const entry = (stats[photo.id] ??= { views: 0, likes: 0 })
        entry.instagramLikes = igPost.likes
        entry.instagramUrl = withImgIndex(igPost.permalink, ref.imgIndex)
      }
    }

    return NextResponse.json({
      stats,
      instagram: instagram?.account ?? null,
    })
  } catch (err) {
    console.error('[stats] failed to load photo stats:', describeDbError(err))
    return NextResponse.json({ error: 'stats_unavailable' }, { status: 503 })
  }
}
