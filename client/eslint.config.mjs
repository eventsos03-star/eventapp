import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // New strict React 19 rules that target patterns this codebase intentionally
      // uses (data fetching in effects, leaflet map refs, id generation in refs).
      // Re-enabled after a migration to progressively dispatch effects is done.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      // Advisory rule; enforcing it would force risky dependency-array churn.
      'react-hooks/exhaustive-deps': 'off',
      // Pragmatic: existing code uses `any` for third-party / error handling.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrorsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '**/*.tsbuildinfo',
  ]),
])
