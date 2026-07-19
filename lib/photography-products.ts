// Photography storefront catalog (SERVER-ONLY).
//
// Single source of truth for what can be bought. Derived from the gallery data
// in `data/photos.ts` so there's no parallel 53-item list to keep in sync — add
// a photo there and it becomes purchasable automatically.
//
// This module carries the private R2 object keys of the original files, so it
// must never be imported by a client component. Client-safe pricing/id/label
// helpers live in `lib/store-display.ts`; import from there in the browser.

import { photos, type Photo } from '@/data/photos'
import {
  collectionPersonalCents,
  collectionSlug,
  PRICING,
  priceForLicense,
  productIdForCollection,
  productIdForPhoto,
  type LicenseId,
} from '@/lib/store-display'

export type { LicenseId } from '@/lib/store-display'
export { formatUsd, isLicenseEnabled, storeEnabled } from '@/lib/store-display'

export type ProductType = 'photo' | 'collection'

export interface StoreProduct {
  /** Stable id used in checkout + Stripe metadata (no spaces). */
  id: string
  type: ProductType
  title: string
  subtitle?: string
  /** Public preview image (watermarked/compressed gallery version). */
  previewSrc: string
  /**
   * R2 object key of the file delivered on purchase — a full-resolution JPEG for
   * a photo, or a ZIP for a collection. SERVER-ONLY: never send to a client.
   */
  objectKey: string
  /** Personal-license price in cents. */
  personalCents: number
  /** For collections: how many photos are included. */
  photoCount?: number
}

/** Turns a public `/photos/...` src into the private R2 key of its original. */
function originalKeyForPhoto(photo: Photo): string {
  const path = decodeURIComponent(photo.src).replace(/^\/photos\//, '')
  return `photos/${path}`
}

/**
 * R2 key of a collection's downloadable ZIP. Derived from the collection's cover
 * photo folder (the name doesn't map to the folder — "Lake Washington" lives in
 * `LakeWashington`, "Peru" in `SouthAmerica/Peru`), so the ZIP sits alongside
 * that collection's originals, e.g. `photos/Bali/bali.zip`.
 */
function collectionZipKey(name: string, cover: Photo): string {
  const dir = decodeURIComponent(cover.src)
    .replace(/^\/photos\//, '')
    .replace(/\/[^/]+$/, '')
  return `photos/${dir}/${collectionSlug(name)}.zip`
}

/** A display title for photos whose `title` is blank in the gallery data. */
function photoTitle(photo: Photo): string {
  if (photo.title) return photo.title
  return photo.location ?? photo.id
}

/** Price in cents for a product under a given license. */
export function priceCents(product: StoreProduct, license: LicenseId): number {
  return priceForLicense(product.personalCents, license)
}

const photoProducts: StoreProduct[] = photos.map((photo) => ({
  id: productIdForPhoto(photo.id),
  type: 'photo',
  title: photoTitle(photo),
  subtitle: photo.location,
  previewSrc: photo.src,
  objectKey: originalKeyForPhoto(photo),
  personalCents: photo.featured
    ? PRICING.featuredPhotoPersonalCents
    : PRICING.photoPersonalCents,
}))

const collectionProducts: StoreProduct[] = (() => {
  const map = new Map<string, { count: number; cover: Photo }>()
  for (const photo of photos) {
    const existing = map.get(photo.collection)
    if (existing) existing.count++
    else map.set(photo.collection, { count: 1, cover: photo })
  }
  return Array.from(map.entries()).map(([name, { count, cover }]) => ({
    id: productIdForCollection(name),
    type: 'collection' as const,
    title: `${name} Collection`,
    subtitle: `${count} photographs`,
    previewSrc: cover.src,
    objectKey: collectionZipKey(name, cover),
    personalCents: collectionPersonalCents(name, count),
    photoCount: count,
  }))
})()

/** Every purchasable product, keyed by its stable id. */
export const productsById: Record<string, StoreProduct> = Object.fromEntries(
  [...photoProducts, ...collectionProducts].map((p) => [p.id, p]),
)

/** Looks up a product by id, returning undefined for anything not in the catalog. */
export function getProduct(id: string): StoreProduct | undefined {
  return productsById[id]
}
