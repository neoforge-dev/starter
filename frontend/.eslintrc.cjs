module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:lit/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'lit',
    'component-registry',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    // General JavaScript/TypeScript rules
    'no-console': 'warn',
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',

    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',

    // Lit element specific rules
    'lit/no-legacy-template-syntax': 'error',
    'lit/no-template-bind': 'error',
    'lit/no-duplicate-template-bindings': 'error',
    'lit/no-useless-template-literals': 'error',
    'lit/attribute-value-entities': 'error',
    'lit/binding-positions': 'error',
    'lit/no-invalid-html': 'warn',
    'lit/no-value-attribute': 'warn',

    // Component registry rules - temporarily disabled
    // 'component-registry/no-duplicate-components': 'warn',
  },
  overrides: [
    {
      // TypeScript files - enhanced configuration
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        // TypeScript specific overrides
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
      },
    },
    {
      // Test files
      files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', 'src/test/**/*'],
      env: {
        jest: true,
      },
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Stories files
      files: ['**/*.stories.{js,ts}'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Configuration files
      files: [
        '*.config.{js,ts}',
        'vite.config.{js,ts}',
        'vitest.config.{js,ts}',
        'playwright.config.{js,ts}',
        '.eslintrc.{js,ts}',
      ],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    'vendor/',
    'docs/',
    'artifacts/',
    '*.min.js',
    'patches/',
    'scripts/eslint-plugin-component-registry/',
    'src/playground/**/*',
    'src/stories/**/*'
  ],
};
