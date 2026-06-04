Place your photography files in this directory.

Expected format: /public/photos/your-photo-name.jpg

Then update /data/photos.ts to reference them as local paths:
  src: '/photos/your-photo-name.jpg',
  thumbnail: '/photos/your-photo-name-thumb.jpg',

For best performance with next/image:
- Full resolution photos: 1200-2400px wide
- Thumbnails: 600-800px wide
- Format: WebP or JPEG
- When using local files, you no longer need the picsum.photos remotePattern in next.config.ts
