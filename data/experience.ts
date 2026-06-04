export interface Experience {
  id: string
  company: string
  logo: string
  role: string
  period: string
  location: string
  type: 'full-time' | 'intern' | 'part-time' | 'volunteer'
  bullets: string[]
  tech?: string[]
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  period: string
  location: string
}

export const experiences: Experience[] = [
  {
    id: 'msft-swe2',
    company: 'Microsoft',
    logo: '/logos/microsoft.svg',
    role: 'Software Engineer II',
    period: 'Aug 2022 – Present',
    location: 'Redmond, WA',
    type: 'full-time',
    bullets: [
      'Full-stack engineer on the Microsoft Security Response Center (MSRC) engineering team',
      'Design and ship features for internal security tooling used across Microsoft',
      'Collaborate cross-functionally with PM, design, and security researchers to deliver impactful products',
      'Mentor interns and contribute to team engineering standards',
    ],
    tech: ['TypeScript', 'React', 'C#', '.NET', 'Azure', 'KQL'],
  },
  {
    id: 'msft-intern-2022',
    company: 'Microsoft',
    logo: '/logos/microsoft.svg',
    role: 'Software Engineer Intern — MSRC',
    period: 'Jun 2022 – Aug 2022',
    location: 'Redmond, WA',
    type: 'intern',
    bullets: [
      'Created a C# console application that displays web-based representations of automation logic and performance metrics',
      'Worked within the Microsoft Security Response Center engineering team',
    ],
    tech: ['C#', '.NET', 'Azure'],
  },
  {
    id: 'msft-intern-2021',
    company: 'Microsoft',
    logo: '/logos/microsoft.svg',
    role: 'Software Engineer Intern — MSRC',
    period: 'Jun 2021 – Aug 2021',
    location: 'Remote',
    type: 'intern',
    bullets: [
      'Developed the MSRC Researcher Portal mobile application using Xamarin Forms during a 12-week virtual program',
      'Implemented features enabling security researchers to submit and track vulnerability reports on mobile',
    ],
    tech: ['C#', 'Xamarin', '.NET'],
  },
  {
    id: 'gokic',
    company: 'Geeking Out Kids of Color',
    logo: '/logos/gokic.png',
    role: 'Assistant Educator',
    period: 'Sep 2021 – Jun 2022',
    location: 'Seattle, WA',
    type: 'part-time',
    bullets: [
      'Developed curriculum focused on robotics and programming in Python for youth students',
      'Taught coding concepts and led hands-on engineering workshops',
    ],
    tech: ['Python', 'Robotics'],
  },
]

export const education: Education[] = [
  {
    id: 'uw',
    school: 'University of Washington',
    degree: "Bachelor's of Science",
    field: 'Informatics',
    period: '2018 – 2022',
    location: 'Seattle, WA',
  },
]
