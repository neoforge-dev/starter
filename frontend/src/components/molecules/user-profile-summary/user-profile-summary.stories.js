export default {
  title: 'Molecules/UserProfileSummary',
  component: 'neo-user-profile-summary',
  parameters: {
    docs: {
      description: {
        component: 'User profile display component that combines avatar, name, status, and metadata in various layouts.'
      }
    }
  },
  argTypes: {
    user: { control: 'object' },
    layout: {
      control: 'select',
      options: ['compact', 'expanded', 'horizontal']
    },
    clickable: { control: 'boolean' },
    showStatus: { control: 'boolean' },
    showRole: { control: 'boolean' },
    showEmail: { control: 'boolean' },
    showLastSeen: { control: 'boolean' },
    showBorder: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl']
    },
    href: { control: 'text' }
  }
};

const sampleUser = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b811ff8a?w=150&h=150&fit=crop&crop=face',
  role: 'Admin',
  status: 'online',
  lastSeen: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
};

const Template = (args) => {
  const profile = document.createElement('neo-user-profile-summary');
  Object.keys(args).forEach(key => {
    if (args[key] !== undefined) {
      if (typeof args[key] === 'boolean') {
        if (args[key]) {
          profile.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), '');
        }
      } else if (typeof args[key] === 'object') {
        profile[key] = args[key];
      } else {
        profile.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), args[key]);
        profile[key] = args[key];
      }
    }
  });
  
  // Add event listeners for demonstration
  profile.addEventListener('neo-profile-click', (e) => {
    console.log('Profile clicked:', e.detail);
  });
  
  profile.addEventListener('neo-avatar-click', (e) => {
    console.log('Avatar clicked:', e.detail);
  });
  
  return profile;
};

export const Default = Template.bind({});
Default.args = {
  user: sampleUser,
  layout: 'horizontal',
  showStatus: true,
  showRole: true
};

export const Compact = Template.bind({});
Compact.args = {
  user: sampleUser,
  layout: 'compact',
  showStatus: true,
  showRole: true,
  size: 'sm'
};

export const Expanded = Template.bind({});
Expanded.args = {
  user: sampleUser,
  layout: 'expanded',
  showStatus: true,
  showRole: true,
  showEmail: true,
  showLastSeen: true,
  size: 'lg'
};

export const Clickable = Template.bind({});
Clickable.args = {
  user: sampleUser,
  layout: 'horizontal',
  clickable: true,
  href: '/profile/sarah-johnson',
  showStatus: true,
  showRole: true,
  showBorder: true
};

export const WithoutAvatar = Template.bind({});
WithoutAvatar.args = {
  user: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Member',
    status: 'away'
  },
  layout: 'horizontal',
  showStatus: true,
  showRole: true,
  showEmail: true
};

export const AllStatuses = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; max-width: 400px;';
  
  const statuses = [
    { status: 'online', name: 'Alice Cooper' },
    { status: 'away', name: 'Bob Smith' },
    { status: 'busy', name: 'Carol Davis' },
    { status: 'offline', name: 'David Wilson' }
  ];
  
  statuses.forEach(({ status, name }) => {
    const profile = document.createElement('neo-user-profile-summary');
    profile.user = {
      name,
      role: 'Member',
      status,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
    profile.showStatus = true;
    profile.showRole = true;
    profile.showBorder = true;
    container.appendChild(profile);
  });
  
  return container;
};

export const DifferentRoles = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; max-width: 400px;';
  
  const roles = [
    { role: 'Admin', name: 'System Administrator' },
    { role: 'Moderator', name: 'Content Moderator' },
    { role: 'Premium', name: 'Premium User' },
    { role: 'Member', name: 'Regular Member' },
    { role: 'Guest', name: 'Guest User' }
  ];
  
  roles.forEach(({ role, name }) => {
    const profile = document.createElement('neo-user-profile-summary');
    profile.user = {
      name,
      role,
      status: 'online',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`
    };
    profile.showRole = true;
    profile.showEmail = true;
    profile.showBorder = true;
    container.appendChild(profile);
  });
  
  return container;
};

export const Sizes = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; max-width: 400px;';
  
  const sizes = ['sm', 'md', 'lg', 'xl'];
  sizes.forEach(size => {
    const profile = document.createElement('neo-user-profile-summary');
    profile.user = {
      name: `${size.toUpperCase()} Profile`,
      role: 'Member',
      status: 'online',
      avatar: `https://ui-avatars.com/api/?name=${size}&background=random`
    };
    profile.size = size;
    profile.showStatus = true;
    profile.showRole = true;
    profile.showBorder = true;
    container.appendChild(profile);
  });
  
  return container;
};

export const Layouts = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;';
  
  const layouts = ['compact', 'horizontal', 'expanded'];
  layouts.forEach(layout => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;';
    
    const title = document.createElement('h3');
    title.textContent = `${layout.charAt(0).toUpperCase() + layout.slice(1)} Layout`;
    title.style.cssText = 'margin: 0 0 1rem 0; font-size: 0.875rem; color: #6b7280;';
    
    const profile = document.createElement('neo-user-profile-summary');
    profile.user = {
      name: 'Maria Garcia',
      email: 'maria@example.com',
      role: 'Designer',
      status: 'online',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      lastSeen: new Date().toISOString()
    };
    profile.layout = layout;
    profile.showStatus = true;
    profile.showRole = true;
    profile.showEmail = true;
    if (layout === 'expanded') {
      profile.showLastSeen = true;
    }
    
    wrapper.appendChild(title);
    wrapper.appendChild(profile);
    container.appendChild(wrapper);
  });
  
  return container;
};

export const InteractiveDemo = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 500px; padding: 1rem;';
  
  const profile = document.createElement('neo-user-profile-summary');
  profile.user = {
    name: 'Interactive User',
    email: 'user@example.com',
    role: 'Member',
    status: 'online',
    avatar: 'https://ui-avatars.com/api/?name=Interactive+User&background=3b82f6&color=fff',
    lastSeen: new Date().toISOString()
  };
  profile.clickable = true;
  profile.showStatus = true;
  profile.showRole = true;
  profile.showEmail = true;
  profile.showLastSeen = true;
  profile.showBorder = true;
  
  container.appendChild(profile);
  
  // Status display
  const status = document.createElement('div');
  status.style.cssText = 'margin-top: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 4px; font-size: 0.875rem;';
  status.textContent = 'Status: Ready for interaction';
  
  // Event listeners
  profile.addEventListener('neo-profile-click', (e) => {
    status.style.background = '#dbeafe';
    status.textContent = `Status: Profile clicked for ${e.detail.user.name}`;
  });
  
  profile.addEventListener('neo-avatar-click', (e) => {
    status.style.background = '#dcfce7';
    status.textContent = `Status: Avatar clicked for ${e.detail.user.name}`;
  });
  
  container.appendChild(status);
  
  // Controls
  const controls = document.createElement('div');
  controls.style.cssText = 'margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;';
  
  const toggleStatus = document.createElement('button');
  toggleStatus.textContent = 'Toggle Status';
  toggleStatus.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';
  toggleStatus.addEventListener('click', () => {
    const statuses = ['online', 'away', 'busy', 'offline'];
    const currentStatus = profile.user.status;
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    profile.user = { ...profile.user, status: statuses[nextIndex] };
  });
  
  const toggleLayout = document.createElement('button');
  toggleLayout.textContent = 'Toggle Layout';
  toggleLayout.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';
  toggleLayout.addEventListener('click', () => {
    const layouts = ['compact', 'horizontal', 'expanded'];
    const currentLayout = profile.layout;
    const currentIndex = layouts.indexOf(currentLayout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    profile.layout = layouts[nextIndex];
  });
  
  controls.appendChild(toggleStatus);
  controls.appendChild(toggleLayout);
  container.appendChild(controls);
  
  return container;
};