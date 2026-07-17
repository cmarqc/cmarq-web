// Generates tiled-watermark gallery previews and uploads them to R2 under a
// "previews/" prefix — by default the SAME bucket as the originals (R2_BUCKET),
// so no separate bucket or public domain is needed. They're served privately via
// short-lived signed URLs (see app/api/preview/route.ts).
//
// Run with:
//   npm run photos:previews                     # source: bundled public/photos
//   npm run photos:previews -- --source r2       # source: full-res originals in R2
//   npm run photos:previews -- --only Europe --force
//   npm run photos:previews -- --dry-run
//
// Keys mirror the gallery layout under "previews/", so "Europe/Europe-1.jpg" is
// stored at "previews/Europe/Europe-1.jpg" (originals stay at "photos/...").
//
// The photo set is always derived from the local public/photos tree (that's what
// the gallery shows). `--source r2` only changes where the *pixels* are read from
// so you get genuine full-resolution previews once originals are uploaded.
//
// Env (loaded via `node --env-file=.env`): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY, R2_BUCKET. Set R2_PREVIEW_BUCKET only to split previews
// into a dedicated bucket.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

// ── Tunables ────────────────────────────────────────────────────────────────
// Longest-edge cap in px. Big enough to inspect detail, small enough that a
// leaked preview isn't a print-ready file. Set to 0 for true full resolution.
const MAX_EDGE = 2560
const JPEG_QUALITY = 82
const WATERMARK_TEXT = '© Christian Calloway · christiancalloway.com'
const WATERMARK_OPACITY = 0.28 // 0–1; higher = more visible / more protective
const WATERMARK_ANGLE = -30 // degrees; diagonal tiling resists cropping
// Previews are content-addressed by path; a modest cache keeps early watermark
// tweaks from being stuck behind a year-long immutable cache.
const CACHE_CONTROL = 'public, max-age=86400'
// ────────────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const localPhotosDir = path.join(projectRoot, 'public', 'photos')

const args = process.argv.slice(2)
const hasFlag = (name) => args.includes(`--${name}`)
const getOpt = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const source = getOpt('source') ?? 'local'
const force = hasFlag('force')
const dryRun = hasFlag('dry-run')
const only = getOpt('only')

if (source !== 'local' && source !== 'r2') {
  console.error(`--source must be "local" or "r2" (got "${source}")`)
  process.exit(1)
}

function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing required env var: ${name} (is it set in .env?)`)
    process.exit(1)
  }
  return v
}

const accountId = requireEnv('R2_ACCOUNT_ID')
requireEnv('R2_ACCESS_KEY_ID')
requireEnv('R2_SECRET_ACCESS_KEY')
// Previews default to the originals bucket (served via signed URLs under
// "previews/"); R2_PREVIEW_BUCKET only overrides that with a dedicated bucket.
const previewBucket = process.env.R2_PREVIEW_BUCKET || requireEnv('R2_BUCKET')
const originalsBucket = source === 'r2' ? requireEnv('R2_BUCKET') : null
// Key prefix for previews within the bucket (keeps them clear of "photos/").
const PREVIEW_PREFIX = 'previews/'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

/** Recursively collect gallery-relative JPEG paths ("Europe/Europe-1.jpg"). */
async function collectRelPaths(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await collectRelPaths(full)))
    } else if (/\.jpe?g$/i.test(entry.name)) {
      out.push(path.relative(localPhotosDir, full).split(path.sep).join('/'))
    }
  }
  return out
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

/** Read the source image bytes for a gallery-relative path. */
async function readSource(rel) {
  if (source === 'r2') {
    // Private originals key is "photos/<rel>" with literal (decoded) spaces.
    const res = await s3.send(
      new GetObjectCommand({ Bucket: originalsBucket, Key: `photos/${rel}` }),
    )
    return streamToBuffer(res.Body)
  }
  return readFile(path.join(localPhotosDir, rel.split('/').join(path.sep)))
}

function xmlEscape(s) {
  return s.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  )
}

/** A full-image tiled, diagonal, semi-transparent watermark as an SVG buffer. */
function watermarkSvg(width, height) {
  const text = xmlEscape(WATERMARK_TEXT)
  const fontSize = Math.max(16, Math.round(width / 32))
  // Roughly size each tile to the text plus generous spacing between repeats.
  const tileW = Math.round(WATERMARK_TEXT.length * fontSize * 0.62 + fontSize * 4)
  const tileH = Math.round(fontSize * 6)
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="wm" width="${tileW}" height="${tileH}" patternUnits="userSpaceOnUse" patternTransform="rotate(${WATERMARK_ANGLE})">
      <text x="0" y="${Math.round(tileH / 2)}" font-family="sans-serif" font-size="${fontSize}" font-weight="600" fill="#ffffff" fill-opacity="${WATERMARK_OPACITY}">${text}</text>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#wm)"/>
</svg>`,
  )
}

/** Resize (cap longest edge), burn in the watermark, encode JPEG. */
async function buildPreview(buffer) {
  let pipeline = sharp(buffer).rotate() // honor EXIF orientation before we cap
  if (MAX_EDGE && Number.isFinite(MAX_EDGE)) {
    pipeline = pipeline.resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
  }
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
  return sharp(data)
    .composite([{ input: watermarkSvg(info.width, info.height) }])
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer() // sharp drops source EXIF/GPS by default — good for previews
}

async function previewExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: previewBucket, Key: key }))
    return true
  } catch {
    return false
  }
}

async function main() {
  let rels = (await collectRelPaths(localPhotosDir)).sort()
  if (only) {
    rels = rels.filter((r) => r.split('/')[0].toLowerCase() === only.toLowerCase())
  }
  if (rels.length === 0) {
    console.log('No photos matched — nothing to do.')
    return
  }

  console.log(
    `Previews: ${rels.length} file(s) · source=${source} · maxEdge=${MAX_EDGE || 'full'} ` +
      `· bucket=${previewBucket}${force ? ' · FORCE' : ''}${dryRun ? ' · DRY RUN' : ''}`,
  )

  let uploaded = 0
  let skipped = 0
  let failed = 0
  for (const rel of rels) {
    const key = `${PREVIEW_PREFIX}${rel}` // e.g. "previews/Europe/Europe-1.jpg"
    try {
      if (!force && (await previewExists(key))) {
        skipped++
        continue
      }
      if (dryRun) {
        console.log(`would upload  ${key}`)
        uploaded++
        continue
      }
      const out = await buildPreview(await readSource(rel))
      await s3.send(
        new PutObjectCommand({
          Bucket: previewBucket,
          Key: key,
          Body: out,
          ContentType: 'image/jpeg',
          CacheControl: CACHE_CONTROL,
        }),
      )
      uploaded++
      console.log(`✓ ${key}  (${(out.length / 1024).toFixed(0)} KB)`)
    } catch (err) {
      failed++
      console.warn(`✗ ${key}: ${err.message}`)
    }
  }

  console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
