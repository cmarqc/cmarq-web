import { randomBytes } from 'crypto'
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { ordersDb } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { isEmailConfigured, sendPurchaseEmail } from '@/lib/email'
import { getProduct, priceCents, type LicenseId, type StoreProduct } from '@/lib/photography-products'

/** Downloads allowed per purchased item — forgiving enough for phone + desktop + backup. */
export const DOWNLOAD_LIMIT = 10

export interface Order {
  id: number
  stripeSessionId: string
  customerEmail: string | null
  accessToken: string
  amountTotal: number
  currency: string
  status: string
  createdAt: Date
}

export interface OrderItem {
  id: number
  orderId: number
  productId: string
  productType: string
  license: string
  title: string
  objectKey: string
  downloadCount: number
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

// ── Tokens ────────────────────────────────────────────────────────────────────

/** A 256-bit URL-safe bearer token (64 hex chars), used as the buyer's access key. */
export function generateAccessToken(): string {
  return randomBytes(32).toString('hex')
}

// ── Row mapping ─────────────────────────────────────────────────────────────

function mapOrder(row: RowDataPacket): Order {
  return {
    id: Number(row.id),
    stripeSessionId: row.stripe_session_id,
    customerEmail: row.customer_email ?? null,
    accessToken: row.access_token,
    amountTotal: Number(row.amount_total),
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapItem(row: RowDataPacket): OrderItem {
  return {
    id: Number(row.id),
    orderId: Number(row.order_id),
    productId: row.product_id,
    productType: row.product_type,
    license: row.license,
    title: row.title,
    objectKey: row.object_key,
    downloadCount: Number(row.download_count),
  }
}

function isDuplicateEntry(err: unknown): boolean {
  return Boolean(
    err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'ER_DUP_ENTRY',
  )
}

async function loadItems(pool: Pool, orderId: number): Promise<OrderItem[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY id',
    [orderId],
  )
  return rows.map(mapItem)
}

async function orderBySessionId(pool: Pool, sessionId: string): Promise<OrderWithItems | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM orders WHERE stripe_session_id = ?',
    [sessionId],
  )
  if (rows.length === 0) return null
  const order = mapOrder(rows[0])
  return { ...order, items: await loadItems(pool, order.id) }
}

// ── Fulfillment ───────────────────────────────────────────────────────────────

/**
 * Turns a paid Stripe Checkout Session into a durable order + downloadable item.
 *
 * Idempotent and safe to call from both the webhook AND the success page: the
 * unique `stripe_session_id` means a retry or a race returns the existing order
 * instead of creating a duplicate or sending a second email. Returns null when
 * the session isn't paid or references an unknown product.
 */
export async function fulfillCheckoutSession(sessionId: string): Promise<OrderWithItems | null> {
  const pool = await ordersDb()

  // Fast path: already fulfilled.
  const existing = await orderBySessionId(pool, sessionId)
  if (existing) return existing

  // Authoritative payment check — never trust the client that a session is paid.
  const session = await stripe().checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== 'paid') return null

  const productId = session.metadata?.productId
  const license = (session.metadata?.license as LicenseId) ?? 'personal'
  if (!productId) return null
  const product = getProduct(productId)
  if (!product) return null

  const token = generateAccessToken()
  const email = session.customer_details?.email ?? session.customer_email ?? null
  const paymentIntent =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null)
  const amountTotal = session.amount_total ?? priceCents(product, license)
  const currency = session.currency ?? 'usd'

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    let orderId: number
    try {
      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO orders
           (stripe_session_id, stripe_payment_intent, customer_email, access_token, amount_total, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, 'paid')`,
        [sessionId, paymentIntent, email, token, amountTotal, currency],
      )
      orderId = res.insertId
    } catch (err) {
      // A concurrent fulfillment inserted first — return the winning order.
      if (isDuplicateEntry(err)) {
        await conn.rollback()
        return orderBySessionId(pool, sessionId)
      }
      throw err
    }

    await conn.query(
      `INSERT INTO order_items (order_id, product_id, product_type, license, title, object_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, product.id, product.type, license, product.title, product.objectKey],
    )
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }

  // Reached only on a fresh insert (the early-return and duplicate paths above
  // never get here), so the buyer is emailed exactly once — retries won't
  // re-send. Best-effort: a mail failure must not fail an otherwise-paid order.
  const created = await orderBySessionId(pool, sessionId)
  if (created && isEmailConfigured()) {
    try {
      await sendPurchaseEmail(created)
    } catch (err) {
      console.error(`[orders] purchase email failed for order ${created.id}:`, err)
    }
  }
  return created
}

// ── Lookups ─────────────────────────────────────────────────────────────────

/** Loads an order and its items by the buyer's access token (the purchase-page URL). */
export async function getOrderByToken(token: string): Promise<OrderWithItems | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null
  const pool = await ordersDb()
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM orders WHERE access_token = ?',
    [token],
  )
  if (rows.length === 0) return null
  const order = mapOrder(rows[0])
  return { ...order, items: await loadItems(pool, order.id) }
}

/** Loads a single order item together with its parent order, for download auth. */
export async function getItemWithOrder(
  itemId: number,
): Promise<{ item: OrderItem; order: Order } | null> {
  const pool = await ordersDb()
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM order_items WHERE id = ?', [itemId])
  if (rows.length === 0) return null
  const item = mapItem(rows[0])
  const [orderRows] = await pool.query<RowDataPacket[]>('SELECT * FROM orders WHERE id = ?', [
    item.orderId,
  ])
  if (orderRows.length === 0) return null
  return { item, order: mapOrder(orderRows[0]) }
}

/**
 * Atomically claims one download against the per-item limit. Returns whether the
 * download is allowed and the resulting count. The UPDATE's WHERE clause enforces
 * the limit without a read-modify-write race.
 */
export async function claimDownload(
  itemId: number,
  ip: string | null,
): Promise<{ allowed: boolean; count: number }> {
  const pool = await ordersDb()
  const [res] = await pool.query<ResultSetHeader>(
    'UPDATE order_items SET download_count = download_count + 1 WHERE id = ? AND download_count < ?',
    [itemId, DOWNLOAD_LIMIT],
  )
  if (res.affectedRows === 0) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT download_count FROM order_items WHERE id = ?',
      [itemId],
    )
    return { allowed: false, count: rows.length ? Number(rows[0].download_count) : 0 }
  }
  await pool
    .query('INSERT INTO download_events (order_item_id, ip) VALUES (?, ?)', [itemId, ip])
    .catch(() => {}) // logging is best-effort; never block a paid download on it
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT download_count FROM order_items WHERE id = ?',
    [itemId],
  )
  return { allowed: true, count: rows.length ? Number(rows[0].download_count) : 0 }
}

/** Filename the browser saves a downloaded item as, derived from its title + key extension. */
export function downloadFileName(product: Pick<StoreProduct, 'title' | 'objectKey'>): string {
  const ext = product.objectKey.split('.').pop() || 'jpg'
  const safe = product.title.replace(/[^a-zA-Z0-9-_ ]+/g, '').trim().replace(/\s+/g, '-')
  return `${safe || 'download'}.${ext}`
}
