# NeoForge Atomic Design System

## Overview

Our component library follows atomic design principles to create a scalable, maintainable, and consistent design system. This methodology breaks down interfaces into fundamental building blocks that combine to create increasingly complex components.

## Component Structure

```
src/components/
├── atoms/          # Basic building blocks
├── molecules/      # Simple combinations
├── organisms/      # Complex components
├── templates/      # Layout patterns
├── pages/          # Complete interfaces
└── tokens/         # Design variables
```

## 1. Atoms

Atoms are the basic building blocks of matter. In our interfaces, atoms are the smallest possible components that can still maintain their own functionality.

### Available Atoms

| Component | Description | Status |
|-----------|-------------|--------|
| Button | Core action element with variants | ✅ |
| Input | Text input with validation | ✅ |
| Badge | Status and notification indicator | ✅ |
| Spinner | Loading indicator | ✅ |
| Checkbox | Selection control | ✅ |
| Radio | Single selection control | ✅ |
| Icon | SVG icon system | ✅ |
| Typography | Text elements | ✅ |

### Usage Example

```javascript
import { NeoButton, NeoInput } from '@components/atoms';

// Button usage
<neo-button variant="primary">Click Me</neo-button>

// Input usage
<neo-input 
  type="email"
  label="Email Address"
  required
></neo-input>
```

## 2. Molecules

Molecules are groups of atoms bonded together to form a functional component with a single responsibility.

### Available Molecules

| Component | Description | Status |
|-----------|-------------|--------|
| Card | Content container | ✅ |
| Breadcrumbs | Navigation aid | ✅ |
| Tabs | Content organization | ✅ |
| DatePicker | Date selection | ✅ |
| Select | Enhanced selection | ✅ |
| PhoneInput | Phone number input | ✅ |
| LanguageSelector | Language selection | ✅ |
| SearchBar | Search interface | 🚧 |

### Usage Example

```javascript
import { NeoCard, NeoTabs } from '@components/molecules';

// Card usage
<neo-card>
  <h2 slot="header">Card Title</h2>
  <div slot="content">Card content</div>
  <div slot="footer">Card actions</div>
</neo-card>

// Tabs usage
<neo-tabs>
  <neo-tab label="Profile">Profile content</neo-tab>
  <neo-tab label="Settings">Settings content</neo-tab>
</neo-tabs>
```

## 3. Organisms

Organisms are complex UI components composed of groups of molecules and/or atoms that form distinct sections of an interface.

### Available Organisms

| Component | Description | Status |
|-----------|-------------|--------|
| Modal | Dialog windows | ✅ |
| Toast | Notification system | ✅ |
| DataTable | Data display and manipulation | ✅ |
| FileUpload | File handling | ✅ |
| RichTextEditor | Text editing | ✅ |
| Form | Form handling | ✅ |
| Navigation | Site navigation | ✅ |
| Pagination | Page navigation | ✅ |

### Usage Example

```javascript
import { NeoModal, NeoDataTable } from '@components/organisms';

// Modal usage
<neo-modal>
  <h2 slot="header">Modal Title</h2>
  <div slot="content">Modal content</div>
  <div slot="footer">
    <neo-button variant="primary">Save</neo-button>
  </div>
</neo-modal>

// DataTable usage
<neo-data-table
  .data=\${data}
  .columns=\${columns}
  sortable
  filterable
></neo-data-table>
```

## 4. Templates

Templates are page-level objects that place components into a layout and articulate the design's underlying content structure.

### Available Templates

| Template | Description | Status |
|----------|-------------|--------|
| Dashboard | Admin dashboard layout | ✅ |
| Article | Content page layout | ✅ |
| Landing | Marketing page layout | ✅ |
| Documentation | Documentation layout | ✅ |
| Form | Complex form layout | ✅ |

### Usage Example

```javascript
import { NeoDashboardTemplate } from '@components/templates';

<neo-dashboard-template>
  <neo-sidebar slot="sidebar">...</neo-sidebar>
  <neo-main slot="main">...</neo-main>
</neo-dashboard-template>
```

## 5. Pages

Pages are specific instances of templates that represent the final, user-facing interface.

### Available Pages

| Page | Description | Status |
|------|-------------|--------|
| Home | Landing page | ✅ |
| Login | Authentication | ✅ |
| Dashboard | User dashboard | ✅ |
| Profile | User profile | ✅ |
| Settings | User settings | ✅ |

### Usage Example

```javascript
import { NeoHomePage } from '@components/pages';

<neo-home-page
  .user=\${currentUser}
  .features=\${features}
></neo-home-page>
```

## Design Tokens

Design tokens are the visual design atoms of the design system. They're used in place of hard-coded values to maintain a scalable and consistent visual system.

### Token Categories

```javascript
import { 
  colors,
  typography,
  spacing,
  elevation,
  animation
} from '@components/tokens/design-tokens';
```

### Available Tokens

#### Colors
```css
--color-primary: #007bff;
--color-secondary: #6c757d;
--color-success: #28a745;
--color-warning: #ffc107;
--color-error: #dc3545;
--color-info: #17a2b8;
```

#### Typography
```css
--font-family-primary: 'Inter', sans-serif;
--font-size-base: 16px;
--font-weight-normal: 400;
--font-weight-bold: 700;
--line-height-base: 1.5;
```

#### Spacing
```css
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;
```

## Best Practices

1. **Component Creation**
   - Keep components focused and single-purpose
   - Use composition over inheritance
   - Follow the Single Responsibility Principle

2. **State Management**
   - Use properties for component state
   - Implement reactive updates
   - Keep state changes predictable

3. **Styling**
   - Use design tokens for consistency
   - Implement CSS custom properties
   - Follow BEM naming convention

4. **Accessibility**
   - Include ARIA attributes
   - Support keyboard navigation
   - Maintain proper contrast ratios

## Development Workflow

1. Start with atoms
   - Create basic component
   - Add tests
   - Create story
   - Document usage

2. Compose molecules
   - Combine atoms
   - Test interactions
   - Create story
   - Document composition

3. Build organisms
   - Combine molecules/atoms
   - Test complex interactions
   - Create story
   - Document patterns

4. Create templates
   - Define layouts
   - Test responsiveness
   - Create story
   - Document structure

5. Implement pages
   - Use templates
   - Add real content
   - Test user flows
   - Document usage

## Contributing

1. Follow atomic design principles
2. Use existing design tokens
3. Include documentation
4. Add appropriate tests
5. Create story files
6. Update this documentation

## Resources

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Lit Documentation](https://lit.dev/) 