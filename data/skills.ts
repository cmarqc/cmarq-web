export interface SkillGroup {
  category: string
  items: string[]
}

export const skillGroups: SkillGroup[] = [
  {
    category: 'Languages',
    items: ['TypeScript', 'JavaScript', 'C#', 'Python', 'Java', 'HTML', 'CSS'],
  },
  {
    category: 'Frontend',
    items: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    category: 'Backend & Cloud',
    items: ['.NET', 'Node.js', 'Azure', 'REST APIs'],
  },
  {
    category: 'Data & Query',
    items: ['KQL', 'SQL'],
  },
  {
    category: 'Tools',
    items: ['Git', 'GitHub', 'VS Code', 'Figma', 'Jira'],
  },
]
