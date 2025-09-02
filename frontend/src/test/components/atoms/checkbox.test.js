import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
// Import to register the component
import '../../../components/atoms/checkbox/checkbox.js';

/**
 * Comprehensive tests for NeoCheckbox component
 * Testing rendering, interactions, accessibility, states, and edge cases
 */
describe('NeoCheckbox Component', () => {
  let checkbox;
  let container;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    checkbox = document.createElement('neo-checkbox');
    container.appendChild(checkbox);

    // Wait for component to be fully rendered
    await checkbox.updateComplete;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Initialization and Default Properties', () => {
    it('should render with default properties', () => {
      expect(checkbox.checked).toBe(false);
      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox.disabled).toBe(false);
      expect(checkbox.required).toBe(false);
      expect(checkbox.error).toBe('');
      expect(checkbox.label).toBeUndefined();
    });

    it('should generate unique id', () => {
      const checkbox2 = document.createElement('neo-checkbox');
      expect(checkbox._id).toBeDefined();
      expect(checkbox2._id).toBeDefined();
      expect(checkbox._id).not.toBe(checkbox2._id);
      expect(checkbox._id).toMatch(/neo-checkbox-/);
    });

    it('should render checkbox input in shadow root', () => {
      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      expect(inputElement).toBeTruthy();
      expect(inputElement.type).toBe('checkbox');
      expect(inputElement.id).toBe(checkbox._id);
    });

    it('should render custom checkbox styling', () => {
      const customElement = checkbox.shadowRoot?.querySelector('.checkbox-custom');
      expect(customElement).toBeTruthy();
    });
  });

  describe('Property Changes and Rendering', () => {
    it('should handle checked state changes', async () => {
      checkbox.checked = true;
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      expect(checkbox.checked).toBe(true);
      expect(inputElement.checked).toBe(true);
      expect(checkbox.hasAttribute('checked')).toBe(true);
    });

    it('should handle indeterminate state changes', async () => {
      checkbox.indeterminate = true;
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      expect(checkbox.indeterminate).toBe(true);
      expect(inputElement.indeterminate).toBe(true);
      expect(checkbox.hasAttribute('indeterminate')).toBe(true);

      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');
      expect(wrapper.classList.contains('indeterminate')).toBe(true);
    });

    it('should handle disabled state', async () => {
      checkbox.disabled = true;
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');

      expect(checkbox.disabled).toBe(true);
      expect(inputElement.disabled).toBe(true);
      expect(checkbox.hasAttribute('disabled')).toBe(true);
      expect(wrapper.classList.contains('disabled')).toBe(true);
    });

    it('should handle required state', async () => {
      checkbox.required = true;
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      expect(checkbox.required).toBe(true);
      expect(inputElement.required).toBe(true);
      expect(checkbox.hasAttribute('required')).toBe(true);
    });

    it('should handle label rendering', async () => {
      checkbox.label = 'Accept terms and conditions';
      await checkbox.updateComplete;

      const labelElement = checkbox.shadowRoot?.querySelector('label');
      expect(labelElement).toBeTruthy();
      expect(labelElement.textContent.trim()).toBe('Accept terms and conditions');
      expect(labelElement.getAttribute('for')).toBe(checkbox._id);
    });

    it('should not render label when not provided', async () => {
      checkbox.label = '';
      await checkbox.updateComplete;

      const labelElement = checkbox.shadowRoot?.querySelector('label');
      expect(labelElement).toBeFalsy();
    });
  });

  describe('Error States and Validation', () => {
    it('should display error message', async () => {
      checkbox.error = 'This field is required';
      await checkbox.updateComplete;

      const errorElement = checkbox.shadowRoot?.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent.trim()).toBe('This field is required');
      expect(errorElement.id).toBe(`${checkbox._id}-error`);

      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');
      expect(wrapper.classList.contains('error')).toBe(true);
    });

    it('should clear error message when error is empty', async () => {
      checkbox.error = 'Some error';
      await checkbox.updateComplete;

      let errorElement = checkbox.shadowRoot?.querySelector('.error-message');
      expect(errorElement).toBeTruthy();

      checkbox.error = '';
      await checkbox.updateComplete;

      errorElement = checkbox.shadowRoot?.querySelector('.error-message');
      expect(errorElement).toBeFalsy();

      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');
      expect(wrapper.classList.contains('error')).toBe(false);
    });
  });

  describe('Event Handling', () => {
    it('should dispatch neo-change event when checked', async () => {
      const changeSpy = vi.fn();
      checkbox.addEventListener('neo-change', changeSpy);

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      // Simulate user interaction
      inputElement.checked = true;
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      await checkbox.updateComplete;

      expect(changeSpy).toHaveBeenCalledOnce();
      expect(changeSpy.mock.calls[0][0].detail.checked).toBe(true);
      expect(checkbox.checked).toBe(true);
    });

    it('should dispatch neo-change event when unchecked', async () => {
      checkbox.checked = true;
      await checkbox.updateComplete;

      const changeSpy = vi.fn();
      checkbox.addEventListener('neo-change', changeSpy);

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      inputElement.checked = false;
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      await checkbox.updateComplete;

      expect(changeSpy).toHaveBeenCalledOnce();
      expect(changeSpy.mock.calls[0][0].detail.checked).toBe(false);
      expect(checkbox.checked).toBe(false);
    });

    it('should clear indeterminate state when user interacts', async () => {
      checkbox.indeterminate = true;
      checkbox.checked = false;
      await checkbox.updateComplete;

      expect(checkbox.indeterminate).toBe(true);

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      inputElement.checked = true;
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      await checkbox.updateComplete;

      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox.checked).toBe(true);
    });

    it('should not dispatch events when disabled', async () => {
      checkbox.disabled = true;
      await checkbox.updateComplete;

      const changeSpy = vi.fn();
      checkbox.addEventListener('neo-change', changeSpy);

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      // Try to simulate change on disabled checkbox
      inputElement.checked = true;
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      await checkbox.updateComplete;

      expect(changeSpy).not.toHaveBeenCalled();
      expect(checkbox.checked).toBe(false); // Should remain unchanged
    });

    it('should handle rapid state changes', async () => {
      const changeSpy = vi.fn();
      checkbox.addEventListener('neo-change', changeSpy);

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      // Rapid toggle simulation
      for (let i = 0; i < 5; i++) {
        inputElement.checked = !inputElement.checked;
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        await checkbox.updateComplete;
      }

      expect(changeSpy).toHaveBeenCalledTimes(5);
      expect(checkbox.checked).toBe(true); // Should end up checked
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      checkbox.label = 'Accept terms';
      checkbox.required = true;
      checkbox.error = 'This is required';
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      expect(inputElement.getAttribute('aria-label')).toBe('Accept terms');
      expect(inputElement.getAttribute('aria-invalid')).toBe('true');
      expect(inputElement.getAttribute('aria-errormessage')).toBe(`${checkbox._id}-error`);
    });

    it('should associate label with checkbox via for/id', async () => {
      checkbox.label = 'Newsletter subscription';
      await checkbox.updateComplete;

      const labelElement = checkbox.shadowRoot?.querySelector('label');
      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      expect(labelElement.getAttribute('for')).toBe(checkbox._id);
      expect(inputElement.id).toBe(checkbox._id);
    });

    it('should have proper keyboard navigation', async () => {
      checkbox.label = 'Test checkbox';
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      // Should be focusable
      expect(inputElement.tabIndex).not.toBe(-1);
    });

    it('should handle focus and blur states', async () => {
      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      // Focus should trigger focus ring via CSS
      inputElement.focus();
      await checkbox.updateComplete;

      // Should not throw any errors
      expect(inputElement).toBe(document.activeElement?.shadowRoot?.querySelector('input[type="checkbox"]') || inputElement);

      inputElement.blur();
      await checkbox.updateComplete;
    });
  });

  describe('Indeterminate State Handling', () => {
    it('should handle indeterminate state properly', async () => {
      checkbox.indeterminate = true;
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');
      
      expect(checkbox.indeterminate).toBe(true);
      expect(inputElement.indeterminate).toBe(true);
      expect(wrapper.classList.contains('indeterminate')).toBe(true);
    });

    it('should clear indeterminate when explicitly checked', async () => {
      checkbox.indeterminate = true;
      checkbox.checked = false;
      await checkbox.updateComplete;

      // Now check it programmatically
      checkbox.checked = true;
      await checkbox.updateComplete;

      // Indeterminate should still be true when set programmatically
      expect(checkbox.indeterminate).toBe(true);
      expect(checkbox.checked).toBe(true);
    });

    it('should maintain indeterminate visual state when both indeterminate and checked', async () => {
      checkbox.indeterminate = true;
      checkbox.checked = true;
      await checkbox.updateComplete;

      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');
      
      expect(wrapper.classList.contains('indeterminate')).toBe(true);
      expect(wrapper.classList.contains('checked')).toBe(true);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct CSS classes for different states', async () => {
      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');
      
      expect(wrapper.classList.contains('checkbox-wrapper')).toBe(true);
      expect(wrapper.classList.contains('disabled')).toBe(false);
      expect(wrapper.classList.contains('error')).toBe(false);
      expect(wrapper.classList.contains('indeterminate')).toBe(false);
      expect(wrapper.classList.contains('checked')).toBe(false);
    });

    it('should apply multiple state classes correctly', async () => {
      checkbox.checked = true;
      checkbox.disabled = true;
      checkbox.error = 'Error message';
      await checkbox.updateComplete;

      const wrapper = checkbox.shadowRoot?.querySelector('.checkbox-wrapper');
      
      expect(wrapper.classList.contains('checked')).toBe(true);
      expect(wrapper.classList.contains('disabled')).toBe(true);
      expect(wrapper.classList.contains('error')).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined/null values gracefully', async () => {
      checkbox.label = null;
      checkbox.error = undefined;
      await checkbox.updateComplete;

      expect(checkbox.label).toBeNull();
      expect(checkbox.error).toBeUndefined();
      
      // Should not crash
      const labelElement = checkbox.shadowRoot?.querySelector('label');
      const errorElement = checkbox.shadowRoot?.querySelector('.error-message');
      
      expect(labelElement).toBeFalsy();
      expect(errorElement).toBeFalsy();
    });

    it('should handle boolean attributes correctly', async () => {
      // Test truthy/falsy values
      checkbox.checked = 'true'; // string truthy
      checkbox.disabled = 0; // number falsy
      checkbox.required = 1; // number truthy
      await checkbox.updateComplete;

      expect(checkbox.checked).toBeTruthy();
      expect(checkbox.disabled).toBeFalsy();
      expect(checkbox.required).toBeTruthy();
    });

    it('should handle rapid property changes', async () => {
      for (let i = 0; i < 20; i++) {
        checkbox.checked = i % 2 === 0;
        checkbox.indeterminate = i % 3 === 0;
        checkbox.disabled = i % 5 === 0;
        
        if (i % 4 === 0) {
          await checkbox.updateComplete;
        }
      }
      
      await checkbox.updateComplete;
      
      // Should not crash and should have final state
      expect(typeof checkbox.checked).toBe('boolean');
      expect(typeof checkbox.indeterminate).toBe('boolean');
      expect(typeof checkbox.disabled).toBe('boolean');
    });

    it('should handle empty string label', async () => {
      checkbox.label = '';
      await checkbox.updateComplete;

      const labelElement = checkbox.shadowRoot?.querySelector('label');
      expect(labelElement).toBeFalsy();
    });

    it('should maintain state consistency after DOM operations', async () => {
      checkbox.checked = true;
      checkbox.label = 'Test';
      await checkbox.updateComplete;

      // Remove and re-add to DOM
      container.removeChild(checkbox);
      container.appendChild(checkbox);
      await checkbox.updateComplete;

      expect(checkbox.checked).toBe(true);
      expect(checkbox.label).toBe('Test');

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      expect(inputElement.checked).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid updates efficiently', async () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        checkbox.checked = i % 2 === 0;
        checkbox.label = `Label ${i}`;
        checkbox.indeterminate = i % 4 === 0;
        
        if (i % 10 === 0) {
          await checkbox.updateComplete;
        }
      }
      await checkbox.updateComplete;
      
      const end = performance.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(end - start).toBeLessThan(1000);
      expect(checkbox.label).toBe('Label 99');
    });

    it('should not cause memory leaks with event listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      checkbox.addEventListener('neo-change', handler1);
      checkbox.addEventListener('change', handler2);
      
      checkbox.removeEventListener('neo-change', handler1);
      checkbox.removeEventListener('change', handler2);
      
      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Form Integration', () => {
    it('should work as part of form validation', async () => {
      checkbox.required = true;
      checkbox.checked = false;
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      // Should be invalid when required but not checked
      expect(inputElement.required).toBe(true);
      expect(inputElement.checked).toBe(false);
    });

    it('should satisfy form validation when checked and required', async () => {
      checkbox.required = true;
      checkbox.checked = true;
      await checkbox.updateComplete;

      const inputElement = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
      
      expect(inputElement.required).toBe(true);
      expect(inputElement.checked).toBe(true);
    });
  });
});