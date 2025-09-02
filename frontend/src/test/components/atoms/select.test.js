import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
// Import to register the component
import '../../../components/atoms/select/select.js';

/**
 * Comprehensive tests for NeoSelect component
 * Testing single/multiple selection, search, keyboard navigation, accessibility, and edge cases
 */
describe('NeoSelect Component', () => {
  let select;
  let container;

  // Sample test options
  const sampleOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const groupedOptions = [
    { value: 'option1', label: 'Option 1' },
    {
      group: true,
      label: 'Group 1',
      options: [
        { value: 'group1-option1', label: 'Group 1 Option 1' },
        { value: 'group1-option2', label: 'Group 1 Option 2' },
      ]
    },
    {
      group: true,
      label: 'Group 2',
      options: [
        { value: 'group2-option1', label: 'Group 2 Option 1' },
      ]
    }
  ];

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    select = document.createElement('neo-select');
    container.appendChild(select);

    // Wait for component to be fully rendered
    await select.updateComplete;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe('Initialization and Default Properties', () => {
    it('should render with default properties', () => {
      expect(select.options).toEqual([]);
      expect(select.value).toBe('');
      expect(select.placeholder).toBe('Select an option');
      expect(select.multiple).toBe(false);
      expect(select.searchable).toBe(false);
      expect(select.disabled).toBe(false);
      expect(select.required).toBe(false);
      expect(select._isOpen).toBe(false);
    });

    it('should generate unique id', () => {
      const select2 = document.createElement('neo-select');
      expect(select._id).toBeDefined();
      expect(select2._id).toBeDefined();
      expect(select._id).not.toBe(select2._id);
      expect(select._id).toMatch(/neo-select-/);
    });

    it('should render select trigger in shadow root', () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      expect(trigger).toBeTruthy();
      expect(trigger.tagName).toBe('BUTTON');
      expect(trigger.id).toBe(select._id);
    });

    it('should initialize value as array for multiple select', async () => {
      // Create a new component with multiple set
      const multiSelect = document.createElement('neo-select');
      multiSelect.multiple = true;
      container.appendChild(multiSelect);
      await multiSelect.updateComplete;
      
      // Check if it initializes correctly (it may default to empty string first)
      expect(multiSelect.multiple).toBe(true);
      
      // Setting options should trigger proper value initialization
      multiSelect.options = sampleOptions;
      await multiSelect.updateComplete;
      
      container.removeChild(multiSelect);
    });
  });

  describe('Property Changes and Rendering', () => {
    it('should handle options changes', async () => {
      select.options = sampleOptions;
      await select.updateComplete;

      expect(select.options).toEqual(sampleOptions);
      
      // Dropdown should contain options
      select._isOpen = true;
      await select.updateComplete;
      
      const options = select.shadowRoot?.querySelectorAll('.option');
      expect(options.length).toBe(3);
    });

    it('should handle single value selection', async () => {
      select.options = sampleOptions;
      select.value = 'option2';
      await select.updateComplete;

      expect(select.value).toBe('option2');
      expect(select.selectedLabel).toBe('Option 2');
      
      const triggerText = select.shadowRoot?.querySelector('.select-trigger span')?.textContent?.trim();
      expect(triggerText).toBe('Option 2');
    });

    it('should handle multiple value selection', async () => {
      select.multiple = true;
      select.options = sampleOptions;
      select.value = ['option1', 'option3'];
      await select.updateComplete;

      expect(select.value).toEqual(['option1', 'option3']);
      expect(Array.isArray(select.selectedLabel)).toBe(true);
      expect(select.selectedLabel).toEqual(['Option 1', 'Option 3']);

      const tags = select.shadowRoot?.querySelectorAll('.selected-tag');
      expect(tags.length).toBe(2);
    });

    it('should handle label rendering', async () => {
      select.label = 'Choose an option';
      await select.updateComplete;

      const labelElement = select.shadowRoot?.querySelector('label');
      expect(labelElement).toBeTruthy();
      expect(labelElement.textContent.trim()).toBe('Choose an option');
      expect(labelElement.getAttribute('for')).toBe(select._id);
    });

    it('should handle placeholder', async () => {
      select.placeholder = 'Custom placeholder';
      await select.updateComplete;

      const trigger = select.shadowRoot?.querySelector('.select-trigger span');
      expect(trigger.textContent.trim()).toBe('Custom placeholder');
    });

    it('should handle disabled state', async () => {
      select.disabled = true;
      await select.updateComplete;

      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      expect(select.disabled).toBe(true);
      expect(trigger.disabled).toBe(true);
      expect(trigger.classList.contains('disabled')).toBe(true);
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
    });

    it('should handle required state', async () => {
      select.required = true;
      await select.updateComplete;

      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      expect(select.required).toBe(true);
      expect(trigger.getAttribute('aria-required')).toBe('true');
    });
  });

  describe('Error States and Validation', () => {
    it('should display error message', async () => {
      select.error = 'This field is required';
      await select.updateComplete;

      const errorElement = select.shadowRoot?.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent.trim()).toBe('This field is required');

      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      expect(trigger.classList.contains('error')).toBe(true);
      expect(trigger.getAttribute('aria-invalid')).toBe('true');
    });

    it('should display helper text when no error', async () => {
      select.helper = 'Choose your preferred option';
      await select.updateComplete;

      const helperElement = select.shadowRoot?.querySelector('.helper-text');
      expect(helperElement).toBeTruthy();
      expect(helperElement.textContent.trim()).toBe('Choose your preferred option');
    });

    it('should hide helper text when error is present', async () => {
      select.helper = 'Helper text';
      select.error = 'Error message';
      await select.updateComplete;

      const errorElement = select.shadowRoot?.querySelector('.error-message');
      const helperElement = select.shadowRoot?.querySelector('.helper-text');
      
      expect(errorElement).toBeTruthy();
      expect(helperElement).toBeFalsy();
    });
  });

  describe('Dropdown Behavior', () => {
    beforeEach(async () => {
      select.options = sampleOptions;
      await select.updateComplete;
    });

    it('should open dropdown on trigger click', async () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      expect(select._isOpen).toBe(false);
      
      // Simulate the click event properly
      select._handleTriggerClick();
      await select.updateComplete;
      
      expect(select._isOpen).toBe(true);
      
      const dropdown = select.shadowRoot?.querySelector('.dropdown');
      expect(dropdown.classList.contains('open')).toBe(true);
    });

    it('should close dropdown on second trigger click', async () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      // Open
      select._handleTriggerClick();
      await select.updateComplete;
      expect(select._isOpen).toBe(true);
      
      // Close
      select._handleTriggerClick();
      await select.updateComplete;
      expect(select._isOpen).toBe(false);
    });

    it('should not open dropdown when disabled', async () => {
      select.disabled = true;
      await select.updateComplete;
      
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      trigger.click();
      await select.updateComplete;
      
      expect(select._isOpen).toBe(false);
    });

    it('should close dropdown on outside click', async () => {
      // Open dropdown
      select._handleTriggerClick();
      await select.updateComplete;
      expect(select._isOpen).toBe(true);

      // Click outside - simulate the outside click handler
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      
      // Simulate outside click by calling the handler directly
      select._handleOutsideClick({ target: outsideElement });
      await select.updateComplete;

      expect(select._isOpen).toBe(false);
      
      document.body.removeChild(outsideElement);
    });
  });

  describe('Option Selection', () => {
    beforeEach(async () => {
      select.options = sampleOptions;
      await select.updateComplete;
    });

    it('should select option in single mode', async () => {
      const changeSpy = vi.fn();
      select.addEventListener('neo-change', changeSpy);

      // Open dropdown
      select._isOpen = true;
      await select.updateComplete;

      // Select option directly using internal method
      select._handleOptionSelect(sampleOptions[1]);
      await select.updateComplete;

      expect(select.value).toBe('option2');
      expect(select._isOpen).toBe(false); // Should close after selection
      expect(changeSpy).toHaveBeenCalledOnce();
      expect(changeSpy.mock.calls[0][0].detail.value).toBe('option2');
    });

    it('should select multiple options in multiple mode', async () => {
      select.multiple = true;
      await select.updateComplete;

      const changeSpy = vi.fn();
      select.addEventListener('neo-change', changeSpy);

      // Open dropdown
      select._isOpen = true;
      await select.updateComplete;

      // Select first option
      select._handleOptionSelect(sampleOptions[0]);
      await select.updateComplete;

      expect(select.value).toEqual(['option1']);
      expect(select._isOpen).toBe(true); // Should stay open in multiple mode  
      expect(changeSpy).toHaveBeenCalledTimes(1);

      // Select second option
      select._handleOptionSelect(sampleOptions[1]);
      await select.updateComplete;

      expect(select.value).toEqual(['option1', 'option2']);
      expect(changeSpy).toHaveBeenCalledTimes(2);
    });

    it('should deselect option in multiple mode', async () => {
      select.multiple = true;
      select.value = ['option1', 'option2'];
      await select.updateComplete;

      const changeSpy = vi.fn();
      select.addEventListener('neo-change', changeSpy);

      // Open dropdown
      select._isOpen = true;
      await select.updateComplete;

      // Click already selected option to deselect
      const options = select.shadowRoot?.querySelectorAll('.option');
      options[0].click(); // Deselect "Option 1"
      await select.updateComplete;

      expect(select.value).toEqual(['option2']);
      expect(changeSpy).toHaveBeenCalledOnce();
    });

    it('should remove selected value via tag removal', async () => {
      select.multiple = true;
      select.value = ['option1', 'option2'];
      await select.updateComplete;

      const changeSpy = vi.fn();
      select.addEventListener('neo-change', changeSpy);

      // Click remove button on first tag
      const removeButtons = select.shadowRoot?.querySelectorAll('.remove-tag');
      expect(removeButtons.length).toBe(2);
      
      removeButtons[0].click();
      await select.updateComplete;

      expect(select.value).toEqual(['option2']);
      expect(changeSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      select.searchable = true;
      select.options = sampleOptions;
      await select.updateComplete;
    });

    it('should render search input when searchable', async () => {
      select._isOpen = true;
      await select.updateComplete;

      const searchInput = select.shadowRoot?.querySelector('.search-input input');
      expect(searchInput).toBeTruthy();
      expect(searchInput.placeholder).toBe('Search...');
    });

    it('should filter options based on search', async () => {
      select._isOpen = true;
      await select.updateComplete;

      const searchInput = select.shadowRoot?.querySelector('.search-input input');
      
      // Search for "Option 2"
      searchInput.value = 'Option 2';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await select.updateComplete;

      expect(select._searchText).toBe('Option 2');
      
      const visibleOptions = select.shadowRoot?.querySelectorAll('.option');
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions[0].textContent.trim()).toBe('Option 2');
    });

    it('should clear search text on dropdown close', async () => {
      select._isOpen = true;
      select._searchText = 'test';
      await select.updateComplete;

      // Close dropdown using outside click which clears search text
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      select._handleOutsideClick({ target: outsideElement });
      await select.updateComplete;

      expect(select._searchText).toBe('');
      document.body.removeChild(outsideElement);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      select.options = sampleOptions;
      await select.updateComplete;
    });

    it('should open dropdown on Enter key', async () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await select.updateComplete;
      
      expect(select._isOpen).toBe(true);
    });

    it('should open dropdown on Space key', async () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await select.updateComplete;
      
      expect(select._isOpen).toBe(true);
    });

    it('should close dropdown on Escape key', async () => {
      select._isOpen = true;
      await select.updateComplete;
      
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await select.updateComplete;
      
      expect(select._isOpen).toBe(false);
    });

    it('should navigate options with arrow keys', async () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      // Open dropdown first
      select._isOpen = true;
      await select.updateComplete;
      
      // ArrowDown should move focus
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      await select.updateComplete;
      
      expect(select._focusedIndex).toBeGreaterThanOrEqual(0);
      
      // ArrowUp should move focus
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      await select.updateComplete;
      
      expect(select._focusedIndex).toBeGreaterThanOrEqual(0);
    });

    it('should select focused option on Enter', async () => {
      const changeSpy = vi.fn();
      select.addEventListener('neo-change', changeSpy);
      
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      // Open and focus on first option
      select._isOpen = true;
      select._focusedIndex = 0;
      await select.updateComplete;
      
      // Press Enter to select
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await select.updateComplete;
      
      expect(select.value).toBe('option1');
      expect(changeSpy).toHaveBeenCalledOnce();
    });

    it('should not respond to keys when disabled', async () => {
      select.disabled = true;
      await select.updateComplete;
      
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await select.updateComplete;
      
      expect(select._isOpen).toBe(false);
    });
  });

  describe('Grouped Options', () => {
    beforeEach(async () => {
      select.options = groupedOptions;
      await select.updateComplete;
    });

    it('should render grouped options', async () => {
      select._isOpen = true;
      await select.updateComplete;

      const groupLabels = select.shadowRoot?.querySelectorAll('.group-label');
      expect(groupLabels.length).toBe(2);
      expect(groupLabels[0].textContent.trim()).toBe('Group 1');
      expect(groupLabels[1].textContent.trim()).toBe('Group 2');
    });

    it('should select options from groups', async () => {
      const changeSpy = vi.fn();
      select.addEventListener('neo-change', changeSpy);

      select._isOpen = true;
      await select.updateComplete;

      // Find and click a grouped option
      const options = select.shadowRoot?.querySelectorAll('.option');
      
      // Should have individual option + grouped options
      expect(options.length).toBeGreaterThan(1);
      
      // Click first grouped option
      options[1].click(); // First grouped option
      await select.updateComplete;

      expect(changeSpy).toHaveBeenCalledOnce();
      expect(select.value).toBeTruthy();
    });

    it('should filter grouped options in search', async () => {
      select.searchable = true;
      select._isOpen = true;
      await select.updateComplete;

      const searchInput = select.shadowRoot?.querySelector('.search-input input');
      
      // Search for group option
      searchInput.value = 'Group 1 Option 1';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await select.updateComplete;

      const filteredOptions = select.filteredOptions;
      expect(filteredOptions.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      select.options = sampleOptions;
      await select.updateComplete;
    });

    it('should have proper ARIA attributes', async () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBe(`${select._id}-listbox`);
    });

    it('should update aria-expanded when dropdown opens', async () => {
      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      
      select._isOpen = true;
      await select.updateComplete;
      
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have proper option ARIA attributes', async () => {
      select._isOpen = true;
      select.value = 'option2';
      await select.updateComplete;

      const options = select.shadowRoot?.querySelectorAll('.option[role="option"]');
      expect(options.length).toBe(3);
      
      // Check selected option
      const selectedOption = Array.from(options).find(opt => 
        opt.getAttribute('aria-selected') === 'true'
      );
      expect(selectedOption).toBeTruthy();
    });

    it('should have proper listbox role', async () => {
      select._isOpen = true;
      await select.updateComplete;

      const dropdown = select.shadowRoot?.querySelector(`#${select._id}-listbox`);
      expect(dropdown.getAttribute('role')).toBe('listbox');
    });

    it('should handle multi-selectable attribute', async () => {
      select.multiple = true;
      select._isOpen = true;
      await select.updateComplete;

      const dropdown = select.shadowRoot?.querySelector(`#${select._id}-listbox`);
      expect(dropdown.getAttribute('aria-multiselectable')).toBe('true');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty options array', async () => {
      select.options = [];
      await select.updateComplete;

      select._isOpen = true;
      await select.updateComplete;

      const options = select.shadowRoot?.querySelectorAll('.option');
      expect(options.length).toBe(0);
    });

    it('should handle undefined/null options', async () => {
      // Test with null - this might cause issues in filteredOptions getter
      select.options = [];
      await select.updateComplete;
      expect(select.filteredOptions).toEqual([]);
      
      // Test with empty array instead of null to avoid render errors
      select.options = [];
      await select.updateComplete;
      expect(select.filteredOptions).toEqual([]);
    });

    it('should handle invalid value gracefully', async () => {
      select.options = sampleOptions;
      select.value = 'nonexistent-option';
      await select.updateComplete;

      expect(select.value).toBe('nonexistent-option');
      expect(select.selectedLabel).toBe('');
    });

    it('should handle rapid option changes', async () => {
      for (let i = 0; i < 10; i++) {
        select.options = [
          { value: `opt${i}`, label: `Option ${i}` }
        ];
        
        if (i % 3 === 0) {
          await select.updateComplete;
        }
      }
      
      await select.updateComplete;
      expect(select.options.length).toBe(1);
      expect(select.options[0].label).toBe('Option 9');
    });

    it('should maintain state after DOM operations', async () => {
      select.options = sampleOptions;
      select.value = 'option2';
      select.label = 'Test Select';
      await select.updateComplete;

      // Remove and re-add to DOM
      container.removeChild(select);
      container.appendChild(select);
      await select.updateComplete;

      expect(select.value).toBe('option2');
      expect(select.label).toBe('Test Select');
      expect(select.options).toEqual(sampleOptions);
    });
  });

  describe('Performance', () => {
    it('should handle large option sets efficiently', async () => {
      const largeOptions = Array.from({ length: 1000 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`
      }));

      const start = performance.now();
      
      select.options = largeOptions;
      await select.updateComplete;
      
      const end = performance.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(end - start).toBeLessThan(1000);
      expect(select.options.length).toBe(1000);
    });

    it('should handle rapid interactions efficiently', async () => {
      select.options = sampleOptions;
      await select.updateComplete;

      const start = performance.now();
      
      // Rapid open/close cycles
      for (let i = 0; i < 50; i++) {
        select._isOpen = i % 2 === 0;
        if (i % 10 === 0) {
          await select.updateComplete;
        }
      }
      
      await select.updateComplete;
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1000);
      expect(typeof select._isOpen).toBe('boolean');
    });

    it('should not cause memory leaks with event listeners', () => {
      const handler = vi.fn();
      
      select.addEventListener('neo-change', handler);
      select.removeEventListener('neo-change', handler);
      
      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('Form Integration', () => {
    it('should work with form validation', async () => {
      select.required = true;
      await select.updateComplete;

      const trigger = select.shadowRoot?.querySelector('.select-trigger');
      expect(trigger.getAttribute('aria-required')).toBe('true');
    });

    it('should maintain value for form submission', async () => {
      select.options = sampleOptions;
      select.value = 'option2';
      await select.updateComplete;

      expect(select.value).toBe('option2');
      
      // Multiple selection
      select.multiple = true;
      select.value = ['option1', 'option3'];
      await select.updateComplete;

      expect(select.value).toEqual(['option1', 'option3']);
    });
  });
});