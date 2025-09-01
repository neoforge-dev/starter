export default {
  title: "Atoms/Avatar",
  component: "neo-avatar",
  parameters: {
    docs: {
      description: {
        component: `
The Avatar component displays user profile images with automatic fallback to initials and optional status indicators.

## Features
- Image URL with automatic fallback to initials
- Multiple sizes (sm, md, lg, xl)
- Status indicator support (online, offline, away, busy)
- Accessible alt text handling
- Error handling for broken images
- WCAG compliant styling and focus management

## Usage
Use this component to display user avatars in headers, cards, lists, and other UI elements. It gracefully handles missing or broken images.
        `,
      },
    },
  },
  argTypes: {
    src: {
      control: "text",
      description: "Image URL for the avatar",
    },
    name: {
      control: "text",
      description: "Full name used for generating initials and alt text",
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg", "xl"],
      description: "Size of the avatar",
    },
    status: {
      control: { type: "select" },
      options: ["", "online", "offline", "away", "busy"],
      description: "Status indicator",
    },
    alt: {
      control: "text",
      description: "Custom alt text (falls back to name)",
    },
    showStatus: {
      control: "boolean",
      description: "Whether to show the status indicator",
    },
  },
};

const Template = (args) => {
  return `
    <neo-avatar
      ${args.src ? `src="${args.src}"` : ""}
      ${args.name ? `name="${args.name}"` : ""}
      ${args.size ? `size="${args.size}"` : ""}
      ${args.status ? `status="${args.status}"` : ""}
      ${args.alt ? `alt="${args.alt}"` : ""}
      ${args.showStatus ? "show-status" : ""}
    ></neo-avatar>
  `;
};

export const Default = Template.bind({});
Default.args = {
  name: "John Doe",
};

export const WithImage = Template.bind({});
WithImage.args = {
  src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  name: "John Doe",
};

export const WithStatus = Template.bind({});
WithStatus.args = {
  name: "Jane Smith",
  status: "online",
  showStatus: true,
};

export const WithImageAndStatus = Template.bind({});
WithImageAndStatus.args = {
  src: "https://images.unsplash.com/photo-1494790108755-2616b612b93c?w=150&h=150&fit=crop&crop=face",
  name: "Sarah Johnson",
  status: "away",
  showStatus: true,
};

export const SmallSize = Template.bind({});
SmallSize.args = {
  name: "A B",
  size: "sm",
  status: "online",
  showStatus: true,
};

export const LargeSize = Template.bind({});
LargeSize.args = {
  name: "Large Avatar",
  size: "lg",
  status: "busy",
  showStatus: true,
};

export const ExtraLargeSize = Template.bind({});
ExtraLargeSize.args = {
  name: "XL Avatar",
  size: "xl",
  status: "offline",
  showStatus: true,
};

export const BrokenImage = Template.bind({});
BrokenImage.args = {
  src: "https://invalid-url.jpg",
  name: "Broken Image",
  status: "online",
  showStatus: true,
};

export const SingleInitial = Template.bind({});
SingleInitial.args = {
  name: "Cher",
};

export const AllStatuses = () => {
  return `
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <div style="text-align: center;">
        <neo-avatar name="Online User" status="online" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Online</div>
      </div>
      <div style="text-align: center;">
        <neo-avatar name="Away User" status="away" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Away</div>
      </div>
      <div style="text-align: center;">
        <neo-avatar name="Busy User" status="busy" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Busy</div>
      </div>
      <div style="text-align: center;">
        <neo-avatar name="Offline User" status="offline" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Offline</div>
      </div>
    </div>
  `;
};

AllStatuses.parameters = {
  docs: {
    description: {
      story: "Different status indicators available for the avatar component.",
    },
  },
};

export const AllSizes = () => {
  return `
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <div style="text-align: center;">
        <neo-avatar name="SM" size="sm" status="online" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Small (32px)</div>
      </div>
      <div style="text-align: center;">
        <neo-avatar name="MD" size="md" status="online" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Medium (40px)</div>
      </div>
      <div style="text-align: center;">
        <neo-avatar name="LG" size="lg" status="online" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Large (48px)</div>
      </div>
      <div style="text-align: center;">
        <neo-avatar name="XL" size="xl" status="online" show-status></neo-avatar>
        <div style="margin-top: 0.5rem; font-size: 0.875rem;">Extra Large (64px)</div>
      </div>
    </div>
  `;
};

AllSizes.parameters = {
  docs: {
    description: {
      story: "Different sizes available for the avatar component.",
    },
  },
};
