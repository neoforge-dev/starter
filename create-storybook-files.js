const fs = require("fs");
const path = require("path");

// Create the vite.config.js file
const viteConfig = `import { defineConfig } from 'vite';
import { resolve } from 'path';
import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';
import cssnano from 'cssnano';

export default defineConfig({
  resolve: {
    alias: {
      '@styles': resolve(__dirname, '../src/styles'),
      '@services': resolve(__dirname, '../src/services'),
      '@utils': resolve(__dirname, '../src/utils'),
      '@components': resolve(__dirname, '../src/components'),
      '@': resolve(__dirname, '../src'),
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer,
        postcssPresetEnv({
          stage: 3,
          features: {
            'nesting-rules': true,
            'custom-media-queries': true,
            'media-query-ranges': true,
          },
        }),
        cssnano({
          preset: [
            'advanced',
            {
              discardComments: { removeAll: true },
              reduceIdents: false,
              zindex: false,
            },
          ],
        }),
      ],
    },
  },
  optimizeDeps: {
    include: ['lit', '@lit/reactive-element', 'lit-html', 'lit-element'],
  },
});`;

// Create the main.js file
const mainJs = `import { dirname, join } from 'path';

/** @type { import('@storybook/web-components-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/components/atoms/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/components/molecules/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/components/organisms/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    // Import the custom Vite config
    const customConfig = (await import('./vite.config.js')).default;

    // Merge the configs
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          ...customConfig.resolve.alias,
        },
      },
      css: customConfig.css,
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [
          ...(config.optimizeDeps?.include || []),
          ...(customConfig.optimizeDeps?.include || []),
        ],
      },
    };
  },
};

export default config;`;

// Create the preview.js file
const previewJs = `import { html } from 'lit';

// Define fallback design tokens in case the import fails
const colors = {
  background: '#ffffff',
  primary: '#3f51b5',
  secondary: '#f50057',
  text: '#333333',
};

const typography = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '16px',
  lineHeight: '1.5',
};

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

// Try to import actual design tokens, use fallbacks if it fails
let designTokens;
try {
  // For static file, we'll use the fallbacks
  designTokens = { colors, typography, spacing };
} catch (e) {
  console.warn('Could not load design tokens, using fallbacks');
  designTokens = { colors, typography, spacing };
}

/** @type { import('@storybook/web-components').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: designTokens.colors.background || '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '360px', height: '640px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
      },
    },
    docs: {
      source: { type: 'dynamic' },
      description: {
        component: null,
      },
    },
  },
  decorators: [
    (Story) => html\`
      <style>
        :root {
          /* Inject design tokens */
          \${Object.entries(designTokens.colors || colors).map(([key, value]) => \`--color-\${key}: \${value};\`).join('\\n')}
          \${Object.entries(designTokens.typography || typography).map(([key, value]) => \`--typography-\${key}: \${value};\`).join('\\n')}
          \${Object.entries(designTokens.spacing || spacing).map(([key, value]) => \`--spacing-\${key}: \${value};\`).join('\\n')}
        }
      </style>
      \${Story()}
    \`,
  ],
};

export default preview;`;

// Write the files
fs.writeFileSync(path.join(".storybook", "vite.config.js"), viteConfig);
fs.writeFileSync(path.join(".storybook", "main.js"), mainJs);
fs.writeFileSync(path.join(".storybook", "preview.js"), previewJs);

console.log("Storybook configuration files created successfully!");
