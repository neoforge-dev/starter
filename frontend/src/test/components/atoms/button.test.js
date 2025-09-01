import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// Import to register the component
import '../../../components/atoms/button/button.js';

describe('NeoButton Component', () => {
  let button;
  let container;

  beforeEach(async () => {
    // Create a container for the button
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create the button element
    button = document.createElement('neo-button');
    container.appendChild(button);

    // Wait for component to be fully rendered
    await button.updateComplete;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it('should render with default properties', async () => {
    expect(button.variant).toBe('primary');
    expect(button.size).toBe('md');
    expect(button.type).toBe('button');
    expect(button.disabled).toBe(false);
    expect(button.loading).toBe(false);
    expect(button.fullWidth).toBe(false);
  });

  it('should render button element in shadow root', async () => {
    const buttonElement = button.shadowRoot?.querySelector('button');
    expect(buttonElement).toBeTruthy();
    expect(buttonElement.type).toBe('button');
  });

  it('should handle variant changes', async () => {
    button.variant = 'secondary';
    await button.updateComplete;

    expect(button.variant).toBe('secondary');
    const buttonElement = button.shadowRoot?.querySelector('button');
    expect(buttonElement.className).toContain('variant-secondary');
  });

  it('should handle size changes', async () => {
    button.size = 'lg';
    await button.updateComplete;

    expect(button.size).toBe('lg');
    const buttonElement = button.shadowRoot?.querySelector('button');
    expect(buttonElement.className).toContain('size-lg');
  });

  it('should handle disabled state', async () => {
    button.disabled = true;
    await button.updateComplete;

    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');

    const buttonElement = button.shadowRoot?.querySelector('button');
    expect(buttonElement.disabled).toBe(true);
  });

  it('should handle loading state', async () => {
    button.loading = true;
    await button.updateComplete;

    expect(button.loading).toBe(true);
    const spinner = button.shadowRoot?.querySelector('.spinner');
    expect(spinner).toBeTruthy();

    const buttonElement = button.shadowRoot?.querySelector('button');
    expect(buttonElement.disabled).toBe(true);
  });

  it('should handle full width', async () => {
    button.fullWidth = true;
    await button.updateComplete;

    expect(button.fullWidth).toBe(true);
    expect(button.hasAttribute('fullWidth')).toBe(true);
  });

  it('should display label text', async () => {
    button.label = 'Test Button';
    await button.updateComplete;

    expect(button.label).toBe('Test Button');
    const buttonElement = button.shadowRoot?.querySelector('button');
    expect(buttonElement.textContent.trim()).toContain('Test Button');
  });

  it('should handle icon-only buttons with aria-label', async () => {
    button.iconOnly = true;
    button.label = 'Close Dialog';
    button.icon = '×';
    await button.updateComplete;

    expect(button.iconOnly).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Close Dialog');

    const iconSpan = button.shadowRoot?.querySelector('.icon');
    expect(iconSpan).toBeTruthy();
  });

  it('should dispatch click events', async () => {
    const clickSpy = vi.fn();
    button.addEventListener('click', clickSpy);

    const buttonElement = button.shadowRoot?.querySelector('button');
    buttonElement.click();

    // The button dispatches both the native click and custom click events
    // We verify that at least one click event was dispatched
    expect(clickSpy).toHaveBeenCalled();
    expect(clickSpy.mock.calls.length).toBeGreaterThan(0);
  });

  it('should prevent click when disabled', async () => {
    button.disabled = true;
    await button.updateComplete;

    const clickSpy = vi.fn();
    button.addEventListener('click', clickSpy);

    const buttonElement = button.shadowRoot?.querySelector('button');
    buttonElement.click();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should prevent click when loading', async () => {
    button.loading = true;
    await button.updateComplete;

    const clickSpy = vi.fn();
    button.addEventListener('click', clickSpy);

    const buttonElement = button.shadowRoot?.querySelector('button');
    buttonElement.click();

    expect(clickSpy).not.toHaveBeenCalled();
  });
});
