/**
 * Test Template Generator
 * 
 * Generates comprehensive test files for new components
 */

export function generateTestTemplate(config) {
  const {
    componentName,
    className,
    category,
    description,
    properties = []
  } = config;

  const propertyTests = properties.map(prop => {
    return generatePropertyTest(prop, componentName);
  }).join('\n\n  ');

  return `import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { ${className} } from '../../components/${category}/${componentName}/${componentName}.js';

describe('${className}', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html\`<${componentName}></${componentName}>\`);
  });

  it('should create component instance', () => {
    expect(element).to.be.instanceOf(${className});
  });

  it('should render with default properties', () => {
    expect(element.shadowRoot).to.exist;
    expect(element.shadowRoot.querySelector('.container')).to.exist;
  });

  it('should have correct tag name', () => {
    expect(element.tagName.toLowerCase()).to.equal('${componentName}');
  });

  it('should be accessible', async () => {
    await expect(element).to.be.accessible();
  });

  ${propertyTests}

  describe('Events', () => {
    it('should dispatch custom events', async () => {
      let eventFired = false;
      element.addEventListener('${componentName}-change', () => {
        eventFired = true;
      });

      // Trigger interaction
      const interactiveElement = element.shadowRoot.querySelector('[data-testid="interactive"]');
      if (interactiveElement) {
        interactiveElement.click();
        expect(eventFired).to.be.true;
      }
    });
  });

  describe('Slots', () => {
    it('should render slotted content', async () => {
      const slottedElement = await fixture(html\`
        <${componentName}>
          <span>Slotted content</span>
        </${componentName}>
      \`);

      const slot = slottedElement.shadowRoot.querySelector('slot');
      if (slot) {
        const assignedNodes = slot.assignedNodes();
        expect(assignedNodes).to.have.length.greaterThan(0);
      }
    });
  });

  describe('Styling', () => {
    it('should have proper CSS custom properties', () => {
      const computedStyle = getComputedStyle(element);
      expect(computedStyle.getPropertyValue('display')).to.equal('inline-block');
    });

    it('should respond to CSS custom property changes', async () => {
      element.style.setProperty('--color-primary', 'rgb(255, 0, 0)');
      await element.updateComplete;
      // Add specific style assertions based on component
    });
  });

  describe('Integration', () => {
    it('should work in forms', async () => {
      const form = await fixture(html\`
        <form>
          <${componentName} name="test-field"></${componentName}>
        </form>
      \`);

      const formElement = form.querySelector('${componentName}');
      expect(formElement).to.exist;
    });

    it('should work with other components', async () => {
      const container = await fixture(html\`
        <div>
          <${componentName}></${componentName}>
          <${componentName}></${componentName}>
        </div>
      \`);

      const components = container.querySelectorAll('${componentName}');
      expect(components).to.have.length(2);
    });
  });

  describe('Performance', () => {
    it('should render quickly', async () => {
      const startTime = performance.now();
      await fixture(html\`<${componentName}></${componentName}>\`);
      const endTime = performance.now();
      
      // Should render in less than 100ms
      expect(endTime - startTime).to.be.lessThan(100);
    });

    it('should update efficiently', async () => {
      const startTime = performance.now();
      element.title = 'New title';
      await element.updateComplete;
      const endTime = performance.now();
      
      // Should update in less than 50ms
      expect(endTime - startTime).to.be.lessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid property values gracefully', async () => {
      element.setAttribute('invalid-attr', 'invalid-value');
      await element.updateComplete;
      
      // Component should still render
      expect(element.shadowRoot.querySelector('.container')).to.exist;
    });

    it('should handle missing required properties', async () => {
      // Test component behavior with missing required props
      expect(() => element.render()).to.not.throw();
    });
  });
});`;
}

function generatePropertyTest(prop, componentName) {
  const testValue = getTestValue(prop.type, prop.name);
  const expectedValue = typeof testValue === 'string' ? `'${testValue}'` : testValue;

  return `describe('Property: ${prop.name}', () => {
    it('should have default value', () => {
      expect(element.${prop.name}).to.equal(${JSON.stringify(prop.defaultValue || getDefaultForType(prop.type))});
    });

    it('should accept and reflect property changes', async () => {
      element.${prop.name} = ${expectedValue};
      await element.updateComplete;
      expect(element.${prop.name}).to.equal(${expectedValue});
      
      ${prop.reflect ? `expect(element.getAttribute('${prop.name}')).to.equal(String(${expectedValue}));` : '// Property does not reflect'}
    });

    it('should render correctly with property set', async () => {
      element.${prop.name} = ${expectedValue};
      await element.updateComplete;
      
      // Add specific rendering assertions based on property
      expect(element.shadowRoot).to.exist;
    });
  })`;
}

function getTestValue(type, propName) {
  if (propName === 'variant') return 'primary';
  if (propName === 'size') return 'lg';
  if (propName === 'title') return 'Test Title';
  if (propName === 'label') return 'Test Label';
  if (propName === 'text') return 'Test Text';
  
  switch (type) {
    case 'Boolean': return true;
    case 'Number': return 42;
    case 'Array': return ['test', 'array'];
    case 'Object': return { test: 'object' };
    case 'String':
    default: return 'test-value';
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