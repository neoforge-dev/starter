/**
 * Story Template Generator
 * 
 * Generates Storybook-compatible story files for components
 */

export function generateStoryTemplate(config) {
  const {
    componentName,
    className,
    category,
    description,
    properties = []
  } = config;

  const argTypes = properties.reduce((acc, prop) => {
    acc[prop.name] = {
      control: { type: getControlType(prop.type, prop.name) },
      description: prop.description,
      defaultValue: prop.defaultValue || getDefaultForType(prop.type),
      table: {
        type: { summary: prop.type.toLowerCase() },
        defaultValue: { summary: String(prop.defaultValue || getDefaultForType(prop.type)) }
      }
    };

    // Add options for known property patterns
    if (prop.name === 'variant') {
      acc[prop.name].options = ['default', 'primary', 'secondary', 'success', 'warning', 'error'];
    } else if (prop.name === 'size') {
      acc[prop.name].options = ['sm', 'md', 'lg'];
    }

    return acc;
  }, {});

  const args = properties.reduce((acc, prop) => {
    acc[prop.name] = prop.defaultValue || getDefaultForType(prop.type);
    return acc;
  }, {});

  return `import { html } from 'lit';
import { ${className} } from '../../components/${category}/${componentName}/${componentName}.js';

export default {
  title: '${category.charAt(0).toUpperCase() + category.slice(1)}/${className}',
  component: '${componentName}',
  parameters: {
    docs: {
      description: {
        component: '${description}'
      }
    }
  },
  argTypes: ${JSON.stringify(argTypes, null, 4)},
  args: ${JSON.stringify(args, null, 4)}
};

const Template = (args) => html\`
  <${componentName}
    ${properties.map(prop => `.\${args.${prop.name} ? '${prop.name}' : ''}`).join('\n    ')}
    ${properties.filter(prop => prop.type !== 'Boolean').map(prop => 
      `.${prop.name}="\${args.${prop.name}}"`
    ).join('\n    ')}
  >
    \${args.content || 'Component content'}
  </${componentName}>
\`;

export const Default = Template.bind({});
Default.args = {
  ${properties.map(prop => `${prop.name}: ${JSON.stringify(args[prop.name])}`).join(',\n  ')}
};

${generateVariantStories(properties)}

${generateStateStories(properties)}

export const AllVariants = () => html\`
  <div style="display: flex; flex-direction: column; gap: 1rem; padding: 2rem;">
    <h3>All ${className} Variants</h3>
    ${generateAllVariantsDemo(componentName, properties)}
  </div>
\`;

export const Playground = Template.bind({});
Playground.args = {
  ${properties.map(prop => `${prop.name}: ${JSON.stringify(args[prop.name])}`).join(',\n  ')}
};

export const Documentation = () => html\`
  <div style="max-width: 800px; margin: 0 auto; padding: 2rem;">
    <h1>${className} Component</h1>
    <p>${description}</p>
    
    <h2>Usage</h2>
    <pre><code>&lt;${componentName}${properties.length > 0 ? ' ' + properties.map(p => `${p.name}="${getExampleValue(p)}"`).join(' ') : ''}&gt;&lt;/${componentName}&gt;</code></pre>
    
    <h2>Properties</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #ddd;">
          <th style="text-align: left; padding: 0.5rem;">Property</th>
          <th style="text-align: left; padding: 0.5rem;">Type</th>
          <th style="text-align: left; padding: 0.5rem;">Default</th>
          <th style="text-align: left; padding: 0.5rem;">Description</th>
        </tr>
      </thead>
      <tbody>
        ${properties.map(prop => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 0.5rem;"><code>${prop.name}</code></td>
          <td style="padding: 0.5rem;">${prop.type.toLowerCase()}</td>
          <td style="padding: 0.5rem;"><code>${JSON.stringify(prop.defaultValue || getDefaultForType(prop.type))}</code></td>
          <td style="padding: 0.5rem;">${prop.description}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>Examples</h2>
    <div style="display: grid; gap: 2rem; margin-top: 1rem;">
      ${generateDocumentationExamples(componentName, properties)}
    </div>
  </div>
\`;`;
}

function getControlType(type, propName) {
  if (propName === 'variant' || propName === 'type' || propName === 'size') {
    return 'select';
  }

  switch (type) {
    case 'Boolean': return 'boolean';
    case 'Number': return 'number';
    case 'Array': return 'object';
    case 'Object': return 'object';
    case 'String':
    default: return 'text';
  }
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

function getExampleValue(prop) {
  if (prop.name === 'variant') return 'primary';
  if (prop.name === 'size') return 'md';
  if (prop.name === 'title') return 'Example Title';
  if (prop.name === 'label') return 'Example Label';
  
  switch (prop.type) {
    case 'Boolean': return 'true';
    case 'Number': return '42';
    case 'String':
    default: return 'example';
  }
}

function generateVariantStories(properties) {
  const variantProp = properties.find(p => p.name === 'variant');
  if (!variantProp) return '';

  return `
export const Variants = () => html\`
  <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
    \${['primary', 'secondary', 'success', 'warning', 'error'].map(variant => html\`
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <${variantProp.name === 'variant' ? 'neo-component' : 'div'} variant="\${variant}">\${variant}</${variantProp.name === 'variant' ? 'neo-component' : 'div'}>
        <small>\${variant}</small>
      </div>
    \`)}
  </div>
\`;`;
}

function generateStateStories(properties) {
  const hasDisabled = properties.some(p => p.name === 'disabled');
  const hasLoading = properties.some(p => p.name === 'loading');
  
  if (!hasDisabled && !hasLoading) return '';

  return `
export const States = () => html\`
  <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
      <neo-component>Normal</neo-component>
      <small>Normal</small>
    </div>
    ${hasDisabled ? `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
      <neo-component disabled>Disabled</neo-component>
      <small>Disabled</small>
    </div>` : ''}
    ${hasLoading ? `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
      <neo-component loading>Loading</neo-component>
      <small>Loading</small>
    </div>` : ''}
  </div>
\`;`;
}

function generateAllVariantsDemo(componentName, properties) {
  const hasVariant = properties.some(p => p.name === 'variant');
  const hasSize = properties.some(p => p.name === 'size');

  if (hasVariant && hasSize) {
    return `
    \${['sm', 'md', 'lg'].map(size => html\`
      <div style="margin-bottom: 1rem;">
        <h4>Size: \${size}</h4>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          \${['primary', 'secondary', 'success', 'warning', 'error'].map(variant => html\`
            <${componentName} variant="\${variant}" size="\${size}">\${variant} \${size}</${componentName}>
          \`)}
        </div>
      </div>
    \`)}`;
  } else if (hasVariant) {
    return `
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      \${['primary', 'secondary', 'success', 'warning', 'error'].map(variant => html\`
        <${componentName} variant="\${variant}">\${variant}</${componentName}>
      \`)}
    </div>`;
  } else {
    return `<${componentName}>Example component</${componentName}>`;
  }
}

function generateDocumentationExamples(componentName, properties) {
  const examples = [
    `
    <div>
      <h3>Basic Usage</h3>
      <${componentName}>Basic example</${componentName}>
    </div>`
  ];

  const hasVariant = properties.some(p => p.name === 'variant');
  if (hasVariant) {
    examples.push(`
    <div>
      <h3>With Variants</h3>
      <div style="display: flex; gap: 1rem;">
        <${componentName} variant="primary">Primary</${componentName}>
        <${componentName} variant="secondary">Secondary</${componentName}>
      </div>
    </div>`);
  }

  const hasDisabled = properties.some(p => p.name === 'disabled');
  if (hasDisabled) {
    examples.push(`
    <div>
      <h3>Disabled State</h3>
      <${componentName} disabled>Disabled</${componentName}>
    </div>`);
  }

  return examples.join('');
}