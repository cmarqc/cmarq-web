'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface PhotoStats {
  views: number
  likes: number
  instagramLikes?: number
  instagramUrl?: string
}

/** Total likes across on-site hearts and the linked Instagram post. */
export function totalLikes(stats?: PhotoStats): number {
  if (!stats) return 0
  return (stats.likes ?? 0) + (stats.instagramLikes ?? 0)
}

/**
 * Combined popularity score used to rank photos. Likes are the strongest
 * engagement signal, Instagram likes are external validation, and views are the
 * weakest (cheapest) signal — weighted accordingly.
 */
export function popularityScore(stats?: PhotoStats): number {
  if (!stats) return 0
  return (stats.likes ?? 0) * 5 + (stats.instagramLikes ?? 0) * 2 + (stats.views ?? 0)
}

interface PhotoStatsContextValue {
  /** False until stats load; UI should hide counters when unavailable. */
  available: boolean
  stats: Record<string, PhotoStats>
  isLiked: (photoId: string) => boolean
  toggleLike: (photoId: string) => void
  recordView: (photoId: string) => void
}

const noop = () => {}

const PhotoStatsContext = createContext<PhotoStatsContextValue>({
  available: false,
  stats: {},
  isLiked: () => false,
  toggleLike: noop,
  recordView: noop,
})

const LIKED_STORAGE_KEY = 'cmarq.likedPhotos'
const VIEWED_SESSION_KEY = 'cmarq.viewedPhotos'

function readStringSet(storage: Storage, key: string): Set<string> {
  try {
    const raw = storage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

export function PhotoStatsProvider({ children }: { children: ReactNode }) {
  const [available, setAvailable] = useState(false)
  const [stats, setStats] = useState<Record<string, PhotoStats>>({})
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  // Session-level dedupe so flipping back and forth in the lightbox doesn't
  // count a view per navigation.
  const viewedRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    setLikedIds(readStringSet(window.localStorage, LIKED_STORAGE_KEY))

    let cancelled = false
    fetch('/api/photos/stats')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then((body: { stats: Record<string, PhotoStats> }) => {
        if (cancelled) return
        setStats(body.stats)
        setAvailable(true)
      })
      .catch(() => {
        // Stats backend unreachable (e.g. local dev without MySQL) — leave
        // the page fully functional with counters hidden.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const applyServerCounts = useCallback((photoId: string, counts: PhotoStats) => {
    setStats((prev) => ({
      ...prev,
      [photoId]: { ...prev[photoId], views: counts.views, likes: counts.likes },
    }))
  }, [])

  const isLiked = useCallback((photoId: string) => likedIds.has(photoId), [likedIds])

  const toggleLike = useCallback(
    (photoId: string) => {
      if (!available) return
      const liking = !likedIds.has(photoId)

      const nextLiked = new Set(likedIds)
      if (liking) nextLiked.add(photoId)
      else nextLiked.delete(photoId)
      setLikedIds(nextLiked)
      window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(Array.from(nextLiked)))

      // Optimistic count update; reconciled with the server response below.
      setStats((prev) => {
        const entry = prev[photoId] ?? { views: 0, likes: 0 }
        return {
          ...prev,
          [photoId]: { ...entry, likes: Math.max(0, entry.likes + (liking ? 1 : -1)) },
        }
      })

      fetch(`/api/photos/${encodeURIComponent(photoId)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: liking ? 'like' : 'unlike' }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
        .then((counts: PhotoStats) => applyServerCounts(photoId, counts))
        .catch(() => {
          // Revert the optimistic update so the UI doesn't lie about a saved like.
          setLikedIds((prev) => {
            const reverted = new Set(prev)
            if (liking) reverted.delete(photoId)
            else reverted.add(photoId)
            window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(Array.from(reverted)))
            return reverted
          })
          setStats((prev) => {
            const entry = prev[photoId] ?? { views: 0, likes: 0 }
            return {
              ...prev,
              [photoId]: { ...entry, likes: Math.max(0, entry.likes + (liking ? -1 : 1)) },
            }
          })
        })
    },
    [available, likedIds, applyServerCounts],
  )

  const recordView = useCallback(
    (photoId: string) => {
      if (!available) return
      if (!viewedRef.current) {
        viewedRef.current = readStringSet(window.sessionStorage, VIEWED_SESSION_KEY)
      }
      if (viewedRef.current.has(photoId)) return
      viewedRef.current.add(photoId)
      window.sessionStorage.setItem(
        VIEWED_SESSION_KEY,
        JSON.stringify(Array.from(viewedRef.current)),
      )

      fetch(`/api/photos/${encodeURIComponent(photoId)}/view`, { method: 'POST' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
        .then((counts: PhotoStats) => applyServerCounts(photoId, counts))
        .catch(noop)
    },
    [available, applyServerCounts],
  )

  return (
    <PhotoStatsContext.Provider value={{ available, stats, isLiked, toggleLike, recordView }}>
      {children}
    </PhotoStatsContext.Provider>
  )
}

export function usePhotoStats() {
  return useContext(PhotoStatsContext)
}
