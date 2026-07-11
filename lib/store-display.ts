// Client-SAFE storefront helpers: pricing, ids, labels, and the store toggle.
//
// This module contains NO private data (no R2 object keys) so it can be imported
// by client components. The server-only catalog in `photography-products.ts`
// builds on top of it and adds the private original-file keys.

export type LicenseId = 'personal' | 'commercial'

export interface License {
  id: LicenseId
  name: string
  blurb: string
  enabled: boolean
}

/**
 * Licenses offered at launch. Commercial is defined but disabled — flip
 * `enabled` (and tune `commercialMultiplier`) to offer it with no other changes.
 */
export const LICENSES: Record<LicenseId, License> = {
  personal: {
    id: 'personal',
    name: 'Personal use',
    blurb: 'Personal display, wallpaper, and personal (non-resale) printing.',
    enabled: true,
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial use',
    blurb: 'Business, marketing, editorial, and commercial projects.',
    enabled: false,
  },
}

/**
 * Pricing knobs — edit these to reprice the whole store. Amounts are in cents.
 */
export const PRICING = {
  /** Personal-license price for a single full-resolution photo. */
  photoPersonalCents: 1500,
  /** Commercial price = personal price × this (used only when commercial is enabled). */
  commercialMultiplier: 6,
  /** A collection costs (per-photo × count × this), so it's cheaper than buying each. */
  collectionDiscount: 0.55,
  /** A collection never costs less than this. */
  collectionFloorCents: 5000,
  /** A collection never costs more than this, however large it gets. */
  collectionCeilingCents: 20000,
  /** Prices round to this increment for tidy figures ($5). */
  roundToCents: 500,
} as const

/** Hand-tuned collection prices (in cents), keyed by collection name. Optional. */
export const COLLECTION_PRICE_OVERRIDES: Record<string, number> = {
  // 'Europe': 8000,
}

function roundToIncrement(cents: number, increment: number): number {
  return Math.round(cents / increment) * increment
}

/** Personal-license price for a whole collection of `count` photos. */
export function collectionPersonalCents(name: string, count: number): number {
  const override = COLLECTION_PRICE_OVERRIDES[name]
  if (override != null) return override
  const raw = count * PRICING.photoPersonalCents * PRICING.collectionDiscount
  const rounded = roundToIncrement(raw, PRICING.roundToCents)
  // Clamp between the floor (tiny collections stay worthwhile) and the ceiling
  // (huge collections like Egypt don't balloon past a sane maximum).
  return Math.min(
    PRICING.collectionCeilingCents,
    Math.max(PRICING.collectionFloorCents, rounded),
  )
}

/** Applies the license tier to a personal-license base price. */
export function priceForLicense(personalCents: number, license: LicenseId): number {
  if (license === 'commercial') {
    return roundToIncrement(personalCents * PRICING.commercialMultiplier, PRICING.roundToCents)
  }
  return personalCents
}

/** Formats cents as USD, e.g. 1500 → "$15". */
export function formatUsd(cents: number): string {
  const dollars = cents / 100
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}

/** kebab-cases a collection name, e.g. "Lake Washington" → "lake-washington". */
export function collectionSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Stable product id for a gallery photo. */
export function productIdForPhoto(photoId: string): string {
  return `photo_${photoId}`
}

/** Stable product id for a collection name. */
export function productIdForCollection(name: string): string {
  return `collection_${collectionSlug(name)}`
}

/** Whether a license id is currently offered for sale. */
export function isLicenseEnabled(id: LicenseId): boolean {
  return LICENSES[id].enabled
}

/**
 * Whether the storefront is live. Reads the public env flag so server and client
 * agree. Keep purchasing hidden until Stripe + R2 are configured.
 */
export function storeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STORE_ENABLED === 'true'
}
