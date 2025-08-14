module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  plugins: [
    'lit',
    'component-registry',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // General JavaScript rules
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Lit element specific rules
    'lit/no-legacy-template-syntax': 'error',
    'lit/no-template-bind': 'error',
    'lit/no-duplicate-template-bindings': 'error',
    'lit/no-useless-template-literals': 'error',
    'lit/attribute-value-entities': 'error',
    'lit/binding-positions': 'error',
    'lit/no-invalid-html': 'error',
    'lit/no-value-attribute': 'error',
    
    // Component registry rules
    'component-registry/no-duplicate-components': 'warn',
  },
  overrides: [
    {
      // Test files
      files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', 'src/test/**/*'],
      env: {
        jest: true,
        vitest: true,
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