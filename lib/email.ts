import { Resend } from 'resend'
import type { OrderWithItems } from '@/lib/orders'
import { formatUsd } from '@/lib/store-display'

// Transactional email via Resend. Optional: if RESEND_API_KEY isn't set the
// storefront still works fully (buyers get their download on the success page),
// email delivery is just skipped. Requires a verified sending domain in Resend.

let client: Resend | null = null

/** True when Resend is configured (API key + a From address). */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

function resend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    client = new Resend(key)
  }
  return client
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

function purchaseEmailHtml(order: OrderWithItems): string {
  const link = `${siteUrl()}/purchases/${order.accessToken}`
  const items = order.items
    .map(
      (item) =>
        `<li style="margin:0 0 6px"><strong>${escapeHtml(item.title)}</strong> — ${
          item.productType === 'collection' ? 'collection (ZIP)' : 'high-resolution JPEG'
        }</li>`,
    )
    .join('')

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
    <h1 style="font-size:20px;margin:0 0 8px">Thank you for your purchase</h1>
    <p style="margin:0 0 16px;color:#52525b">Your full-resolution ${
      order.items.length > 1 ? 'files are' : 'file is'
    } ready to download.</p>
    <ul style="padding-left:18px;margin:0 0 20px;color:#3f3f46">${items}</ul>
    <p style="margin:0 0 20px">
      <a href="${link}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
        Access your downloads
      </a>
    </p>
    <p style="margin:0 0 8px;color:#71717a;font-size:13px">Or paste this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="${link}" style="color:#e11d48">${link}</a></p>
    <p style="margin:0;color:#a1a1aa;font-size:12px">Total paid: ${formatUsd(order.amountTotal)} ${order.currency.toUpperCase()}. Keep this link private — anyone with it can download your files.</p>
  </div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Sends the buyer their purchase / downloads link. Throws on failure so callers
 * can decide whether to swallow it (fulfillment does — email is best-effort).
 */
export async function sendPurchaseEmail(order: OrderWithItems): Promise<void> {
  if (!order.customerEmail) return
  await resend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: order.customerEmail,
    ...(process.env.EMAIL_REPLY_TO ? { replyTo: process.env.EMAIL_REPLY_TO } : {}),
    subject: 'Your photography download is ready',
    html: purchaseEmailHtml(order),
  })
}
