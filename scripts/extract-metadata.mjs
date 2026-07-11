// Extracts camera / EXIF metadata from every JPEG under public/photos and writes
// it to data/photo-metadata.json, keyed by the photo's public `src` path.
//
// Run with:  npm run photos:metadata
//
// The generated JSON is consumed (type-safely) by data/photo-metadata.ts and
// surfaced in the photo lightbox. Re-run whenever photos are added or replaced.

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import exifReader from 'exif-reader'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const photosDir = path.join(projectRoot, 'public', 'photos')
const outFile = path.join(projectRoot, 'data', 'photo-metadata.json')

/** Recursively collect every .jpg/.jpeg file under a directory. */
async function collectJpegs(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectJpegs(full)))
    } else if (/\.jpe?g$/i.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

/** Build the public `src` path (matching data/photos.ts) from an absolute file path. */
function toSrc(absPath) {
  const rel = path.relative(path.join(projectRoot, 'public'), absPath)
  // Use POSIX separators and percent-encode any unsafe characters (e.g. spaces as %20).
  return '/' + encodeURI(rel.split(path.sep).join('/'))
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

async function extract(absPath) {
  const buffer = await readFile(absPath)
  const image = sharp(buffer)
  const meta = await image.metadata()

  const result = {}

  if (meta.width && meta.height) {
    result.dimensions = `${meta.width} × ${meta.height}`
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
  const files = (await collectJpegs(photosDir)).sort()
  const map = {}
  for (const file of files) {
    try {
      map[toSrc(file)] = await extract(file)
    } catch (err) {
      console.warn(`Skipping ${file}: ${err.message}`)
    }
  }
  await writeFile(outFile, JSON.stringify(map, null, 2) + '\n')
  console.log(`Wrote metadata for ${Object.keys(map).length} photos to ${path.relative(projectRoot, outFile)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
