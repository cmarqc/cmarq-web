// Extracts camera / EXIF metadata from every photo and writes it to
// data/photo-metadata.json, keyed by the photo's public `src` path.
//
// The photo set is always derived from the local public/photos tree (that's what
// the gallery shows). The `--source` flag only changes where the *pixels* are
// read from:
//
//   npm run photos:metadata                # source: bundled public/photos previews
//   npm run photos:metadata:r2             # source: full-res originals in R2
//
// Reading from R2 matters for the "Resolution" row in the lightbox: the bundled
// public/photos files are web-optimized previews (~1200px), so a local run reports
// preview dimensions, not the true resolution a buyer downloads. `--source r2`
// reads the genuine originals (e.g. 6000 × 4000) once they're uploaded.
//
// Env for --source r2 (loaded via `node --env-file=.env`): R2_ACCOUNT_ID,
// R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
//
// The generated JSON is consumed (type-safely) by data/photo-metadata.ts and
// surfaced in the photo lightbox. Re-run whenever photos are added or replaced.

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import exifReader from 'exif-reader'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const photosDir = path.join(projectRoot, 'public', 'photos')
const outFile = path.join(projectRoot, 'data', 'photo-metadata.json')

const args = process.argv.slice(2)
const getOpt = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

const source = getOpt('source') ?? 'local'
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

// R2 client is only wired up when reading originals from the bucket.
let s3 = null
let originalsBucket = null
if (source === 'r2') {
  const accountId = requireEnv('R2_ACCOUNT_ID')
  requireEnv('R2_ACCESS_KEY_ID')
  requireEnv('R2_SECRET_ACCESS_KEY')
  originalsBucket = requireEnv('R2_BUCKET')
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

/** Recursively collect gallery-relative JPEG paths ("Europe/Europe-1.jpg"). */
async function collectRelPaths(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await collectRelPaths(full)))
    } else if (/\.jpe?g$/i.test(entry.name)) {
      out.push(path.relative(photosDir, full).split(path.sep).join('/'))
    }
  }
  return out
}

/** Build the public `src` path (matching data/photos.ts) from a gallery-relative path. */
function toSrc(rel) {
  // Use POSIX separators and percent-encode any unsafe characters (e.g. spaces as %20).
  return '/' + encodeURI(`photos/${rel}`)
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
  return readFile(path.join(photosDir, rel.split('/').join(path.sep)))
}

function formatShutter(exposureTime) {
  if (!exposureTime) return undefined
  if (exposureTime >= 1) return `${exposureTime}s`
  return `1/${Math.round(1 / exposureTime)}s`
}

function formatCamera(make, model) {
  if (!model) return make || undefined
  if (!make) return model
  // Many bodies already include the make in the model (e.g. "Canon EOS Rebel SL3").
  return model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`
}

function formatDate(date) {
  if (!date) return undefined
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return undefined
  // EXIF timestamps are local wall-clock time; format in UTC so the calendar
  // date the photo was taken is preserved regardless of the viewer's timezone.
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

async function extract(buffer) {
  const meta = await sharp(buffer).metadata()

  const result = {}

  if (meta.width && meta.height) {
    // EXIF orientations 5–8 store the image rotated 90°, so the visually-correct
    // (as-displayed / as-downloaded) resolution swaps the stored width & height.
    const rotated = meta.orientation != null && meta.orientation >= 5
    const w = rotated ? meta.height : meta.width
    const h = rotated ? meta.width : meta.height
    result.dimensions = `${w} × ${h}`
  }

  if (meta.exif) {
    let exif
    try {
      exif = exifReader(meta.exif)
    } catch {
      exif = undefined
    }
    if (exif) {
      const image = exif.Image ?? {}
      const photo = exif.Photo ?? {}

      const camera = formatCamera(image.Make, image.Model)
      if (camera) result.camera = camera
      if (photo.LensModel) result.lens = photo.LensModel

      const dateTaken = formatDate(photo.DateTimeOriginal ?? image.DateTime)
      if (dateTaken) result.dateTaken = dateTaken

      if (photo.FocalLength) result.focalLength = `${Math.round(photo.FocalLength)}mm`
      if (photo.FNumber) result.aperture = `f/${photo.FNumber}`
      const shutter = formatShutter(photo.ExposureTime)
      if (shutter) result.shutterSpeed = shutter
      const iso = photo.ISOSpeedRatings
      if (typeof iso === 'number') result.iso = iso
    }
  }

  return result
}

async function main() {
  const rels = (await collectRelPaths(photosDir)).sort()
  console.log(`Metadata: ${rels.length} photo(s) · source=${source}`)

  const map = {}
  let failed = 0
  for (const rel of rels) {
    try {
      map[toSrc(rel)] = await extract(await readSource(rel))
    } catch (err) {
      failed++
      console.warn(`Skipping ${rel}: ${err.message}`)
    }
  }
  await writeFile(outFile, JSON.stringify(map, null, 2) + '\n')
  console.log(
    `Wrote metadata for ${Object.keys(map).length} photos to ${path.relative(projectRoot, outFile)}` +
      (failed ? ` (${failed} failed)` : ''),
  )
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
