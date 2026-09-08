import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/coverage/**',
      '**/.env*',
      '**/*.tsbuildinfo',
      'client/**',
    ],
  },
  {
    files: ['server/**/*.{js,mjs}'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['server/**/*.ts'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    },
  },
  prettier,
);
