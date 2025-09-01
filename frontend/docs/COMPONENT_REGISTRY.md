# Component Registry

This document serves as the official registry for all components in the NeoForge frontend. It helps prevent duplicate implementations by providing a single source of truth for component locations and usage guidelines.

## Purpose

- Provide a centralized registry of all components
- Prevent duplicate implementations
- Document component locations and import paths
- Establish clear organization guidelines
- Facilitate component discovery and reuse

## Component Organization Guidelines

### Directory Structure

Components are organized following the Atomic Design methodology:

- **Atoms**: `src/components/atoms/` - Basic building blocks (buttons, inputs, icons)
- **Molecules**: `src/components/molecules/` - Simple combinations of atoms (form fields, cards)
- **Organisms**: `src/components/organisms/` - Complex UI sections (navigation, tables)
- **Templates**: `src/components/templates/` - Page layouts without specific content
- **Pages**: `src/pages/` - Complete page components

### Special Directories

- **UI**: `src/components/ui/` - Core UI components used throughout the application
- **Layout**: `src/components/layout/` - Layout components (header, footer, sidebar)
- **Auth**: `src/components/auth/` - Authentication-related components
- **Error**: `src/components/error/` - Error handling components

### Naming Conventions

- Component files should use kebab-case: `button.js`, `data-table.js`
- Component classes should use PascalCase: `NeoButton`, `DataTable`
- Component tags should use kebab-case with the `neo-` prefix: `<neo-button>`, `<neo-data-table>`
- Index files (`index.js`) should be used for component folders with multiple files

## Component Registry

### UI Components

| Component Name | File Location | Import Path | Description |
|----------------|--------------|-------------|-------------|
| Button | `src/components/ui/button.js` | `import { NeoButton } from "../components/ui/button.js"` | Primary button component with variants |
| Card | `src/components/ui/card.js` | `import { NeoCard } from "../components/ui/card.js"` | Card container with optional header and footer |
| Input | `src/components/ui/input.js` | `import { NeoInput } from "../components/ui/input.js"` | Text input with validation |
| Select | `src/components/ui/select.js` | `import { NeoSelect } from "../components/ui/select.js"` | Dropdown select component |
| Checkbox | `src/components/ui/checkbox.js` | `import { NeoCheckbox } from "../components/ui/checkbox.js"` | Checkbox input component |
| Radio | `src/components/ui/radio.js` | `import { NeoRadio } from "../components/ui/radio.js"` | Radio button component |
| Switch | `src/components/ui/switch.js` | `import { NeoSwitch } from "../components/ui/switch.js"` | Toggle switch component |
| Toast | `src/components/ui/toast/index.js` | `import { NeoToast, showToast } from "../components/ui/toast/index.js"` | Toast notification component |
| Modal | `src/components/ui/modal.js` | `import { NeoModal } from "../components/ui/modal.js"` | Modal dialog component |
| Tabs | `src/components/ui/tabs.js` | `import { NeoTabs } from "../components/ui/tabs.js"` | Tabbed interface component |
| Alert | `src/components/ui/alert.js` | `import { NeoAlert } from "../components/ui/alert.js"` | Alert message component |
| Badge | `src/components/ui/badge.js` | `import { NeoBadge } from "../components/ui/badge.js"` | Badge component for labels and counts |
| Spinner | `src/components/ui/spinner.js` | `import { NeoSpinner } from "../components/ui/spinner.js"` | Loading spinner component |
| Progress | `src/components/ui/progress.js` | `import { NeoProgress } from "../components/ui/progress.js"` | Progress bar component |
| Tooltip | `src/components/ui/tooltip.js` | `import { NeoTooltip } from "../components/ui/tooltip.js"` | Tooltip component |
| Icon | `src/components/ui/icon.js` | `import { NeoIcon } from "../components/ui/icon.js"` | Icon component |
| Avatar | `src/components/ui/avatar.js` | `import { NeoAvatar } from "../components/ui/avatar.js"` | User avatar component |
| Pagination | `src/components/ui/pagination.js` | `import { NeoPagination } from "../components/ui/pagination.js"` | Pagination component |

### Layout Components

| Component Name | File Location | Import Path | Description |
|----------------|--------------|-------------|-------------|
| Header | `src/components/layout/header.js` | `import { Header } from "../components/layout/header.js"` | Application header |
| Footer | `src/components/layout/footer.js` | `import { Footer } from "../components/layout/footer.js"` | Application footer |
| Sidebar | `src/components/layout/sidebar.js` | `import { Sidebar } from "../components/layout/sidebar.js"` | Application sidebar |
| Layout | `src/components/layout/layout.js` | `import { Layout } from "../components/layout/layout.js"` | Main layout component |

### Error Components

| Component Name | File Location | Import Path | Description |
|----------------|--------------|-------------|-------------|
| ErrorPage | `src/components/error/error-page.js` | `import { ErrorPage, showErrorPage } from "../components/error/error-page.js"` | Error page component |
| ErrorBoundary | `src/components/error/error-boundary.js` | `import { ErrorBoundary } from "../components/error/error-boundary.js"` | Error boundary component |

### Organism Components

| Component Name | File Location | Import Path | Description |
|----------------|--------------|-------------|-------------|
| Table | `src/components/organisms/table/table.js` | `import { NeoTable } from "../components/organisms/table/table.js"` | Data table component |
| Navigation | `src/components/organisms/navigation.js` | `import { NeoNavigation } from "../components/organisms/navigation.js"` | Navigation component |
| Form | `src/components/organisms/form.js` | `import { NeoForm } from "../components/organisms/form.js"` | Form component |
| Accordion | `src/components/organisms/accordion.js` | `import { NeoAccordion } from "../components/organisms/accordion.js"` | Accordion component |
| Breadcrumbs | `src/components/organisms/breadcrumbs.js` | `import { NeoBreadcrumbs } from "../components/organisms/breadcrumbs.js"` | Breadcrumbs component |
| Menu | `src/components/organisms/menu.js` | `import { NeoMenu } from "../components/organisms/menu.js"` | Menu component |
| Dropdown | `src/components/organisms/dropdown.js` | `import { NeoDropdown } from "../components/organisms/dropdown.js"` | Dropdown component |

### Auth Components

| Component Name | File Location | Import Path | Description |
|----------------|--------------|-------------|-------------|
| LoginForm | `src/components/auth/login-form.js` | `import { LoginForm } from "../components/auth/login-form.js"` | Login form component |
| RegisterForm | `src/components/auth/register-form.js` | `import { RegisterForm } from "../components/auth/register-form.js"` | Registration form component |
| ForgotPasswordForm | `src/components/auth/forgot-password-form.js` | `import { ForgotPasswordForm } from "../components/auth/forgot-password-form.js"` | Forgot password form |
| ResetPasswordForm | `src/components/auth/reset-password-form.js` | `import { ResetPasswordForm } from "../components/auth/reset-password-form.js"` | Reset password form |

## Adding New Components

When adding a new component:

1. Check this registry to ensure a similar component doesn't already exist
2. Follow the organization guidelines to determine the appropriate location
3. Use the established naming conventions
4. Add the component to this registry
5. Document the component's API and usage

## Modifying Existing Components

When modifying an existing component:

1. Update the component in its registered location
2. Do not create duplicate implementations
3. Update the component's documentation if necessary
4. If the component's API changes, update all usages across the codebase

## Component Linting

A linting rule has been established to detect potential component duplicates. The rule checks for:

1. Similar component names
2. Similar component APIs
3. Similar component functionality

If the linter detects a potential duplicate, it will warn you to check this registry.

## Maintenance

This registry should be updated whenever:

1. A new component is added
2. An existing component is moved or renamed
3. A component's API changes significantly
4. Component organization guidelines change

The registry is maintained by the frontend team and reviewed during code reviews.
