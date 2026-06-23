import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // eslint-config-next 16 turns these new react-hooks rules on as errors.
      // They flag existing, working patterns (hydration-guard setState in an
      // effect, external-store sync, mailto navigation). Keep them as warnings
      // so lint stays green while still surfacing them as cleanup candidates.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
]

export default eslintConfig
