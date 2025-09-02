# Getting Started with NeoForge Components

> Get from zero to production-ready UI in under 10 minutes with our no-build component library.

## 🚀 Quick Start (2 minutes)

### 1. Project Setup

Create a new HTML file or add to your existing project:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My NeoForge App</title>
  
  <!-- Import NeoForge styles -->
  <link rel="stylesheet" href="./src/styles/global.css">
</head>
<body>
  <!-- Content goes here -->
</body>
</html>
```

### 2. Import Your First Component

Add a script tag to import any component:

```html
<script type="module" src="./src/components/atoms/button/button.js"></script>
```

### 3. Use the Component

Now you can use the component anywhere in your HTML:

```html
<neo-button variant="primary" size="lg">
  My First NeoForge Button
</neo-button>
```

**That's it!** Your button is fully functional with hover states, focus management, and accessibility features built-in.

## 📦 Installation Options

### Option 1: Direct Download (Recommended)
Download the NeoForge component library and include it in your project:

```bash
# Clone the repository
git clone https://github.com/neoforge-dev/neoforge-starter.git
cd neoforge-starter/frontend

# Copy components to your project
cp -r src/components /path/to/your/project/
cp -r src/styles /path/to/your/project/
```

### Option 2: CDN (Coming Soon)
```html
<script type="module" src="https://cdn.neoforge.dev/components/latest/all.js"></script>
```

### Option 3: NPM Package (Coming Soon)
```bash
npm install @neoforge/components
```

## 🏗️ Project Structure

Here's the recommended structure for projects using NeoForge:

```
your-project/
├── index.html              # Your main HTML file
├── src/
│   ├── components/         # NeoForge components
│   │   ├── atoms/
│   │   ├── molecules/
│   │   └── organisms/
│   ├── styles/             # NeoForge styles
│   │   ├── global.css
│   │   ├── base.js
│   │   └── tokens.js
│   ├── pages/              # Your application pages
│   └── assets/             # Static assets
└── docs/                   # Component documentation
```

## 🎨 Basic Styling Setup

### 1. Include Global Styles

```html
<!-- Required: Base styles and design tokens -->
<link rel="stylesheet" href="./src/styles/global.css">
```

### 2. Customize Design Tokens

Create your own theme by overriding CSS custom properties:

```css
/* custom-theme.css */
:root {
  /* Brand Colors */
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-success: #22c55e;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-base: 1rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### 3. Include Your Custom Theme

```html
<link rel="stylesheet" href="./src/styles/global.css">
<link rel="stylesheet" href="./custom-theme.css">
```

## 🧱 Using Components

### Basic Component Usage

Every component can be used with simple HTML syntax:

```html
<!-- Button with all features -->
<neo-button 
  variant="primary"
  size="lg"
  loading="false"
  disabled="false">
  Click me
</neo-button>

<!-- Input with validation -->
<neo-input 
  type="email"
  label="Your Email"
  placeholder="Enter your email"
  required>
</neo-input>

<!-- Avatar with status indicator -->
<neo-avatar 
  src="/user-avatar.jpg"
  name="John Doe"
  size="lg"
  status="online">
</neo-avatar>
```

### Setting Properties with JavaScript

For complex properties (objects, arrays), use JavaScript:

```javascript
// Import the component first
import './src/components/molecules/input-field/input-field.js';

// Get reference to element
const inputField = document.querySelector('neo-input-field');

// Set complex properties
inputField.validationRules = {
  required: true,
  minLength: 8,
  pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
  customValidator: (value) => value !== 'password'
};

// Listen to events
inputField.addEventListener('neo-input-change', (e) => {
  console.log('Input changed:', e.detail.value);
});
```

### Event Handling

All components emit consistent custom events:

```javascript
// Button clicks
document.addEventListener('neo-button-click', (e) => {
  console.log('Button clicked:', e.detail);
});

// Form submissions  
document.addEventListener('neo-form-submit', (e) => {
  const { values, isValid } = e.detail;
  if (isValid) {
    submitForm(values);
  }
});

// Table interactions
document.addEventListener('neo-table-row-select', (e) => {
  const { row, selected } = e.detail;
  console.log(`Row ${row.id} ${selected ? 'selected' : 'deselected'}`);
});
```

## 🎯 Common Patterns

### 1. Building a Login Form

```html
<script type="module" src="./src/components/atoms/button/button.js"></script>
<script type="module" src="./src/components/molecules/input-field/input-field.js"></script>

<form id="login-form">
  <h1>Sign In</h1>
  
  <neo-input-field
    name="email"
    type="email" 
    label="Email Address"
    placeholder="Enter your email"
    required>
  </neo-input-field>
  
  <neo-input-field
    name="password"
    type="password"
    label="Password" 
    placeholder="Enter your password"
    required>
  </neo-input-field>
  
  <neo-button 
    type="submit" 
    variant="primary" 
    size="lg" 
    full-width>
    Sign In
  </neo-button>
</form>

<script>
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const credentials = Object.fromEntries(formData);
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      window.location.href = '/dashboard';
    } else {
      // Handle error
      console.error('Login failed');
    }
  } catch (error) {
    console.error('Network error:', error);
  }
});
</script>
```

### 2. Creating a Data Table

```html
<script type="module" src="./src/components/organisms/data-table/data-table.js"></script>

<neo-data-table id="users-table">
</neo-data-table>

<script>
const table = document.getElementById('users-table');

// Configure table
table.columns = [
  { key: 'name', title: 'Name', sortable: true, type: 'avatar' },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'role', title: 'Role', type: 'badge' },
  { key: 'status', title: 'Status', type: 'badge' },
  { key: 'actions', title: 'Actions', type: 'actions' }
];

table.data = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: { text: 'Admin', variant: 'primary' },
    status: { text: 'Active', variant: 'success' },
    avatar: '/avatars/john.jpg'
  }
  // ... more data
];

table.searchable = true;
table.selectable = true;
table.exportable = true;

// Handle events
table.addEventListener('neo-table-row-click', (e) => {
  const { row } = e.detail;
  console.log('Row clicked:', row);
});
</script>
```

### 3. Dashboard Layout

```html
<script type="module" src="./src/components/organisms/dashboard-layout/dashboard-layout.js"></script>

<neo-dashboard-layout id="dashboard">
  <h1 slot="page-title">Dashboard Overview</h1>
  
  <!-- Page content -->
  <div class="dashboard-content">
    <neo-card>
      <h2>Welcome back!</h2>
      <p>Here's what's happening with your account today.</p>
    </neo-card>
  </div>
</neo-dashboard-layout>

<script>
const dashboard = document.getElementById('dashboard');

// Set user info
dashboard.user = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/avatars/john.jpg',
  role: 'Administrator'
};

// Set navigation
dashboard.navigationItems = [
  { href: '/dashboard', text: 'Dashboard', icon: 'home', active: true },
  { href: '/users', text: 'Users', icon: 'users', badge: '12' },
  { href: '/settings', text: 'Settings', icon: 'settings' },
  { href: '/logout', text: 'Logout', icon: 'logout' }
];

// Enable features
dashboard.showSearch = true;
dashboard.showNotifications = true;
dashboard.notificationCount = 5;
</script>
```

## 🔧 Advanced Configuration

### Custom Component Imports

For better organization, create an import file:

```javascript
// components.js
export * from './src/components/atoms/button/button.js';
export * from './src/components/atoms/input/input.js';
export * from './src/components/molecules/input-field/input-field.js';
export * from './src/components/organisms/dashboard-layout/dashboard-layout.js';

// Then import all at once
import './components.js';
```

### TypeScript Support

Create type definitions for better development experience:

```typescript
// types.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'neo-button': {
        variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
        size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        disabled?: boolean;
        loading?: boolean;
        'full-width'?: boolean;
      };
      
      'neo-input': {
        type?: string;
        value?: string;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        error?: string;
      };
    }
  }
}
```

### Bundle Optimization

For production, consider using a module bundler to optimize loading:

```javascript
// main.js
import { lazyLoad } from './src/utils/lazy-loader.js';

// Load components on demand
lazyLoad('neo-button', () => import('./src/components/atoms/button/button.js'));
lazyLoad('neo-input', () => import('./src/components/atoms/input/input.js'));
```

## 🎯 Next Steps

Now that you have the basics set up:

1. **[Explore Components](./components/)** - Browse all available components
2. **[Design System](./design-system.md)** - Learn about theming and customization  
3. **[Best Practices](./guides/best-practices.md)** - Follow recommended patterns
4. **[Testing Guide](./guides/testing.md)** - Test your components effectively
5. **[Deployment](./guides/deployment.md)** - Optimize for production

## 🆘 Need Help?

- **[Component Reference](./components/)** - Detailed API documentation
- **[Examples](./examples/)** - Real-world implementation examples  
- **[FAQ](./guides/faq.md)** - Common questions and solutions
- **[Community Support](./guides/support.md)** - Get help from the community

---

**Ready to build?** Start with the [Button component](./components/atoms/button.md) or explore the [complete component list](./components/).