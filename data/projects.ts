export interface Project {
  id: string
  title: string
  description: string
  tech: string[]
  category: 'web' | 'mobile' | 'data' | 'game' | 'other'
  link?: string
  github?: string
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
  },
  {
    id: 'homelessness-wa',
    title: 'Homelessness in Washington State',
    description:
      'A data analysis project examining homelessness trends across Washington State. Built as a group INFO 201 final project with interactive visualizations.',
    tech: ['R', 'Shiny', 'ggplot2', 'Data Analysis'],
    category: 'data',
    featured: true,
  },
  {
    id: 'co2-emissions',
    title: 'Exploring CO₂ Emissions',
    description:
      'An interactive tool examining worldwide CO₂ emissions recorded since 1751, enabling users to explore historical trends and country-level comparisons.',
    tech: ['R', 'Shiny', 'Data Visualization'],
    category: 'data',
    featured: false,
  },
  {
    id: 'sploosh',
    title: 'Sinking Ships (Sploosh)',
    description:
      "A browser-based Battleship game inspired by The Legend of Zelda: Wind Waker's mini-game. Features custom pixel art assets and classic gameplay mechanics.",
    tech: ['JavaScript', 'HTML', 'CSS'],
    category: 'game',
    featured: false,
  },
  {
    id: 'portfolio',
    title: 'Personal Portfolio (this site)',
    description:
      'A full redesign of my personal portfolio built from scratch using Next.js 14, Tailwind CSS, and Framer Motion. Includes a photography gallery with print purchase support.',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    category: 'web',
    github: 'https://github.com/cmarq07',
    featured: true,
  },
]
