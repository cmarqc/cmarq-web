export interface Project {
  id: string
  title: string
  description: string
  tech: string[]
  category: 'web' | 'mobile' | 'data' | 'game' | 'other'
  outputUrl?: string
  sourceUrl?: string
  featured?: boolean
}

export const projects: Project[] = [
  {
    id: 'explore-uw',
    title: 'ExploreUW',
    description:
      'A student project built with my roommate that helps first-year University of Washington students navigate different aspects of college life — from academics to campus resources.',
    tech: ['React', 'JavaScript', 'CSS', 'HTML'],
    category: 'web',
    featured: true,
    sourceUrl: 'https://github.com/cmarqc/exploreUW',
    outputUrl: 'https://cmarqc.github.io/exploreUW/',
  },
  {
    id: 'homelessness-wa',
    title: 'Homelessness in Washington State',
    description:
      'A data analysis project examining homelessness trends across Washington State. Built as a group INFO 201 final project with interactive visualizations.',
    tech: ['R', 'Shiny', 'ggplot2', 'Data Analysis'],
    category: 'data',
    featured: true,
    sourceUrl: 'https://github.com/cmarq07/INFO201-CRYM',
    outputUrl: 'https://cmarq07.github.io/INFO201-CRYM/',
  },
  {
    id: 'air-cleaner-calculator',
    title: 'Air Cleaner Calculator',
    description:
      'My Informatics Capstone project. The Clean Air Tool is a solution to aid in achieving safe indoor air quality.',
    tech: ['React', 'JavaScript'],
    category: 'data',
    featured: false,
    sourceUrl: 'https://github.com/cmarq07/air-cleaner-calculator',
  },
  {
    id: 'sploosh',
    title: 'Sinking Ships (Sploosh)',
    description:
      "A browser-based Battleship game inspired by The Legend of Zelda: Wind Waker's mini-game. Features custom pixel art assets and classic gameplay mechanics.",
    tech: ['JavaScript', 'HTML', 'CSS'],
    category: 'game',
    featured: false,
    sourceUrl: 'https://github.com/cmarqc/Sinking-Ships',
    outputUrl: 'https://cmarqc.github.io/Sinking-Ships/',
  },
  {
    id: 'portfolio',
    title: 'Personal Portfolio (this site)',
    description:
      'A full redesign of my personal portfolio built from scratch using Next.js 14, Tailwind CSS, and Framer Motion. Includes a photography gallery.',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    category: 'web',
    sourceUrl: 'https://github.com/cmarqc/cmarq-web',
    featured: true,
  },
]
