/**
 * Component Test Helper
 *
 * This file provides helper functions for testing web components in a more reliable way.
 * It handles common issues with shadow DOM, component lifecycle, and event handling.
 */

/**
 * Creates and mounts a component for testing
 *
 * @param {string} tagName - The tag name of the component to create
 * @param {Object} props - Properties to set on the component
 * @returns {Promise<HTMLElement>} - The mounted component
 */
export async function createComponent(tagName, props = {}) {
  // Create the element
  const element = document.createElement(tagName);

  // Set properties
  Object.entries(props).forEach(([key, value]) => {
    element[key] = value;
  });

  // Mount to document
  document.body.appendChild(element);

  // Wait for component to be ready
  if (element.updateComplete) {
    await element.updateComplete;
  }

  // Wait a tick for any async operations
  await new Promise((resolve) => setTimeout(resolve, 0));

  return element;
}

/**
 * Cleans up a component after testing
 *
 * @param {HTMLElement} element - The component to clean up
 */
export function removeComponent(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Waits for a component to update
 *
 * @param {HTMLElement} element - The component to wait for
 * @returns {Promise<void>}
 */
export async function waitForUpdate(element) {
  if (element.updateComplete) {
    await element.updateComplete;
  }

  // Wait a tick for any async operations
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Finds an element in a component's shadow DOM
 *
 * @param {HTMLElement} component - The component to search in
 * @param {string} selector - The CSS selector to find
 * @returns {Element|null} - The found element or null
 */
export function findInShadow(component, selector) {
  if (!component || !component.shadowRoot) {
    return null;
  }

  return component.shadowRoot.querySelector(selector);
}

/**
 * Finds all elements in a component's shadow DOM matching a selector
 *
 * @param {HTMLElement} component - The component to search in
 * @param {string} selector - The CSS selector to find
 * @returns {NodeList} - The found elements
 */
export function findAllInShadow(component, selector) {
  if (!component || !component.shadowRoot) {
    return [];
  }

  return component.shadowRoot.querySelectorAll(selector);
}

/**
 * Simulates a user input on a form field
 *
 * @param {HTMLElement} element - The input element
 * @param {string|boolean} value - The value to set
 */
export function setInputValue(element, value) {
  if (!element) return;

  if (element.type === "checkbox" || element.type === "radio") {
    element.checked = Boolean(value);
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/**
 * Simulates a click on an element
 *
 * @param {HTMLElement} element - The element to click
 */
export function click(element) {
  if (!element) return;

  element.click();
}

/**
 * Waits for an event to be dispatched from an element
 *
 * @param {HTMLElement} element - The element to listen to
 * @param {string} eventName - The name of the event
 * @returns {Promise<CustomEvent>} - The event
 */
export function waitForEvent(element, eventName) {
  return new Promise((resolve) => {
    const handler = (event) => {
      element.removeEventListener(eventName, handler);
      resolve(event);
    };

    element.addEventListener(eventName, handler);
  });
}

/**
 * Fills a form with values
 *
 * @param {HTMLElement} form - The form element
 * @param {Object} values - Key-value pairs of input names and values
 */
export function fillForm(form, values) {
  if (!form) return;

  Object.entries(values).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (input) {
      setInputValue(input, value);
    }
  });
}

/**
 * Submits a form
 *
 * @param {HTMLElement} form - The form element
 */
export function submitForm(form) {
  if (!form) return;

  const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
  form.dispatchEvent(submitEvent);
}

/**
 * Waits for a component to be defined
 *
 * @param {string} tagName - The tag name of the component
 * @returns {Promise<void>}
 */
export async function waitForComponentDefinition(tagName) {
  if (customElements.get(tagName)) {
    return;
  }

  return new Promise((resolve) => {
    customElements.whenDefined(tagName).then(resolve);
  });
}
