export default {
  title: 'Molecules/NavigationLink',
  component: 'neo-navigation-link',
  parameters: {
    docs: {
      description: {
        component: 'Navigation link component with icon, badge, active state, and accessibility features for building navigation menus.'
      }
    }
  },
  argTypes: {
    href: { control: 'text' },
    text: { control: 'text' },
    icon: { control: 'text' },
    iconPosition: {
      control: 'select',
      options: ['left', 'right']
    },
    active: { control: 'boolean' },
    disabled: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    target: {
      control: 'select',
      options: ['_self', '_blank', '_parent', '_top']
    },
    badge: { control: 'text' },
    badgeVariant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'neutral']
    },
    description: { control: 'text' },
    external: { control: 'boolean' },
    download: { control: 'boolean' },
    exact: { control: 'boolean' }
  }
};

const Template = (args) => {
  const navLink = document.createElement('neo-navigation-link');
  Object.keys(args).forEach(key => {
    if (args[key] !== undefined) {
      if (typeof args[key] === 'boolean') {
        if (args[key]) {
          navLink.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), '');
        }
      } else {
        navLink.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), args[key]);
        navLink[key] = args[key];
      }
    }
  });

  // Add event listeners for demonstration
  navLink.addEventListener('neo-navigation-click', (e) => {
    console.log('Navigation click:', e.detail);
  });

  navLink.addEventListener('neo-navigation-focus', (e) => {
    console.log('Navigation focus:', e.detail);
  });

  return navLink;
};

export const Default = Template.bind({});
Default.args = {
  href: '/dashboard',
  text: 'Dashboard',
  icon: 'home'
};

export const Active = Template.bind({});
Active.args = {
  href: '/dashboard',
  text: 'Dashboard',
  icon: 'home',
  active: true
};

export const WithBadge = Template.bind({});
WithBadge.args = {
  href: '/notifications',
  text: 'Notifications',
  icon: 'bell',
  badge: '3',
  badgeVariant: 'error'
};

export const ExternalLink = Template.bind({});
ExternalLink.args = {
  href: 'https://example.com',
  text: 'External Link',
  icon: 'link',
  external: true
};

export const DownloadLink = Template.bind({});
DownloadLink.args = {
  href: '/files/document.pdf',
  text: 'Download PDF',
  icon: 'file-text',
  download: true,
  downloadName: 'important-document.pdf'
};

export const Disabled = Template.bind({});
Disabled.args = {
  href: '/settings',
  text: 'Settings',
  icon: 'settings',
  disabled: true
};

export const IconRight = Template.bind({});
IconRight.args = {
  href: '/profile',
  text: 'Profile',
  icon: 'user',
  iconPosition: 'right'
};

export const Primary = Template.bind({});
Primary.args = {
  href: '/important',
  text: 'Important Link',
  icon: 'star',
  variant: 'primary'
};

export const Secondary = Template.bind({});
Secondary.args = {
  href: '/secondary',
  text: 'Secondary Link',
  icon: 'info',
  variant: 'secondary'
};

export const AllSizes = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;';

  const sizes = ['sm', 'md', 'lg'];
  sizes.forEach(size => {
    const navLink = document.createElement('neo-navigation-link');
    navLink.href = '#';\n    navLink.text = `${size.toUpperCase()} Navigation Link`;\n    navLink.icon = 'home';\n    navLink.size = size;\n    navLink.badge = '5';\n    container.appendChild(navLink);\n  });\n  \n  return container;\n};\n\nexport const AllVariants = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;';\n  \n  const variants = [\n    { variant: 'default', text: 'Default Link' },\n    { variant: 'primary', text: 'Primary Link' },\n    { variant: 'secondary', text: 'Secondary Link' }\n  ];\n  \n  variants.forEach(({ variant, text }) => {\n    const navLink = document.createElement('neo-navigation-link');\n    navLink.href = '#';\n    navLink.text = text;\n    navLink.icon = 'link';\n    navLink.variant = variant;\n    container.appendChild(navLink);\n  });\n  \n  return container;\n};\n\nexport const NavigationMenu = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'display: flex; flex-direction: column; gap: 0.25rem; width: 250px; padding: 1rem; background: #f9fafb; border-radius: 8px;';\n  \n  const menuItems = [\n    { href: '/dashboard', text: 'Dashboard', icon: 'home', active: true },\n    { href: '/projects', text: 'Projects', icon: 'folder', badge: '12' },\n    { href: '/tasks', text: 'Tasks', icon: 'check-square', badge: '5', badgeVariant: 'warning' },\n    { href: '/team', text: 'Team', icon: 'users' },\n    { href: '/analytics', text: 'Analytics', icon: 'bar-chart' },\n    { href: '/settings', text: 'Settings', icon: 'settings' },\n    { href: '/help', text: 'Help & Support', icon: 'help-circle', external: true }\n  ];\n  \n  const title = document.createElement('h3');\n  title.textContent = 'Main Navigation';\n  title.style.cssText = 'margin: 0 0 1rem 0; font-size: 0.875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;';\n  container.appendChild(title);\n  \n  menuItems.forEach(item => {\n    const navLink = document.createElement('neo-navigation-link');\n    Object.assign(navLink, item);\n    container.appendChild(navLink);\n  });\n  \n  return container;\n};\n\nexport const HorizontalNavigation = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'display: flex; gap: 0.5rem; padding: 1rem; background: white; border: 1px solid #e5e7eb; border-radius: 8px;';\n  \n  const navItems = [\n    { href: '/home', text: 'Home', icon: 'home', active: true },\n    { href: '/about', text: 'About', icon: 'info' },\n    { href: '/services', text: 'Services', icon: 'briefcase' },\n    { href: '/contact', text: 'Contact', icon: 'mail' }\n  ];\n  \n  navItems.forEach(item => {\n    const navLink = document.createElement('neo-navigation-link');\n    Object.assign(navLink, item);\n    container.appendChild(navLink);\n  });\n  \n  return container;\n};\n\nexport const BreadcrumbNavigation = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; padding: 1rem;';\n  \n  const breadcrumbs = [\n    { href: '/', text: 'Home', size: 'sm' },\n    { href: '/projects', text: 'Projects', size: 'sm' },\n    { href: '/projects/website', text: 'Website Project', size: 'sm', active: true }\n  ];\n  \n  breadcrumbs.forEach((item, index) => {\n    if (index > 0) {\n      const separator = document.createElement('span');\n      separator.textContent = '/';\n      separator.style.cssText = 'color: #6b7280; font-size: 0.875rem;';\n      container.appendChild(separator);\n    }\n    \n    const navLink = document.createElement('neo-navigation-link');\n    Object.assign(navLink, item);\n    container.appendChild(navLink);\n  });\n  \n  return container;\n};\n\nexport const InteractiveDemo = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'max-width: 400px; padding: 1rem;';\n  \n  // Main navigation\n  const nav = document.createElement('div');\n  nav.style.cssText = 'display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 2rem; padding: 1rem; background: #f9fafb; border-radius: 8px;';\n  \n  const navTitle = document.createElement('h3');\n  navTitle.textContent = 'Interactive Navigation';\n  navTitle.style.cssText = 'margin: 0 0 1rem 0; font-size: 1rem;';\n  nav.appendChild(navTitle);\n  \n  const navItems = [\n    { id: 'dashboard', href: '/dashboard', text: 'Dashboard', icon: 'home' },\n    { id: 'messages', href: '/messages', text: 'Messages', icon: 'mail', badge: '0' },\n    { id: 'notifications', href: '/notifications', text: 'Notifications', icon: 'bell', badge: '0' },\n    { id: 'settings', href: '/settings', text: 'Settings', icon: 'settings' }\n  ];\n  \n  const links = {};\n  navItems.forEach(item => {\n    const navLink = document.createElement('neo-navigation-link');\n    Object.assign(navLink, item);\n    links[item.id] = navLink;\n    nav.appendChild(navLink);\n  });\n  \n  // Set initial active state\n  links.dashboard.active = true;\n  \n  // Status display\n  const status = document.createElement('div');\n  status.style.cssText = 'padding: 1rem; background: #f3f4f6; border-radius: 4px; font-size: 0.875rem; margin-bottom: 1rem;';\n  status.textContent = 'Status: Dashboard is active';\n  \n  // Event listeners\n  Object.entries(links).forEach(([id, link]) => {\n    link.addEventListener('neo-navigation-click', (e) => {\n      e.preventDefault(); // Prevent actual navigation in demo\n      \n      // Update active states\n      Object.values(links).forEach(l => l.active = false);\n      link.active = true;\n      \n      status.style.background = '#dbeafe';\n      status.textContent = `Status: Navigated to ${link.text}`;\n    });\n  });\n  \n  // Controls\n  const controls = document.createElement('div');\n  controls.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap;';\n  \n  const addMessageButton = document.createElement('button');\n  addMessageButton.textContent = 'Add Message';\n  addMessageButton.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  addMessageButton.addEventListener('click', () => {\n    const current = parseInt(links.messages.badge) || 0;\n    links.messages.updateBadge(String(current + 1), 'primary');\n  });\n  \n  const addNotificationButton = document.createElement('button');\n  addNotificationButton.textContent = 'Add Notification';\n  addNotificationButton.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  addNotificationButton.addEventListener('click', () => {\n    const current = parseInt(links.notifications.badge) || 0;\n    links.notifications.updateBadge(String(current + 1), 'error');\n  });\n  \n  const clearBadgesButton = document.createElement('button');\n  clearBadgesButton.textContent = 'Clear Badges';\n  clearBadgesButton.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  clearBadgesButton.addEventListener('click', () => {\n    links.messages.badge = '0';\n    links.notifications.badge = '0';\n    links.messages.requestUpdate();\n    links.notifications.requestUpdate();\n  });\n  \n  controls.appendChild(addMessageButton);\n  controls.appendChild(addNotificationButton);\n  controls.appendChild(clearBadgesButton);\n  \n  container.appendChild(nav);\n  container.appendChild(status);\n  container.appendChild(controls);\n  \n  return container;\n};
