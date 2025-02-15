import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import './link.js';
import '../icon/icon.js';

export default {
  title: 'Atoms/Link',
  component: 'neo-link',
  argTypes: {
    href: {
      control: 'text',
      description: 'The URL that the link points to',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'subtle'],
      description: 'The variant style of the link',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the link',
    },
    underline: {
      control: 'select',
      options: ['none', 'hover', 'always'],
      description: 'When to show the underline',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the link is disabled',
    },
    external: {
      control: 'boolean',
      description: 'Whether the link opens in a new tab',
    },
    onClick: { action: 'clicked' },
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/...',
    },
    docs: {
      description: {
        component: 'A versatile link component that supports various styles and behaviors.',
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'link-name',
            enabled: true,
          },
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

const Template = (args) => html\`
  <neo-link
    href=\${ifDefined(args.href)}
    variant=\${ifDefined(args.variant)}
    size=\${ifDefined(args.size)}
    underline=\${ifDefined(args.underline)}
    ?disabled=\${args.disabled}
    ?external=\${args.external}
    @click=\${args.onClick}
  >
    \${args.prefix ? html\`<neo-icon slot="prefix" name="\${args.prefix}"></neo-icon>\` : ""}
    \${args.label || "Link"}
    \${args.suffix ? html\`<neo-icon slot="suffix" name="\${args.suffix}"></neo-icon>\` : ""}
  </neo-link>
\`;

// Basic Variants
export const Default = Template.bind({});
Default.args = {
  label: 'Default Link',
  href: '#',
};

export const Primary = Template.bind({});
Primary.args = {
  label: 'Primary Link',
  href: '#',
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  label: 'Secondary Link',
  href: '#',
  variant: 'secondary',
};

export const Subtle = Template.bind({});
Subtle.args = {
  label: 'Subtle Link',
  href: '#',
  variant: 'subtle',
};

// States
export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Disabled Link',
  href: '#',
  disabled: true,
};

export const External = Template.bind({});
External.args = {
  label: 'External Link',
  href: 'https://example.com',
  external: true,
  suffix: 'arrowForward',
};

// Sizes
export const Small = Template.bind({});
Small.args = {
  label: 'Small Link',
  href: '#',
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  label: 'Large Link',
  href: '#',
  size: 'lg',
};

// Underline Variants
export const NoUnderline = Template.bind({});
NoUnderline.args = {
  label: 'No Underline',
  href: '#',
  underline: 'none',
};

export const UnderlineOnHover = Template.bind({});
UnderlineOnHover.args = {
  label: 'Underline on Hover',
  href: '#',
  underline: 'hover',
};

export const AlwaysUnderlined = Template.bind({});
AlwaysUnderlined.args = {
  label: 'Always Underlined',
  href: '#',
  underline: 'always',
};

// With Icons
export const WithPrefixIcon = Template.bind({});
WithPrefixIcon.args = {
  label: 'Settings',
  href: '/settings',
  prefix: 'settings',
};

export const WithSuffixIcon = Template.bind({});
WithSuffixIcon.args = {
  label: 'Next Page',
  href: '/next',
  suffix: 'chevronRight',
};

// Navigation Example
export const NavigationLinks = () => html\`
  <nav style="display: flex; gap: 16px;">
    <neo-link href="/home" variant="primary">
      <neo-icon slot="prefix" name="home"></neo-icon>
      Home
    </neo-link>
    <neo-link href="/products" variant="primary">
      <neo-icon slot="prefix" name="shopping_cart"></neo-icon>
      Products
    </neo-link>
    <neo-link href="/contact" variant="primary">
      <neo-icon slot="prefix" name="mail"></neo-icon>
      Contact
    </neo-link>
  </nav>
\`;

// Breadcrumb Example
export const Breadcrumbs = () => html\`
  <nav aria-label="Breadcrumb" style="display: flex; align-items: center; gap: 8px;">
    <neo-link href="/home" variant="subtle" size="sm">Home</neo-link>
    <neo-icon name="chevronRight" style="width: 16px; height: 16px;"></neo-icon>
    <neo-link href="/products" variant="subtle" size="sm">Products</neo-link>
    <neo-icon name="chevronRight" style="width: 16px; height: 16px;"></neo-icon>
    <neo-link href="/category" variant="subtle" size="sm">Category</neo-link>
  </nav>
\`;

// Footer Links Example
export const FooterLinks = () => html\`
  <footer style="display: grid; gap: 8px;">
    <neo-link href="/privacy" variant="subtle" size="sm">Privacy Policy</neo-link>
    <neo-link href="/terms" variant="subtle" size="sm">Terms of Service</neo-link>
    <neo-link href="/contact" variant="subtle" size="sm">Contact Us</neo-link>
  </footer>
\`;

// Mixed Content Example
export const MixedContent = () => html\`
  <div style="display: grid; gap: 16px;">
    <p>
      Learn more about our 
      <neo-link href="/features" variant="primary">features</neo-link>
      and 
      <neo-link href="/pricing" variant="primary">pricing</neo-link>.
    </p>
    <p>
      Need help? Check our 
      <neo-link href="/docs" external>
        documentation
        <neo-icon slot="suffix" name="launch"></neo-icon>
      </neo-link>.
    </p>
  </div>
\`; 