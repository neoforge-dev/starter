# ESLint Plugin: Component Registry

This ESLint plugin helps prevent duplicate component implementations by detecting components with similar names or functionality.

## Installation

1. Install the plugin:

```bash
npm install --save-dev eslint-plugin-component-registry
```

2. Add the plugin to your ESLint configuration:

```json
{
  "plugins": [
    "component-registry"
  ],
  "rules": {
    "component-registry/no-duplicate-components": "warn"
  },
  "settings": {
    "componentRegistry": {
      "registryPath": "./docs/COMPONENT_REGISTRY.md"
    }
  }
}
```

## Rules

### `no-duplicate-components`

This rule detects potential component duplicates by:

1. Identifying component classes (classes that extend HTMLElement, LitElement, or BaseComponent)
2. Checking for components with similar names
3. Checking for components with similar tag names

#### Examples

```javascript
// This will trigger a warning if another component with a similar name exists
class Button extends LitElement {
  // ...
}

// This will trigger a warning if another component with a similar tag name exists
customElements.define('neo-button', Button);
```

## How It Works

The plugin analyzes your code to find component definitions and custom element registrations. It then compares component names and tag names to detect potential duplicates.

When a potential duplicate is found, the plugin will warn you to check the component registry.

## Configuration

You can configure the plugin by adding a `componentRegistry` section to your ESLint settings:

```json
"settings": {
  "componentRegistry": {
    "registryPath": "./docs/COMPONENT_REGISTRY.md"
  }
}
```

- `registryPath`: Path to your component registry file

## Integration with Component Registry

This plugin works best when used in conjunction with a component registry. The component registry serves as a single source of truth for all components in your application.

When the plugin detects a potential duplicate, it will suggest checking the component registry for the existing component.

## Best Practices

1. Always check the component registry before creating a new component
2. Follow the naming conventions established in your project
3. Use the plugin to catch potential duplicates early in the development process
4. Keep your component registry up to date 