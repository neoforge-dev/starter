import {   html   } from 'lit';
// action import removed - not used
import "./app-header.js"; // Assuming component is defined here
import "../../atoms/button/button.js";

export default {
  title: "Core/App Header",
  component: "app-header",
  argTypes: {
    user: {
      control: "object",
      description: 'User object (if logged in), e.g., { name: "Jane Doe" }',
    },
    logoUrl: {
      control: "text",
      description: "URL for the application logo",
    },
    appName: {
      control: "text",
      description: "Name of the application",
    },
    navItems: {
      control: "object",
      description:
        'Array of navigation items, e.g., [{ label: "Home", href: "/" }]',
    },
    // Events
    onLogin: { action: "login", table: { category: "Events" } },
    onLogout: { action: "logout", table: { category: "Events" } },
    onCreateAccount: { action: "createAccount", table: { category: "Events" } },
    onNavClick: { action: "navClick", table: { category: "Events" } }, // Assuming a nav item click event
  },
  parameters: {
    layout: "fullscreen", // Often best for headers
    docs: {
      description: {
        component:
          "The main application header, handling branding, navigation, and user status.",
      },
    },
  },
};

const Template = ({
  user,
  logoUrl,
  appName,
  navItems,
  onLogin,
  onLogout,
  onCreateAccount,
  onNavClick,
}) => html`
  <app-header
    .user=${user}
    logoUrl=${logoUrl || "./logo.svg"}
    appName=${appName || "NeoForge"}
    .navItems=${navItems}
    @login=${(e) => onLogin(e.detail)}
    @logout=${(e) => onLogout(e.detail)}
    @create-account=${(e) => onCreateAccount(e.detail)}
    @nav-click=${(e) => onNavClick(e.detail)}
  >
    <!-- Example of potentially adding items via slot if supported -->
    <!-- <neo-button slot="actions" variant="primary">Sign Up</neo-button> -->
  </app-header>
`;

const defaultNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Settings", href: "/settings" },
  { label: "Docs", href: "/docs" },
];

export const LoggedOut = Template.bind({});
LoggedOut.args = {
  user: null,
  navItems: defaultNavItems,
};

export const LoggedIn = Template.bind({});
LoggedIn.args = {
  user: { name: "Jane Doe" },
  navItems: defaultNavItems,
};

export const MinimalNav = Template.bind({});
MinimalNav.args = {
  user: null,
  navItems: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
  ],
};

export const CustomBranding = Template.bind({});
CustomBranding.args = {
  user: { name: "Custom User" },
  logoUrl: "https://via.placeholder.com/100x40?text=LOGO",
  appName: "My Custom App",
  navItems: defaultNavItems,
};
