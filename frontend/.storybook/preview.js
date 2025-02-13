import { html } from 'lit';
import { setCustomElementsManifest } from '@storybook/web-components';
import customElements from '../custom-elements.json';
import { colors, typography, spacing } from '../src/components/tokens/design-tokens.js';

setCustomElementsManifest(customElements);

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
        { name: 'light', value: colors.background },
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
          ${Object.entries(colors).map(([key, value]) => \`--color-\${key}: \${value};\`).join('\n')}
          ${Object.entries(typography).map(([key, value]) => \`--typography-\${key}: \${value};\`).join('\n')}
          ${Object.entries(spacing).map(([key, value]) => \`--spacing-\${key}: \${value};\`).join('\n')}
        }
      </style>
      \${Story()}
    \`,
  ],
};

export default preview;
