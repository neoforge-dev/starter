/**
 * Component Template Generator
 *
 * Generates the base Lit component template based on user inputs
 */

export function generateComponentTemplate(config) {
  const {
    componentName,
    className,
    category,
    description,
    properties = [],
    hasSlots = false,
    hasEvents = false
  } = config;

  const propertyDefinitions = properties.map(prop => {
    return `      ${prop.name}: { type: ${prop.type}, reflect: ${prop.reflect || false} }`;
  }).join(',\n');

  const constructorDefaults = properties.map(prop => {
    const defaultValue = prop.defaultValue || getDefaultForType(prop.type);
    return `    this.${prop.name} = ${JSON.stringify(defaultValue)};`;
  }).join('\n');

  const propertyJSDoc = properties.map(prop => {
    return ` * @prop {${prop.type.toLowerCase()}} ${prop.name} - ${prop.description}`;
  }).join('\n');

  const eventJSDoc = hasEvents ? `
 *
 * @event ${componentName}-change - Fired when component state changes
 * @event ${componentName}-click - Fired when component is clicked` : '';

  const slotJSDoc = hasSlots ? `
 *
 * @slot default - Main content slot` : '';

  return `import { html, css } from "lit";
import { baseStyles } from "../../styles/base.js";
import { BaseComponent } from "../../base-component.js";

/**
 * ${description}
 * @element ${componentName}
 *${propertyJSDoc}${eventJSDoc}${slotJSDoc}
 */
export class ${className} extends BaseComponent {
  static get properties() {
    return {
${propertyDefinitions}
    };
  }

  static get styles() {
    return [
      baseStyles,
      css\`
        :host {
          display: inline-block;
        }

        .container {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
        }

        .title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-medium);
          color: var(--color-text);
          margin-bottom: var(--spacing-sm);
        }

        .content {
          color: var(--color-text-secondary);
        }

        /* Add your custom styles here */
      \`
    ];
  }

  constructor() {
    super();
${constructorDefaults}
  }

  /**
   * Handle internal events
   */
  _handleInteraction(event) {
    event.preventDefault();
    event.stopPropagation();

    this.dispatchEvent(new CustomEvent('${componentName}-change', {
      bubbles: true,
      composed: true,
      detail: {
        value: event.target.value,
        originalEvent: event
      }
    }));
  }

  render() {
    return html\`
      <div class="container">
        <div class="title">\${this.title || '${className}'}</div>
        <div class="content">
          ${hasSlots ? `<slot></slot>` : `<p>Generated component ready for customization</p>`}
        </div>
      </div>
    \`;
  }
}

// Register the component
customElements.define("${componentName}", ${className});
`;
}

function getDefaultForType(type) {
  switch (type) {
    case 'Boolean': return false;
    case 'Number': return 0;
    case 'Array': return [];
    case 'Object': return {};
    case 'String':
    default: return '';
  }
}
