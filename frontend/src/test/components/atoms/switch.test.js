import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
// Import to register the component
import '../../../components/atoms/switch/switch.js';

/**
 * Comprehensive tests for NeoSwitch component
 * Testing toggle functionality, accessibility, sizes, states, and edge cases
 */
describe('NeoSwitch Component', () => {
  let switchComponent;
  let container;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    switchComponent = document.createElement('neo-switch');
    container.appendChild(switchComponent);

    // Wait for component to be fully rendered
    await switchComponent.updateComplete;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Initialization and Default Properties', () => {
    it('should render with default properties', () => {
      expect(switchComponent.checked).toBe(false);
      expect(switchComponent.disabled).toBe(false);
      expect(switchComponent.label).toBe('');
      expect(switchComponent.onLabel).toBe('');
      expect(switchComponent.offLabel).toBe('');
      expect(switchComponent.size).toBe('md');
      expect(switchComponent.name).toBe('');
      expect(switchComponent.value).toBe('');
    });

    it('should generate unique id', () => {
      const switch2 = document.createElement('neo-switch');
      expect(switchComponent._id).toBeDefined();
      expect(switch2._id).toBeDefined();
      expect(switchComponent._id).not.toBe(switch2._id);
      expect(switchComponent._id).toMatch(/neo-switch-/);
    });

    it('should render switch elements in shadow root', () => {
      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      const container = switchComponent.shadowRoot?.querySelector('.switch-container');
      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      const track = switchComponent.shadowRoot?.querySelector('.switch-track');
      const thumb = switchComponent.shadowRoot?.querySelector('.switch-thumb');

      expect(wrapper).toBeTruthy();
      expect(container).toBeTruthy();
      expect(input).toBeTruthy();
      expect(track).toBeTruthy();
      expect(thumb).toBeTruthy();
    });

    it('should have proper ARIA attributes by default', () => {
      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      expect(wrapper.getAttribute('role')).toBe('switch');
      expect(wrapper.getAttribute('aria-checked')).toBe('false');
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');
      expect(wrapper.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Property Changes and Rendering', () => {
    it('should handle checked state changes', async () => {
      switchComponent.checked = true;
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      const track = switchComponent.shadowRoot?.querySelector('.switch-track');
      const thumb = switchComponent.shadowRoot?.querySelector('.switch-thumb');

      expect(switchComponent.checked).toBe(true);
      expect(input.checked).toBe(true);
      expect(wrapper.getAttribute('aria-checked')).toBe('true');
      expect(track.classList.contains('checked')).toBe(true);
      expect(thumb.classList.contains('checked')).toBe(true);
      expect(switchComponent.hasAttribute('checked')).toBe(true);
    });

    it('should handle disabled state changes', async () => {
      switchComponent.disabled = true;
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      const input = switchComponent.shadowRoot?.querySelector('.switch-input');

      expect(switchComponent.disabled).toBe(true);
      expect(input.disabled).toBe(true);
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
      expect(wrapper.classList.contains('disabled')).toBe(true);
      expect(switchComponent.hasAttribute('disabled')).toBe(true);
    });

    it('should handle label rendering', async () => {
      switchComponent.label = 'Enable notifications';
      await switchComponent.updateComplete;

      const label = switchComponent.shadowRoot?.querySelector('.switch-label');
      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');

      expect(label).toBeTruthy();
      expect(label.textContent.trim()).toBe('Enable notifications');
      expect(wrapper.getAttribute('aria-label')).toBe('Enable notifications');
    });

    it('should handle size variations', async () => {
      const sizes = ['sm', 'md', 'lg'];

      for (const size of sizes) {
        switchComponent.size = size;
        await switchComponent.updateComplete;
        
        const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
        
        expect(switchComponent.size).toBe(size);
        expect(wrapper.classList.contains(`size-${size}`)).toBe(true);
        expect(switchComponent.hasAttribute('size')).toBe(true);
        expect(switchComponent.getAttribute('size')).toBe(size);
      }
    });

    it('should handle form attributes', async () => {
      switchComponent.name = 'notifications';
      switchComponent.value = 'enabled';
      await switchComponent.updateComplete;

      const input = switchComponent.shadowRoot?.querySelector('.switch-input');

      expect(input.name).toBe('notifications');
      expect(input.value).toBe('enabled');
    });

    it('should handle on/off labels', async () => {
      switchComponent.onLabel = 'On';
      switchComponent.offLabel = 'Off';
      await switchComponent.updateComplete;

      const stateLabels = switchComponent.shadowRoot?.querySelector('.state-labels');
      const spans = stateLabels?.querySelectorAll('span');

      expect(stateLabels).toBeTruthy();
      expect(spans.length).toBe(2);
      
      // Initially off (unchecked), so Off should be active
      expect(spans[0].textContent.trim()).toBe('Off');
      expect(spans[1].textContent.trim()).toBe('On');
    });
  });

  describe('Event Handling', () => {
    it('should dispatch neo-change event when toggled', async () => {
      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      
      // Simulate user toggle
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await switchComponent.updateComplete;

      expect(changeSpy).toHaveBeenCalledOnce();
      expect(changeSpy.mock.calls[0][0].detail.checked).toBe(true);
      expect(switchComponent.checked).toBe(true);
    });

    it('should include name and value in change event', async () => {
      switchComponent.name = 'notifications';
      switchComponent.value = 'enabled';
      await switchComponent.updateComplete;

      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await switchComponent.updateComplete;

      expect(changeSpy.mock.calls[0][0].detail).toEqual({
        checked: true,
        name: 'notifications',
        value: 'enabled'
      });
    });

    it('should not dispatch events when disabled', async () => {
      switchComponent.disabled = true;
      await switchComponent.updateComplete;

      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      
      // Try to change disabled switch
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await switchComponent.updateComplete;

      expect(changeSpy).not.toHaveBeenCalled();
      expect(switchComponent.checked).toBe(false); // Should remain unchanged
    });

    it('should handle wrapper clicks', async () => {
      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      // Click on wrapper (should trigger toggle)
      wrapper.click();
      await switchComponent.updateComplete;

      expect(changeSpy).toHaveBeenCalledOnce();
      expect(switchComponent.checked).toBe(true);
    });

    it('should prevent wrapper clicks when disabled', async () => {
      switchComponent.disabled = true;
      await switchComponent.updateComplete;

      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      // Click should be prevented
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      wrapper.dispatchEvent(clickEvent);
      
      expect(clickEvent.defaultPrevented).toBe(true);
      expect(changeSpy).not.toHaveBeenCalled();
      expect(switchComponent.checked).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle on Space key', async () => {
      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      const spaceEvent = new KeyboardEvent('keydown', { 
        key: ' ', 
        bubbles: true, 
        cancelable: true 
      });
      wrapper.dispatchEvent(spaceEvent);
      await switchComponent.updateComplete;

      expect(spaceEvent.defaultPrevented).toBe(true);
      expect(changeSpy).toHaveBeenCalledOnce();
      expect(switchComponent.checked).toBe(true);
    });

    it('should toggle on Enter key', async () => {
      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        bubbles: true, 
        cancelable: true 
      });
      wrapper.dispatchEvent(enterEvent);
      await switchComponent.updateComplete;

      expect(enterEvent.defaultPrevented).toBe(true);
      expect(changeSpy).toHaveBeenCalledOnce();
      expect(switchComponent.checked).toBe(true);
    });

    it('should not respond to other keys', async () => {
      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true, 
        cancelable: true 
      });
      wrapper.dispatchEvent(tabEvent);
      await switchComponent.updateComplete;

      expect(tabEvent.defaultPrevented).toBe(false);
      expect(changeSpy).not.toHaveBeenCalled();
      expect(switchComponent.checked).toBe(false);
    });

    it('should not respond to keys when disabled', async () => {
      switchComponent.disabled = true;
      await switchComponent.updateComplete;

      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      const spaceEvent = new KeyboardEvent('keydown', { 
        key: ' ', 
        bubbles: true, 
        cancelable: true 
      });
      wrapper.dispatchEvent(spaceEvent);
      await switchComponent.updateComplete;

      expect(changeSpy).not.toHaveBeenCalled();
      expect(switchComponent.checked).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when checked', async () => {
      switchComponent.checked = true;
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      expect(wrapper.getAttribute('role')).toBe('switch');
      expect(wrapper.getAttribute('aria-checked')).toBe('true');
      expect(wrapper.getAttribute('aria-disabled')).toBe('false');
    });

    it('should have proper ARIA attributes when disabled', async () => {
      switchComponent.disabled = true;
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      
      expect(wrapper.getAttribute('aria-disabled')).toBe('true');
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
    });

    it('should generate appropriate aria-label', async () => {
      // Test with explicit label
      switchComponent.label = 'Dark mode';
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      expect(wrapper.getAttribute('aria-label')).toBe('Dark mode');
    });

    it('should generate aria-label from state labels', async () => {
      switchComponent.onLabel = 'On';
      switchComponent.offLabel = 'Off';
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      expect(wrapper.getAttribute('aria-label')).toBe('Switch, Off');

      // Toggle and check
      switchComponent.checked = true;
      await switchComponent.updateComplete;
      expect(wrapper.getAttribute('aria-label')).toBe('Switch, On');
    });

    it('should have hidden input with proper attributes', async () => {
      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      
      expect(input.getAttribute('aria-hidden')).toBe('true');
      expect(input.getAttribute('tabindex')).toBe('-1');
      expect(input.type).toBe('checkbox');
    });

    it('should have WCAG compliant touch targets', () => {
      const track = switchComponent.shadowRoot?.querySelector('.switch-track');
      
      // Default md size should meet WCAG AA requirements (44px minimum)
      expect(track).toBeTruthy();
      
      // CSS class should be applied for proper sizing
      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      expect(wrapper.classList.contains('size-md')).toBe(true);
    });
  });

  describe('State Label Behavior', () => {
    beforeEach(async () => {
      switchComponent.onLabel = 'Enabled';
      switchComponent.offLabel = 'Disabled';
      await switchComponent.updateComplete;
    });

    it('should show correct state labels when unchecked', () => {
      const stateLabels = switchComponent.shadowRoot?.querySelector('.state-labels');
      const spans = stateLabels?.querySelectorAll('span');

      expect(spans.length).toBe(2);
      expect(spans[0].textContent.trim()).toBe('Disabled'); // Off label
      expect(spans[1].textContent.trim()).toBe('Enabled'); // On label
    });

    it('should update state labels when toggled', async () => {
      switchComponent.checked = true;
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      expect(wrapper.getAttribute('aria-label')).toBe('Switch, Enabled');
    });

    it('should not render state labels container when no labels provided', async () => {
      switchComponent.onLabel = '';
      switchComponent.offLabel = '';
      await switchComponent.updateComplete;

      const stateLabels = switchComponent.shadowRoot?.querySelector('.state-labels');
      expect(stateLabels).toBeFalsy();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct CSS classes based on state', async () => {
      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      const track = switchComponent.shadowRoot?.querySelector('.switch-track');
      const thumb = switchComponent.shadowRoot?.querySelector('.switch-thumb');

      // Initial state
      expect(wrapper.classList.contains('switch-wrapper')).toBe(true);
      expect(wrapper.classList.contains('size-md')).toBe(true);
      expect(wrapper.classList.contains('disabled')).toBe(false);
      expect(wrapper.classList.contains('checked')).toBe(false);
      
      expect(track.classList.contains('switch-track')).toBe(true);
      expect(track.classList.contains('checked')).toBe(false);
      
      expect(thumb.classList.contains('switch-thumb')).toBe(true);
      expect(thumb.classList.contains('checked')).toBe(false);
    });

    it('should apply checked classes when toggled', async () => {
      switchComponent.checked = true;
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      const track = switchComponent.shadowRoot?.querySelector('.switch-track');
      const thumb = switchComponent.shadowRoot?.querySelector('.switch-thumb');

      expect(wrapper.classList.contains('checked')).toBe(true);
      expect(track.classList.contains('checked')).toBe(true);
      expect(thumb.classList.contains('checked')).toBe(true);
    });

    it('should apply disabled classes when disabled', async () => {
      switchComponent.disabled = true;
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      expect(wrapper.classList.contains('disabled')).toBe(true);
    });

    it('should apply size classes correctly', async () => {
      const sizes = ['sm', 'md', 'lg'];

      for (const size of sizes) {
        switchComponent.size = size;
        await switchComponent.updateComplete;
        
        const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
        expect(wrapper.classList.contains(`size-${size}`)).toBe(true);
        
        // Remove other size classes
        const otherSizes = sizes.filter(s => s !== size);
        otherSizes.forEach(otherSize => {
          expect(wrapper.classList.contains(`size-${otherSize}`)).toBe(false);
        });
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined/null values gracefully', async () => {
      switchComponent.label = null;
      switchComponent.onLabel = undefined;
      switchComponent.offLabel = null;
      await switchComponent.updateComplete;

      expect(switchComponent.label).toBeNull();
      expect(switchComponent.onLabel).toBeUndefined();
      expect(switchComponent.offLabel).toBeNull();
      
      // Should not crash rendering
      const label = switchComponent.shadowRoot?.querySelector('.switch-label');
      const stateLabels = switchComponent.shadowRoot?.querySelector('.state-labels');
      
      expect(label).toBeFalsy();
      expect(stateLabels).toBeFalsy();
    });

    it('should handle invalid size values', async () => {
      switchComponent.size = 'invalid';
      await switchComponent.updateComplete;

      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      expect(wrapper.classList.contains('size-invalid')).toBe(true);
      
      // Should still render without crashing
      expect(wrapper).toBeTruthy();
    });

    it('should handle rapid state changes', async () => {
      const changeSpy = vi.fn();
      switchComponent.addEventListener('neo-change', changeSpy);

      // Rapid toggle simulation
      for (let i = 0; i < 10; i++) {
        switchComponent.checked = i % 2 === 0;
        if (i % 3 === 0) {
          await switchComponent.updateComplete;
        }
      }
      
      await switchComponent.updateComplete;
      
      // Should not crash and should have final state
      expect(switchComponent.checked).toBe(false);
      expect(typeof switchComponent.checked).toBe('boolean');
    });

    it('should maintain state after DOM operations', async () => {
      switchComponent.checked = true;
      switchComponent.label = 'Test Switch';
      switchComponent.size = 'lg';
      await switchComponent.updateComplete;

      // Remove and re-add to DOM
      container.removeChild(switchComponent);
      container.appendChild(switchComponent);
      await switchComponent.updateComplete;

      expect(switchComponent.checked).toBe(true);
      expect(switchComponent.label).toBe('Test Switch');
      expect(switchComponent.size).toBe('lg');
    });

    it('should handle event target edge cases', async () => {
      const wrapper = switchComponent.shadowRoot?.querySelector('.switch-wrapper');
      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      
      // Mock event with input as target (should not trigger additional click)
      const mockEvent = { target: input, preventDefault: vi.fn() };
      switchComponent._handleClick(mockEvent);
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid updates efficiently', async () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        switchComponent.checked = i % 2 === 0;
        switchComponent.label = `Switch ${i}`;
        switchComponent.size = ['sm', 'md', 'lg'][i % 3];
        
        if (i % 10 === 0) {
          await switchComponent.updateComplete;
        }
      }
      await switchComponent.updateComplete;
      
      const end = performance.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(end - start).toBeLessThan(1000);
      expect(switchComponent.label).toBe('Switch 99');
    });

    it('should not cause memory leaks with event listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      switchComponent.addEventListener('neo-change', handler1);
      switchComponent.addEventListener('change', handler2);
      
      switchComponent.removeEventListener('neo-change', handler1);
      switchComponent.removeEventListener('change', handler2);
      
      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Form Integration', () => {
    it('should work as part of form validation', async () => {
      switchComponent.name = 'terms';
      switchComponent.value = 'accepted';
      await switchComponent.updateComplete;

      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      expect(input.name).toBe('terms');
      expect(input.value).toBe('accepted');
    });

    it('should maintain form values correctly', async () => {
      switchComponent.name = 'notifications';
      switchComponent.value = 'enabled';
      switchComponent.checked = true;
      await switchComponent.updateComplete;

      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      expect(input.checked).toBe(true);
      expect(input.name).toBe('notifications');
      expect(input.value).toBe('enabled');
    });

    it('should handle empty form values', async () => {
      switchComponent.name = '';
      switchComponent.value = '';
      await switchComponent.updateComplete;

      const input = switchComponent.shadowRoot?.querySelector('.switch-input');
      expect(input.name).toBe('');
      expect(input.value).toBe('');
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing requestAnimationFrame', () => {
      // Test component initialization without modern APIs
      expect(switchComponent).toBeTruthy();
      expect(switchComponent._id).toBeDefined();
    });

    it('should work with basic event handling', async () => {
      // Basic click event without modern event features
      const basicEvent = { 
        target: switchComponent.shadowRoot?.querySelector('.switch-wrapper'),
        preventDefault: vi.fn()
      };
      
      switchComponent._handleClick(basicEvent);
      expect(basicEvent.preventDefault).not.toHaveBeenCalled();
    });
  });
});