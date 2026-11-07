import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [
      '.next/**',
      '.tools/**',
      'test-results/**',
      'playwright-report/**',
      'private-inquiry-attachments/**',
      'scaffold/**',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
    ],
  },
  {
    // Phase 10: every cookie/Web Storage access goes through the consent-aware wrapper.
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ignores: ['src/lib/consent/storage.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'safeStorage (src/lib/consent/storage.ts) kullanın.' },
        { name: 'sessionStorage', message: 'safeStorage (src/lib/consent/storage.ts) kullanın.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: 'safeStorage kullanın.' },
        { object: 'window', property: 'sessionStorage', message: 'safeStorage kullanın.' },
        { object: 'globalThis', property: 'localStorage', message: 'safeStorage kullanın.' },
        { object: 'document', property: 'cookie', message: 'Consent store/registry kullanın.' },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: false,
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
]

export default eslintConfig
