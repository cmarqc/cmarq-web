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
  logo?: string
  degree: string
  field?: string
  period: string
  location: string
  gpa?: string
  bullets?: string[]
}

export interface Organization {
  id: string
  name: string
  logo?: string
  affiliation?: string
  period: string
  bullets: string[]
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
          'Taught coding concepts and led hands-on engineering workshops for K-12 students',
        ],
        tech: ['Python', 'Robotics'],
      },
    ],
  },
]

export const volunteerGroups: ExperienceGroup[] = [
  {
    id: 'dawgs-crew',
    company: "Dawg's Crew",
    logo: '/logos/dawg_crew.png',
    roles: [
      {
        id: 'dawgs-crew-assistant',
        role: 'Move-In Assistant',
        period: 'Sep 2019 – Sep 2021',
        location: 'Seattle, WA',
        type: 'volunteer',
        bullets: [
          'Assisted new and returning residents during UW\'s annual move-in, supporting elevator operations, cart logistics, and on-site guidance',
          'Helped create a welcoming and smooth transition experience for hundreds of incoming students over two years',
        ],
      },
    ],
  },
  {
    id: 'mims',
    company: 'Mercer Island Middle School',
    logo: '',
    roles: [
      {
        id: 'mims-coach',
        role: 'Volunteer Basketball Coach',
        period: 'Nov 2017 – Mar 2018',
        location: 'Mercer Island, WA',
        type: 'volunteer',
        bullets: [
          'Coached 7th and 8th grade girls basketball teams, supporting skill development, teamwork, and athlete confidence during practices',
          'Managed game-day operations including scorekeeping and shot clock, and assisted coaching staff with play calling and in-game strategy',
        ],
      },
    ],
  },
]

export const education: Education[] = [
  {
    id: 'uw',
    school: 'University of Washington',
    logo: '/logos/uw.png',
    degree: "Bachelor's of Science",
    field: 'Informatics',
    period: '2019 – 2022',
    location: 'Seattle, WA',
    gpa: '3.74',
    bullets: [
      "Dean's List: Autumn 2019, 2020–21, 2021–22",
      'Notable courses: Data Structures & Algorithms, Databases & Data Modeling, Client-Side & Server-Side Web Development, Cooperative Software Development, iOS Mobile Development, INFO Capstone',
    ],
  },
  {
    id: 'bc',
    school: 'Bellevue College',
    logo: '/logos/bc.png',
    degree: 'Associate of Arts',
    field: 'Running Start Transfer',
    period: '2017 – 2019',
    location: 'Bellevue, WA',
    gpa: '3.64',
    bullets: [
      'Completed the Running Start dual-enrollment program, earning transferable college credits while in high school',
      'Notable courses: CS 210/211, Web Programming 109, Calculus 151/152, Physics 121, Critical Thinking 115',
    ],
  },
  {
    id: 'hazen',
    school: 'Hazen High School',
    logo: '/logos/hzn.png',
    degree: 'High School Diploma',
    period: '2015 – 2019',
    location: 'Renton, WA',
    gpa: '3.82',
    bullets: [
      '3x Varsity Letter in Golf, 2x NPSL Scholar Athlete, 3x Academic All-Star',
    ],
  },
]

export const organizations: Organization[] = [
  {
    id: 'yeoc',
    name: 'Young Executives of Color (YEOC)',
    logo: '/logos/yeoc.png',
    affiliation: 'University of Washington',
    period: 'Sep 2018 – May 2019',
    bullets: [
      'Competitively selected as one of 170 participants from 700+ applicants for this UW business leadership program',
      'Developed business acumen through workshops covering strategy, finance, marketing, and professional development',
      "Led team to 3rd place in a renowned case competition hosted through the YEOC program",
    ],
  },
  {
    id: 'brotherhood',
    name: 'Brotherhood Initiative',
    affiliation: 'University of Washington',
    period: '2019 – 2022',
    bullets: [
      'Member of a UW program dedicated to empowering undergraduate men of color through mentorship, peer support, and leadership development',
    ],
  },
]
