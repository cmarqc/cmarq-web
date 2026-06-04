export type PhotoCategory = 'landscape' | 'portrait' | 'nature' | 'street' | 'urban' | 'all'

export interface Photo {
  id: string
  src: string
  thumbnail: string
  title: string
  location?: string
  camera?: string
  width: number
  height: number
  featured: boolean
  category: Exclude<PhotoCategory, 'all'>
  price?: number
  available: boolean
}

// Replace these placeholder images with your actual photography.
// Place photos in /public/photos/ and update src/thumbnail to local paths like '/photos/my-photo.jpg'
// For next/image, local images in /public are automatically optimized.
export const photos: Photo[] = [
  {
    id: 'photo-1',
    src: 'https://picsum.photos/seed/cc-01/1200/800',
    thumbnail: 'https://picsum.photos/seed/cc-01/600/400',
    title: 'Golden Hour',
    location: 'Seattle, WA',
    width: 1200,
    height: 800,
    featured: true,
    category: 'landscape',
    price: 35,
    available: true,
  },
  {
    id: 'photo-2',
    src: 'https://picsum.photos/seed/cc-02/1200/900',
    thumbnail: 'https://picsum.photos/seed/cc-02/600/450',
    title: 'Mountain Reflections',
    location: 'Mt. Rainier, WA',
    width: 1200,
    height: 900,
    featured: true,
    category: 'landscape',
    price: 40,
    available: true,
  },
  {
    id: 'photo-3',
    src: 'https://picsum.photos/seed/cc-03/1200/800',
    thumbnail: 'https://picsum.photos/seed/cc-03/600/400',
    title: 'City Lights',
    location: 'Seattle, WA',
    width: 1200,
    height: 800,
    featured: true,
    category: 'urban',
    price: 30,
    available: true,
  },
  {
    id: 'photo-4',
    src: 'https://picsum.photos/seed/cc-04/900/1200',
    thumbnail: 'https://picsum.photos/seed/cc-04/450/600',
    title: 'Into the Forest',
    location: 'Olympic National Park, WA',
    width: 900,
    height: 1200,
    featured: true,
    category: 'nature',
    price: 35,
    available: true,
  },
  {
    id: 'photo-5',
    src: 'https://picsum.photos/seed/cc-05/1200/800',
    thumbnail: 'https://picsum.photos/seed/cc-05/600/400',
    title: 'Storm Rolling In',
    location: 'Puget Sound, WA',
    width: 1200,
    height: 800,
    featured: false,
    category: 'landscape',
    price: 40,
    available: true,
  },
  {
    id: 'photo-6',
    src: 'https://picsum.photos/seed/cc-06/1200/800',
    thumbnail: 'https://picsum.photos/seed/cc-06/600/400',
    title: 'Pike Place at Dusk',
    location: 'Seattle, WA',
    width: 1200,
    height: 800,
    featured: false,
    category: 'street',
    price: 30,
    available: true,
  },
  {
    id: 'photo-7',
    src: 'https://picsum.photos/seed/cc-07/1200/900',
    thumbnail: 'https://picsum.photos/seed/cc-07/600/450',
    title: 'First Light',
    location: 'Snoqualmie Pass, WA',
    width: 1200,
    height: 900,
    featured: false,
    category: 'landscape',
    price: 45,
    available: true,
  },
  {
    id: 'photo-8',
    src: 'https://picsum.photos/seed/cc-08/800/1200',
    thumbnail: 'https://picsum.photos/seed/cc-08/400/600',
    title: 'Solitude',
    location: 'Hoh Rainforest, WA',
    width: 800,
    height: 1200,
    featured: false,
    category: 'nature',
    price: 35,
    available: true,
  },
  {
    id: 'photo-9',
    src: 'https://picsum.photos/seed/cc-09/1200/800',
    thumbnail: 'https://picsum.photos/seed/cc-09/600/400',
    title: 'Steel and Glass',
    location: 'Seattle, WA',
    width: 1200,
    height: 800,
    featured: false,
    category: 'urban',
    price: 30,
    available: true,
  },
  {
    id: 'photo-10',
    src: 'https://picsum.photos/seed/cc-10/1200/800',
    thumbnail: 'https://picsum.photos/seed/cc-10/600/400',
    title: 'The Long Road',
    location: 'Eastern Washington',
    width: 1200,
    height: 800,
    featured: false,
    category: 'landscape',
    price: 35,
    available: true,
  },
  {
    id: 'photo-11',
    src: 'https://picsum.photos/seed/cc-11/1200/800',
    thumbnail: 'https://picsum.photos/seed/cc-11/600/400',
    title: 'Night Market',
    location: 'Seattle, WA',
    width: 1200,
    height: 800,
    featured: false,
    category: 'street',
    price: 30,
    available: true,
  },
  {
    id: 'photo-12',
    src: 'https://picsum.photos/seed/cc-12/900/1200',
    thumbnail: 'https://picsum.photos/seed/cc-12/450/600',
    title: 'Coastal Fog',
    location: 'Olympic Peninsula, WA',
    width: 900,
    height: 1200,
    featured: false,
    category: 'nature',
    price: 40,
    available: true,
  },
]

export const featuredPhotos = photos.filter((p) => p.featured)
export const galleryPhotos = photos
