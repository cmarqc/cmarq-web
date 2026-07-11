import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 is S3-compatible, so the AWS S3 SDK talks to it directly. We use
// it only to mint short-lived presigned GET URLs for the private originals — the
// buyer is redirected to that URL and downloads straight from R2. Credentials
// never leave the server.

let client: S3Client | null = null

/** True when all R2 credentials are present. */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  )
}

function r2(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID
    if (!accountId) throw new Error('R2_ACCOUNT_ID is not set')
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return client
}

function bucket(): string {
  const b = process.env.R2_BUCKET
  if (!b) throw new Error('R2_BUCKET is not set')
  return b
}

function ttlSeconds(): number {
  const minutes = Number(process.env.R2_URL_TTL_MINUTES ?? 15)
  return Math.max(60, Number.isFinite(minutes) ? minutes * 60 : 900)
}

/**
 * Presigned, time-limited download URL for a private object. `downloadName` sets
 * the filename the browser saves as (via response-content-disposition).
 */
export async function presignDownloadUrl(
  objectKey: string,
  downloadName?: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: objectKey,
    ...(downloadName
      ? { ResponseContentDisposition: `attachment; filename="${downloadName.replace(/"/g, '')}"` }
      : {}),
  })
  return getSignedUrl(r2(), command, { expiresIn: ttlSeconds() })
}

/** True if the object exists in the bucket. Used to fail loudly on missing uploads. */
export async function objectExists(objectKey: string): Promise<boolean> {
  try {
    await r2().send(new HeadObjectCommand({ Bucket: bucket(), Key: objectKey }))
    return true
  } catch {
    return false
  }
}
