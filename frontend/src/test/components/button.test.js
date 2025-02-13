import { expect } from '@esm-bundle/chai';
import { fixture, html, oneEvent } from '@open-wc/testing';
import '../../components/atoms/button/button.js';

describe('NeoButton', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html\`<neo-button>Click me</neo-button>\`);
  });

  it('renders with default properties', () => {
    expect(element.variant).to.equal('primary');
    expect(element.size).to.equal('medium');
    expect(element.disabled).to.be.false;
    expect(element.loading).to.be.false;
  });

  it('reflects property changes', async () => {
    element.variant = 'secondary';
    element.size = 'small';
    element.disabled = true;
    element.loading = true;
    
    await element.updateComplete;
    
    expect(element.shadowRoot.querySelector('button')).to.have.class('variant-secondary');
    expect(element.shadowRoot.querySelector('button')).to.have.class('size-small');
    expect(element.shadowRoot.querySelector('button')).to.have.attribute('disabled');
    expect(element.shadowRoot.querySelector('neo-spinner')).to.exist;
  });

  it('dispatches click event when not disabled', async () => {
    const clickPromise = oneEvent(element, 'click');
    element.click();
    const event = await clickPromise;
    expect(event).to.exist;
  });

  it('does not dispatch click event when disabled', async () => {
    element.disabled = true;
    await element.updateComplete;
    
    let clicked = false;
    element.addEventListener('click', () => clicked = true);
    element.click();
    
    expect(clicked).to.be.false;
  });

  it('does not dispatch click event when loading', async () => {
    element.loading = true;
    await element.updateComplete;
    
    let clicked = false;
    element.addEventListener('click', () => clicked = true);
    element.click();
    
    expect(clicked).to.be.false;
  });

  it('handles keyboard interaction', async () => {
    const clickPromise = oneEvent(element, 'click');
    
    // Simulate Enter key
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await clickPromise;
    
    // Simulate Space key
    const spaceClickPromise = oneEvent(element, 'click');
    element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    await spaceClickPromise;
  });

  it('maintains focus state', async () => {
    element.focus();
    await element.updateComplete;
    
    expect(document.activeElement).to.equal(element);
    expect(element.shadowRoot.querySelector('button')).to.have.class('focused');
    
    element.blur();
    await element.updateComplete;
    
    expect(document.activeElement).to.not.equal(element);
    expect(element.shadowRoot.querySelector('button')).to.not.have.class('focused');
  });

  it('renders slotted content correctly', async () => {
    const buttonWithIcon = await fixture(html\`
      <neo-button>
        <neo-icon slot="prefix" name="star"></neo-icon>
        Click me
        <neo-icon slot="suffix" name="arrow-right"></neo-icon>
      </neo-button>
    \`);

    const slots = buttonWithIcon.shadowRoot.querySelectorAll('slot');
    expect(slots.length).to.equal(3); // prefix, default, suffix slots
    expect(slots[0].name).to.equal('prefix');
    expect(slots[1].name).to.equal('');
    expect(slots[2].name).to.equal('suffix');
  });

  it('handles loading state with spinner', async () => {
    element.loading = true;
    await element.updateComplete;

    const spinner = element.shadowRoot.querySelector('neo-spinner');
    expect(spinner).to.exist;
    expect(spinner.size).to.equal('small');
    expect(spinner.variant).to.equal('light');
    expect(element.getAttribute('aria-busy')).to.equal('true');
  });

  it('maintains proper ARIA attributes', async () => {
    // Test default state
    expect(element.getAttribute('role')).to.equal('button');
    expect(element.getAttribute('tabindex')).to.equal('0');

    // Test disabled state
    element.disabled = true;
    await element.updateComplete;
    expect(element.getAttribute('aria-disabled')).to.equal('true');
    expect(element.getAttribute('tabindex')).to.equal('-1');

    // Test loading state
    element.disabled = false;
    element.loading = true;
    await element.updateComplete;
    expect(element.getAttribute('aria-busy')).to.equal('true');
  });

  it('applies variant styles correctly', async () => {
    const variants = ['primary', 'secondary', 'text', 'icon'];
    
    for (const variant of variants) {
      element.variant = variant;
      await element.updateComplete;
      expect(element.shadowRoot.querySelector('button')).to.have.class(\`variant-\${variant}\`);
    }
  });

  it('applies size styles correctly', async () => {
    const sizes = ['small', 'medium', 'large'];
    
    for (const size of sizes) {
      element.size = size;
      await element.updateComplete;
      expect(element.shadowRoot.querySelector('button')).to.have.class(\`size-\${size}\`);
    }
  });

  it('handles form submission correctly', async () => {
    const form = await fixture(html\`
      <form>
        <neo-button type="submit">Submit</neo-button>
      </form>
    \`);

    const submitPromise = oneEvent(form, 'submit');
    form.querySelector('neo-button').click();
    const event = await submitPromise;
    expect(event).to.exist;
  });
}); 