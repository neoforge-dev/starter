/**
 * Keyboard Navigation Mixin
 * Provides common keyboard navigation functionality for web components
 * Ensures WCAG 2.1 keyboard accessibility compliance
 */

/**
 * Keyboard Navigation Mixin
 * @param {Class} superClass - The base class to extend
 * @returns {Class} Enhanced class with keyboard navigation capabilities
 */
export const KeyboardNavigationMixin = (superClass) =>
  class extends superClass {
    constructor() {
      super();
      this._keydownHandler = this._handleKeydown.bind(this);
      this._keyupHandler = this._handleKeyup.bind(this);
      this._focusHandler = this._handleFocus.bind(this);
      this._blurHandler = this._handleBlur.bind(this);
      this._currentFocusIndex = -1;
      this._focusableElements = [];
    }

    connectedCallback() {
      super.connectedCallback?.();
      this.addEventListener('keydown', this._keydownHandler);
      this.addEventListener('keyup', this._keyupHandler);
      this.addEventListener('focus', this._focusHandler, true);
      this.addEventListener('blur', this._blurHandler, true);

      // Set initial tabindex if not already set
      if (!this.hasAttribute('tabindex') && this._shouldBeInitiallyFocusable()) {
        this.setAttribute('tabindex', '0');
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.removeEventListener('keydown', this._keydownHandler);
      this.removeEventListener('keyup', this._keyupHandler);
      this.removeEventListener('focus', this._focusHandler, true);
      this.removeEventListener('blur', this._blurHandler, true);
    }

    /**
     * Handle keydown events for accessibility
     * @param {KeyboardEvent} event
     */
    _handleKeydown(event) {
      const { key, target } = event;

      // Handle Enter and Space for activation
      if ((key === 'Enter' || key === ' ') && this._shouldActivateOnKeypress(target)) {
        event.preventDefault();
        this._activateElement(target);
        return;
      }

      // Handle arrow key navigation
      if (this._shouldHandleArrowKeys()) {
        switch (key) {
          case 'ArrowDown':
          case 'ArrowRight':
            event.preventDefault();
            this._focusNext();
            break;
          case 'ArrowUp':
          case 'ArrowLeft':
            event.preventDefault();
            this._focusPrevious();
            break;
          case 'Home':
            event.preventDefault();
            this._focusFirst();
            break;
          case 'End':
            event.preventDefault();
            this._focusLast();
            break;
        }
      }

      // Allow components to handle additional keys
      this._handleCustomKeydown?.(event);
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event
     */
    _handleKeyup(event) {
      // Handle space key release for activation (to match button behavior)
      if (event.key === ' ' && this._shouldActivateOnKeypress(event.target)) {
        event.preventDefault();
      }

      this._handleCustomKeyup?.(event);
    }

    /**
     * Handle focus events
     * @param {FocusEvent} event
     */
    _handleFocus(event) {
      this._updateFocusableElements();
      this._currentFocusIndex = this._focusableElements.indexOf(event.target);

      // Add visual focus indicator if needed
      this._addFocusIndicator?.(event.target);

      this._handleCustomFocus?.(event);
    }

    /**
     * Handle blur events
     * @param {FocusEvent} event
     */
    _handleBlur(event) {
      // Remove visual focus indicator if needed
      this._removeFocusIndicator?.(event.target);

      this._handleCustomBlur?.(event);
    }

    /**
     * Update the list of focusable elements
     */
    _updateFocusableElements() {
      const selectors = [
        'button:not([disabled]):not([tabindex="-1"])',
        'input:not([disabled]):not([tabindex="-1"])',
        'select:not([disabled]):not([tabindex="-1"])',
        'textarea:not([disabled]):not([tabindex="-1"])',
        'a[href]:not([tabindex="-1"])',
        '[tabindex="0"]',
        '[tabindex="1"]', '[tabindex="2"]', '[tabindex="3"]', '[tabindex="4"]', '[tabindex="5"]',
        '[contenteditable="true"]:not([tabindex="-1"])',
        'details:not([tabindex="-1"])',
        'summary:not([tabindex="-1"])'
      ].join(', ');

      // Check both shadow DOM and light DOM
      const shadowElements = this.shadowRoot ?
        Array.from(this.shadowRoot.querySelectorAll(selectors)) : [];
      const lightElements = Array.from(this.querySelectorAll(selectors));

      this._focusableElements = [...shadowElements, ...lightElements].filter(el => {
        return this._isElementVisible(el) && !this._isElementDisabled(el);
      });
    }

    /**
     * Check if element is visible
     * @param {Element} element
     * @returns {boolean}
     */
    _isElementVisible(element) {
      const style = getComputedStyle(element);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             element.offsetParent !== null;
    }

    /**
     * Check if element is disabled
     * @param {Element} element
     * @returns {boolean}
     */
    _isElementDisabled(element) {
      return element.disabled ||
             element.getAttribute('aria-disabled') === 'true' ||
             element.getAttribute('tabindex') === '-1';
    }

    /**
     * Focus the next focusable element
     */
    _focusNext() {
      this._updateFocusableElements();
      if (this._focusableElements.length === 0) return;

      const nextIndex = (this._currentFocusIndex + 1) % this._focusableElements.length;
      this._focusableElements[nextIndex].focus();
    }

    /**
     * Focus the previous focusable element
     */
    _focusPrevious() {
      this._updateFocusableElements();
      if (this._focusableElements.length === 0) return;

      const prevIndex = this._currentFocusIndex <= 0 ?
        this._focusableElements.length - 1 : this._currentFocusIndex - 1;
      this._focusableElements[prevIndex].focus();
    }

    /**
     * Focus the first focusable element
     */
    _focusFirst() {
      this._updateFocusableElements();
      if (this._focusableElements.length > 0) {
        this._focusableElements[0].focus();
      }
    }

    /**
     * Focus the last focusable element
     */
    _focusLast() {
      this._updateFocusableElements();
      if (this._focusableElements.length > 0) {
        this._focusableElements[this._focusableElements.length - 1].focus();
      }
    }

    /**
     * Activate an element (click, etc.)
     * @param {Element} element
     */
    _activateElement(element) {
      if (element.click && typeof element.click === 'function') {
        element.click();
      } else if (element.dispatchEvent) {
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      }
    }

    /**
     * Check if element should be activated on keypress
     * @param {Element} element
     * @returns {boolean}
     */
    _shouldActivateOnKeypress(element) {
      // Don't activate if it's a native form element that handles its own activation
      const nativeInteractive = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
      if (nativeInteractive.includes(element.tagName)) {
        // Exception: buttons and button-role elements should be activated
        return element.tagName === 'BUTTON' || element.getAttribute('role') === 'button';
      }

      // Activate elements with button role or click handlers
      return element.getAttribute('role') === 'button' ||
             element.onclick ||
             element.getAttribute('onclick') ||
             this._hasClickListener(element);
    }

    /**
     * Check if element has click listeners
     * @param {Element} element
     * @returns {boolean}
     */
    _hasClickListener(element) {
      // This is a simplified check - in practice, you might want to track this differently
      return element.getAttribute('data-clickable') === 'true';
    }

    /**
     * Check if this component should be initially focusable
     * Override in subclasses
     * @returns {boolean}
     */
    _shouldBeInitiallyFocusable() {
      return false;
    }

    /**
     * Check if this component should handle arrow keys
     * Override in subclasses for components like menus, lists, etc.
     * @returns {boolean}
     */
    _shouldHandleArrowKeys() {
      return false;
    }

    // Public API methods

    /**
     * Focus the component
     */
    focus() {
      if (this.shadowRoot) {
        const firstFocusable = this.shadowRoot.querySelector(
          'button, input, select, textarea, a[href], [tabindex="0"]'
        );
        if (firstFocusable) {
          firstFocusable.focus();
          return;
        }
      }

      // Fallback to focusing the host element
      super.focus?.() || HTMLElement.prototype.focus.call(this);
    }

    /**
     * Get all focusable elements within the component
     * @returns {Element[]}
     */
    getFocusableElements() {
      this._updateFocusableElements();
      return [...this._focusableElements];
    }

    /**
     * Check if the component has focus
     * @returns {boolean}
     */
    hasFocus() {
      return this.contains(document.activeElement) ||
             (this.shadowRoot && this.shadowRoot.activeElement);
    }

    /**
     * Set keyboard navigation mode for lists/menus
     * @param {string} mode - 'horizontal', 'vertical', or 'both'
     */
    setNavigationMode(mode) {
      this._navigationMode = mode;
    }

    /**
     * Add ARIA attributes for better accessibility
     * @param {Object} attributes - Key-value pairs of ARIA attributes
     */
    setAriaAttributes(attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (key.startsWith('aria-') || key === 'role') {
          this.setAttribute(key, value);
        }
      });
    }
  };

/**
 * Menu/List Navigation Mixin
 * Specialized for menu and list components that need arrow key navigation
 */
export const MenuNavigationMixin = (superClass) =>
  class extends KeyboardNavigationMixin(superClass) {
    constructor() {
      super();
      this._navigationMode = 'vertical'; // 'horizontal', 'vertical', or 'both'
      this._wrapNavigation = true;
      this._selectedIndex = -1;
    }

    _shouldHandleArrowKeys() {
      return true;
    }

    _shouldBeInitiallyFocusable() {
      return true;
    }

    _handleKeydown(event) {
      const { key } = event;

      // Handle selection keys
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        this._selectCurrentItem();
        return;
      }

      // Handle Escape for closing menus
      if (key === 'Escape') {
        this._handleEscape?.();
        return;
      }

      super._handleKeydown(event);
    }

    /**
     * Select the currently focused item
     */
    _selectCurrentItem() {
      if (this._currentFocusIndex >= 0 && this._focusableElements[this._currentFocusIndex]) {
        const item = this._focusableElements[this._currentFocusIndex];
        this._activateElement(item);

        // Update selected index
        this._selectedIndex = this._currentFocusIndex;

        // Dispatch selection event
        this.dispatchEvent(new CustomEvent('item-selected', {
          detail: {
            selectedIndex: this._selectedIndex,
            selectedItem: item
          },
          bubbles: true,
          composed: true
        }));
      }
    }

    /**
     * Get the currently selected item
     * @returns {Element|null}
     */
    getSelectedItem() {
      return this._selectedIndex >= 0 ? this._focusableElements[this._selectedIndex] : null;
    }

    /**
     * Set the selected item by index
     * @param {number} index
     */
    setSelectedIndex(index) {
      this._updateFocusableElements();
      if (index >= 0 && index < this._focusableElements.length) {
        this._selectedIndex = index;
        this._focusableElements[index].focus();
      }
    }
  };
