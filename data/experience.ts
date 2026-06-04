export interface ExperienceRole {
  id: string
  role: string
  period: string
  location: string
  type: 'full-time' | 'intern' | 'part-time' | 'volunteer'
  bullets: string[]
  tech?: string[]
}

export interface ExperienceGroup {
  id: string
  company: string
  logo: string
  roles: ExperienceRole[]
}

export interface Education {
  id: string
  school: string
  degree: string
  field: string
  period: string
  location: string
}

export const experienceGroups: ExperienceGroup[] = [
  {
    id: 'microsoft',
    company: 'Microsoft',
    logo: '/logos/microsoft.svg',
    roles: [
      {
        id: 'msft-swe2',
        role: 'Software Engineer II',
        period: 'Sep 2025 – Present',
        location: 'Redmond, WA',
        type: 'full-time',
        bullets: [
          'Enhanced ARIS and OneCloudSOC through major UI V2 upgrades, eliminating key SOC pain points and redesigning Self-Serve workflows for clarity and reliability',
          'Built reusable UI components that reduced HTML from 300+ lines to ~10 (~97% reduction) and cut repetitive UI work by 90%+, accelerating development and standardizing UX',
          'Added Key Vault operations, improved error handling, updated settings, and strengthened reliability through DurableAPI migration and extension fixes',
          'Consolidated custom domain footprint from 16 to 8 domains (50% reduction), simplifying deployment and maintenance',
          'Increased successful deployment stages from 2 to 6 of 8 (200% improvement), significantly boosting platform stability',
          'Led custom domain rollout, onboarded new hires/customers, and modernized documentation',
        ],
        tech: ['TypeScript', 'React', 'C#', '.NET', 'Azure', 'KQL'],
      },
      {
        id: 'msft-swe',
        role: 'Software Engineer',
        period: 'Jan 2023 – Sep 2025',
        location: 'Redmond, WA',
        type: 'full-time',
        bullets: [
          'Automated duplicate/missing lookup detection with PowerShell to streamline SOC workflows',
          'Grew into full-stack ownership across ARIS (Automated Response and Investigation System) and OneCloudSOC',
          'Built API integrations, Watchlist CRUD, Role-Based Workflows, and the ARIS Health Monitor',
          'Delivered dashboards for Logic App and Kusto performance and redesigned key UI flows',
          'Improved developer productivity through reusable components, consolidated logging, and Angular/Node upgrades',
        ],
        tech: ['TypeScript', 'React', 'C#', '.NET', 'Azure', 'KQL'],
      },
      {
        id: 'msft-intern-2022',
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
    ],
  },
  {
    id: 'gokic',
    company: 'Geeking Out Kids of Color',
    logo: '/logos/gokic.png',
    roles: [
      {
        id: 'gokic-educator',
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
    ],
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
