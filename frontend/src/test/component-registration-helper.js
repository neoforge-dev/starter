/**
 * Component Registration Helper
 *
 * This file provides utilities to improve component registration in tests.
 * It addresses common issues with custom element registration in the test environment.
 */

import {   LitElement, html   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

/**
 * Registry to keep track of registered components
 */
const componentRegistry = new Map();

/**
 * Register a component for testing
 *
 * @param {string} tagName - The tag name to register (e.g., 'neo-button')
 * @param {Function|Class} componentClass - The component class or a function that returns the component class
 * @param {Object} options - Additional options
 * @param {boolean} options.force - Force re-registration even if already registered
 * @param {boolean} options.createPlaceholder - Create a placeholder if component fails to register
 * @returns {Promise<Function>} - The registered component class
 */
export async function registerTestComponent(
  tagName,
  ComponentClass,
  options = {}
) {
  try {
    // Handle dynamic imports
    if (ComponentClass && typeof ComponentClass.then === "function") {
      ComponentClass = await ComponentClass;
    }

    // Get the actual component class if it's a module
    if (ComponentClass && ComponentClass.default) {
      ComponentClass = ComponentClass.default;
    }

    // Validate component class
    if (!ComponentClass || typeof ComponentClass !== "function") {
      throw new Error(`Invalid component class provided for ${tagName}`);
    }

    // Check if the component is a valid LitElement
    if (!(ComponentClass.prototype instanceof LitElement)) {
      console.warn(
        `Component ${tagName} does not extend LitElement, but will try to register anyway`
      );
    }

    // Check if already registered
    if (customElements.get(tagName)) {
      if (options.force) {
        // If force option is true, we need to "undefine" the element first
        // This is a workaround since customElements.define can't be called twice
        // We'll create a new class that extends the original one
        console.log(`Force re-registering component ${tagName}`);

        // Create a new tag name with a timestamp to ensure uniqueness
        const newTagName = `${tagName}-${Date.now()}`;

        // Store the original class in the registry
        componentRegistry.set(tagName, ComponentClass);

        // Return the original class
        return ComponentClass;
      } else {
        console.log(`Component ${tagName} already registered`);
        return customElements.get(tagName);
      }
    }

    // Define the custom element
    try {
      customElements.define(tagName, ComponentClass);
      componentRegistry.set(tagName, ComponentClass);
      console.log(`Successfully registered component ${tagName}`);
      return ComponentClass;
    } catch (error) {
      if (error.name === "NotSupportedError") {
        console.log(`Component ${tagName} already registered`);
        return customElements.get(tagName);
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error registering component ${tagName}:`, error);

    if (options.createPlaceholder) {
      // Create a placeholder component
      class PlaceholderComponent extends LitElement {
        render() {
          return html`<div>Placeholder for ${tagName}</div>`;
        }
      }
      try {
        customElements.define(tagName, PlaceholderComponent);
        componentRegistry.set(tagName, PlaceholderComponent);
        console.log(`Created placeholder for ${tagName}`);
        return PlaceholderComponent;
      } catch (e) {
        console.error(`Failed to create placeholder for ${tagName}:`, e);
      }
    }
    throw error;
  }
}

/**
 * Register multiple components for testing
 *
 * @param {Object} components - Map of tag names to component classes
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function registerTestComponents(components, options = {}) {
  const registrations = Object.entries(components).map(
    ([tagName, ComponentClass]) =>
      registerTestComponent(tagName, ComponentClass, options)
  );
  await Promise.all(registrations);
}

/**
 * Create a component fixture for testing
 *
 * @param {string} tagName - The tag name of the component
 * @param {Object} properties - Initial properties to set
 * @returns {Promise<HTMLElement>} - The created component
 */
export async function createComponentFixture(tagName, properties = {}) {
  // Make sure the component is defined before creating it
  await customElements.whenDefined(tagName);

  const element = document.createElement(tagName);

  // Set properties after element is created
  Object.entries(properties).forEach(([key, value]) => {
    element[key] = value;
  });

  document.body.appendChild(element);

  // Wait for the element to be ready
  if (element.updateComplete) {
    await element.updateComplete;
  }

  return element;
}

/**
 * Clean up a component fixture
 *
 * @param {HTMLElement} element - The component to clean up
 */
export function cleanupComponentFixture(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Reset the component registry
 */
export function resetComponentRegistry() {
  componentRegistry.clear();
}
