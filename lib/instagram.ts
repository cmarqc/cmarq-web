// Optional Instagram aggregation for @cmc.snaps.
//
// Requires INSTAGRAM_ACCESS_TOKEN (a long-lived token for an Instagram
// Professional account via the Instagram API with Instagram Login). When the
// token is absent or any request fails, everything degrades to site-only
// stats — the photography page never depends on Instagram being reachable.
//
// Per-photo merging works by setting the optional `instagram` field on a
// photo in data/photos.ts to the post's shortcode (instagram.com/p/<shortcode>/).

interface InstagramMedia {
  id: string
  permalink?: string
  like_count?: number
  comments_count?: number
}

export interface InstagramAccountStats {
  username: string
  followers?: number
  mediaCount?: number
  totalLikes: number
  totalComments: number
}

export interface InstagramStats {
  account: InstagramAccountStats
  /** Keyed by post shortcode (the part after /p/ in a post URL). */
  byShortcode: Record<string, { likes: number; comments: number; permalink: string }>
}

const GRAPH_BASE = 'https://graph.instagram.com/v21.0'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour; counts don't need to be fresher
const MAX_PAGES = 5 // up to ~500 most recent posts

let cache: { data: InstagramStats | null; fetchedAt: number } | null = null

function shortcodeFromPermalink(permalink: string): string | null {
  const match = permalink.match(/\/(?:p|reel)\/([^/?]+)/)
  return match ? match[1] : null
}

export async function getInstagramStats(): Promise<InstagramStats | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) return null
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data

  try {
    const profileRes = await fetch(
      `${GRAPH_BASE}/me?fields=username,followers_count,media_count&access_token=${token}`,
      { cache: 'no-store' },
    )
    if (!profileRes.ok) throw new Error(`profile fetch failed: ${profileRes.status}`)
    const profile = (await profileRes.json()) as {
      username?: string
      followers_count?: number
      media_count?: number
    }

    const byShortcode: InstagramStats['byShortcode'] = {}
    let totalLikes = 0
    let totalComments = 0
    let url: string | null =
      `${GRAPH_BASE}/me/media?fields=id,permalink,like_count,comments_count&limit=100&access_token=${token}`

    for (let page = 0; url && page < MAX_PAGES; page++) {
      const res: Response = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`media fetch failed: ${res.status}`)
      const body = (await res.json()) as {
        data?: InstagramMedia[]
        paging?: { next?: string }
      }
      for (const media of body.data ?? []) {
        const likes = media.like_count ?? 0
        const comments = media.comments_count ?? 0
        totalLikes += likes
        totalComments += comments
        const shortcode = media.permalink ? shortcodeFromPermalink(media.permalink) : null
        if (shortcode && media.permalink) {
          byShortcode[shortcode] = { likes, comments, permalink: media.permalink }
        }
      }
      url = body.paging?.next ?? null
    }

    const data: InstagramStats = {
      account: {
        username: profile.username ?? 'cmc.snaps',
        followers: profile.followers_count,
        mediaCount: profile.media_count,
        totalLikes,
        totalComments,
      },
      byShortcode,
    }
    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.error('[instagram] stats fetch failed:', err)
    // Cache the failure too, so a broken token doesn't add latency to every request.
    cache = { data: null, fetchedAt: Date.now() }
    return null
  }
}
