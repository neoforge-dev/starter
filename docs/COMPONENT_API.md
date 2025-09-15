# NeoForge Component API Reference

This document provides comprehensive documentation for the NeoForge frontend components and their APIs.

## Overview

NeoForge uses vanilla JavaScript with custom elements (Web Components) for its frontend architecture. All components are located in `frontend/src/components/` and follow consistent patterns for initialization, lifecycle management, and API design.

## Core Architecture

### Component Structure
```
frontend/src/components/
├── core/           # Core infrastructure components
├── router/         # Navigation and routing
├── services/       # Business logic services
├── pages/          # Page-level components
└── styles/         # Shared styles and themes
```

### Component Base Class
All components extend from a common base class that provides:
- Lifecycle management
- Event handling
- DOM manipulation utilities
- State management integration

## Core Components

### 1. NeoApp (Main Application Component)
**File:** `frontend/src/main.js`

The main application component that orchestrates the entire frontend.

#### Properties
```javascript
{
  currentRoute: string,      // Current active route
  user: object | null,       // Current authenticated user
  theme: string,            // Current theme ('light' | 'dark')
  isLoading: boolean,       // Global loading state
  notifications: array       // Active notifications
}
```

#### Methods
```javascript
// Navigation
navigateTo(route: string): void
goBack(): void
goForward(): void

// Authentication
login(credentials: object): Promise<void>
logout(): Promise<void>
refreshToken(): Promise<void>

// UI Management
showNotification(message: string, type: string): void
hideNotification(id: string): void
setTheme(theme: string): void
toggleTheme(): void

// Lifecycle
connectedCallback(): void
disconnectedCallback(): void
render(): void
```

#### Events
```javascript
// Dispatched Events
'route-changed'     // When navigation occurs
'user-logged-in'    // When user authentication succeeds
'user-logged-out'   // When user logs out
'theme-changed'     // When theme is changed
'notification-shown' // When notification is displayed
'loading-state-changed' // When global loading state changes
```

#### Usage
```javascript
// Initialize the app
const app = document.querySelector('neo-app');
app.navigateTo('/dashboard');

// Listen for events
app.addEventListener('route-changed', (event) => {
  console.log('Navigated to:', event.detail.route);
});
```

### 2. Router Component
**File:** `frontend/src/router.js`

Handles client-side routing and navigation.

#### Properties
```javascript
{
  routes: array,           // Array of route definitions
  currentRoute: string,    // Current active route
  history: array,          // Navigation history
  basePath: string         // Base path for routing
}
```

#### Route Definition
```javascript
{
  path: string,           // Route path (e.g., '/dashboard')
  component: string,      // Component name to render
  title: string,          // Page title
  requiresAuth: boolean,  // Whether route requires authentication
  roles: array,           // Required user roles
  meta: object           // Additional metadata
}
```

#### Methods
```javascript
// Navigation
navigate(path: string, options?: object): void
replace(path: string): void
go(delta: number): void
back(): void
forward(): void

// Route Management
addRoute(route: object): void
removeRoute(path: string): void
getRoute(path: string): object | null

// History
getHistory(): array
clearHistory(): void
```

#### Events
```javascript
'route-changed'      // Route navigation
'route-guarded'      // Route access denied
'navigation-error'   // Navigation failed
```

### 3. API Client Service
**File:** `frontend/src/services/api-client.js`

Handles all HTTP communication with the backend API.

#### Configuration
```javascript
{
  baseURL: string,        // API base URL
  timeout: number,        // Request timeout in ms
  retries: number,        // Number of retries for failed requests
  headers: object         // Default headers
}
```

#### Methods
```javascript
// HTTP Methods
get(endpoint: string, options?: object): Promise<any>
post(endpoint: string, data: any, options?: object): Promise<any>
put(endpoint: string, data: any, options?: object): Promise<any>
patch(endpoint: string, data: any, options?: object): Promise<any>
delete(endpoint: string, options?: object): Promise<any>

// Authentication
setAuthToken(token: string): void
clearAuthToken(): void
refreshToken(): Promise<string>

// Request Interceptors
addRequestInterceptor(interceptor: function): void
removeRequestInterceptor(interceptor: function): void

// Response Interceptors
addResponseInterceptor(interceptor: function): void
removeResponseInterceptor(interceptor: function): void
```

#### Usage
```javascript
import apiClient from './services/api-client.js';

// GET request
const users = await apiClient.get('/users');

// POST request with data
const newUser = await apiClient.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// File upload
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const result = await apiClient.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

## Page Components

### 1. Login Page
**File:** `frontend/src/pages/login-page.js`

User authentication interface.

#### Properties
```javascript
{
  email: string,          // User email input
  password: string,       // User password input
  rememberMe: boolean,    // Remember me checkbox
  isLoading: boolean,     // Login in progress
  errorMessage: string     // Error message to display
}
```

#### Methods
```javascript
// Authentication
async login(): Promise<void>
async handleSubmit(event: Event): Promise<void>
async validateForm(): boolean

// UI Management
showError(message: string): void
clearError(): void
setLoading(loading: boolean): void

// Navigation
redirectAfterLogin(): void
```

#### Events
```javascript
'login-success'     // Login successful
'login-error'       // Login failed
'form-invalid'      // Form validation failed
```

### 2. Registration Page
**File:** `frontend/src/pages/registration-page.js`

User registration interface.

#### Properties
```javascript
{
  email: string,          // User email
  password: string,       // User password
  confirmPassword: string,// Password confirmation
  fullName: string,       // User's full name
  acceptTerms: boolean,   // Terms acceptance
  isLoading: boolean,     // Registration in progress
  errors: object          // Validation errors
}
```

#### Methods
```javascript
// Registration
async register(): Promise<void>
async handleSubmit(event: Event): Promise<void>
async validateForm(): boolean

// Validation
validateEmail(email: string): boolean
validatePassword(password: string): boolean
validatePasswordMatch(): boolean

// UI Management
showError(field: string, message: string): void
clearErrors(): void
setLoading(loading: boolean): void
```

### 3. Dashboard Page
**File:** `frontend/src/pages/dashboard-page.js`

Main user dashboard interface.

#### Properties
```javascript
{
  user: object,           // Current user data
  stats: object,          // Dashboard statistics
  recentActivity: array,  // Recent user activity
  notifications: array,   // User notifications
  isLoading: boolean      // Data loading state
}
```

#### Methods
```javascript
// Data Loading
async loadDashboardData(): Promise<void>
async loadUserStats(): Promise<void>
async loadRecentActivity(): Promise<void>

// UI Management
renderStats(): void
renderActivity(): void
renderNotifications(): void

// User Actions
async markNotificationRead(id: string): Promise<void>
async updateProfile(): Promise<void>
```

## Service Components

### 1. Authentication Service
**File:** `frontend/src/services/auth.js`

Manages user authentication state and operations.

#### Properties
```javascript
{
  currentUser: object | null,    // Current authenticated user
  accessToken: string | null,    // JWT access token
  refreshToken: string | null,   // JWT refresh token
  isAuthenticated: boolean,      // Authentication status
  tokenExpiry: Date | null       // Token expiration time
}
```

#### Methods
```javascript
// Authentication
async login(credentials: object): Promise<object>
async logout(): Promise<void>
async refreshToken(): Promise<string>
async register(userData: object): Promise<object>

// Token Management
setTokens(accessToken: string, refreshToken: string): void
clearTokens(): void
isTokenExpired(): boolean
getTokenExpiry(): Date | null

// User Management
async getCurrentUser(): Promise<object>
async updateProfile(data: object): Promise<object>
async changePassword(data: object): Promise<void>

// Session Management
async getSessions(): Promise<array>
async revokeSession(sessionId: string): Promise<void>
async revokeOtherSessions(): Promise<void>
```

#### Events
```javascript
'auth-state-changed'    // Authentication state changed
'tokens-refreshed'      // Tokens were refreshed
'login-required'        // User needs to log in
'logout-complete'       // Logout completed
```

### 2. Notification Service
**File:** `frontend/src/services/notifications.js`

Manages application notifications and toasts.

#### Properties
```javascript
{
  notifications: array,     // Active notifications
  position: string,         // Notification position
  duration: number,         // Default duration in ms
  maxNotifications: number  // Maximum concurrent notifications
}
```

#### Methods
```javascript
// Notification Management
show(message: string, options?: object): string
success(message: string, options?: object): string
error(message: string, options?: object): string
warning(message: string, options?: object): string
info(message: string, options?: object): string

// Advanced Features
confirm(message: string, options?: object): Promise<boolean>
prompt(message: string, options?: object): Promise<string>

// Notification Control
dismiss(id: string): void
dismissAll(): void
update(id: string, options: object): void

// Configuration
setPosition(position: string): void
setDuration(duration: number): void
setMaxNotifications(max: number): void
```

#### Notification Options
```javascript
{
  type: string,           // 'success' | 'error' | 'warning' | 'info'
  title: string,          // Notification title
  message: string,        // Notification message
  duration: number,       // Auto-dismiss duration in ms
  dismissible: boolean,   // Can be manually dismissed
  position: string,       // Override position
  actions: array,         // Action buttons
  onClick: function,      // Click handler
  onDismiss: function     // Dismiss handler
}
```

### 3. Modal Service
**File:** `frontend/src/services/modal-service.js`

Manages modal dialogs and overlays.

#### Methods
```javascript
// Modal Types
alert(message: string, options?: object): Promise<void>
confirm(message: string, options?: object): Promise<boolean>
prompt(message: string, options?: object): Promise<string>

// Custom Modals
show(component: string, props?: object): Promise<any>
hide(id: string): void
hideAll(): void

// Modal Management
getActiveModals(): array
isModalOpen(id: string): boolean
focusModal(id: string): void
```

## Utility Components

### 1. Loading Indicator
**File:** `frontend/src/components/core/loading-indicator.js`

Displays loading states and progress indicators.

#### Properties
```javascript
{
  type: string,          // 'spinner' | 'progress' | 'skeleton'
  size: string,          // 'small' | 'medium' | 'large'
  color: string,         // CSS color value
  message: string,       // Loading message
  progress: number       // Progress percentage (0-100)
}
```

#### Methods
```javascript
// Control
show(): void
hide(): void
setProgress(progress: number): void
setMessage(message: string): void
```

### 2. Error Boundary
**File:** `frontend/src/components/core/error-boundary.js`

Catches and handles JavaScript errors in component tree.

#### Properties
```javascript
{
  hasError: boolean,     // Whether an error occurred
  error: Error | null,   // The caught error
  errorInfo: object,     // Error information
  fallback: string       // Fallback component to render
}
```

#### Methods
```javascript
// Error Handling
handleError(error: Error, errorInfo: object): void
resetError(): void
renderError(): void
```

#### Events
```javascript
'error-caught'     // When an error is caught
'error-reset'      // When error state is reset
```

## Styling and Themes

### CSS Custom Properties
NeoForge uses CSS custom properties for theming:

```css
:root {
  /* Colors */
  --color-primary: #4f46e5;
  --color-secondary: #7c3aed;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Typography */
  --font-family: 'Inter', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Layout */
  --border-radius: 0.375rem;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Theme Management
```javascript
// Apply theme
document.documentElement.setAttribute('data-theme', 'dark');

// Check current theme
const currentTheme = document.documentElement.getAttribute('data-theme');

// Toggle theme
const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', newTheme);
```

## Component Lifecycle

### Initialization
```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.initializeProperties();
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.loadData();
  }

  disconnectedCallback() {
    this.detachEventListeners();
    this.cleanup();
  }
}
```

### State Management
```javascript
class MyComponent extends HTMLElement {
  set state(newState) {
    this._state = { ...this._state, ...newState };
    this.render();
    this.dispatchEvent(new CustomEvent('state-changed', {
      detail: { state: this._state }
    }));
  }

  get state() {
    return this._state;
  }
}
```

## Best Practices

### 1. Component Design
- Keep components small and focused on single responsibility
- Use descriptive names with kebab-case (e.g., `user-profile`)
- Always define component properties and methods clearly
- Handle errors gracefully with user-friendly messages

### 2. Event Handling
- Use custom events for component communication
- Include relevant data in event detail objects
- Clean up event listeners in `disconnectedCallback`
- Debounce rapid events when necessary

### 3. Performance
- Use `requestAnimationFrame` for DOM updates
- Implement virtual scrolling for large lists
- Lazy load components when possible
- Minimize DOM queries and manipulations

### 4. Accessibility
- Use semantic HTML elements
- Provide ARIA labels and descriptions
- Support keyboard navigation
- Maintain sufficient color contrast
- Test with screen readers

### 5. Testing
- Write unit tests for component logic
- Test user interactions and edge cases
- Mock external dependencies
- Use testing utilities for DOM assertions

## Migration from Lit

If migrating from Lit to vanilla Web Components:

1. **Replace Lit decorators** with native custom element definition
2. **Convert template literals** to manual DOM creation or template elements
3. **Replace reactive properties** with manual state management
4. **Update imports** to remove Lit dependencies
5. **Adapt lifecycle methods** to native Web Component lifecycle

## Browser Support

NeoForge components support all modern browsers:
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

For older browsers, consider using polyfills for:
- Custom Elements
- Shadow DOM
- ES6 Modules
- Fetch API
- Promise

## Contributing

When adding new components:

1. Follow the established file structure
2. Include comprehensive JSDoc comments
3. Add component to the appropriate category
4. Update this documentation
5. Write tests for the new component
6. Ensure accessibility compliance