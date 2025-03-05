import { LitElement, html } from "lit";
import { BaseComponent } from "../components/base-component.js";
import { ErrorPage } from "../components/error-page.js";
import { LoginForm } from "../components/auth/login-form.js";
import { LoginPage } from "../components/pages/login-page.js";

// Import and register components
const components = [
  ["dashboard-page", () => import("../pages/dashboard-page.js")],
  ["login-form", LoginForm],
  ["login-page", LoginPage],
  ["error-page", ErrorPage],
  ["support-page", () => import("../pages/support-page.js")],
  ["contact-page", () => import("../pages/contact-page.js")],
  ["profile-page", () => import("../pages/profile-page.js")],
  ["about-page", () => import("../pages/about-page.js")],
  ["faq-page", () => import("../pages/faq-page.js")],
  ["status-page", () => import("../pages/status-page.js")],
  ["tutorials-page", () => import("../pages/tutorials-page.js")],
  ["settings-page", () => import("../pages/settings-page.js")],
  ["neo-table", () => import("../components/organisms/table/table.js")]
];

// Function to register a single component
async function registerComponent(name, component) {
  try {
    if (typeof component === "function") {
      if (component.constructor && component.constructor.name === "AsyncFunction" || 
          component.toString().includes('import(')) {
        // If component is a dynamic import, wait for it to load
        try {
          const module = await component();
          // Try different ways to get the component class
          const ComponentClass = 
            module.default || 
            module[name.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("")] ||
            module[name.charAt(0).toUpperCase() + name.slice(1)];
          
          if (ComponentClass && typeof ComponentClass === 'function') {
            BaseComponent.registerComponent(name, ComponentClass);
          } else {
            console.warn(`Could not find component class for ${name}, using placeholder`);
            // Create a placeholder component for testing if needed
            class PlaceholderComponent extends LitElement {
              render() { return html``; }
            }
            BaseComponent.registerComponent(name, PlaceholderComponent);
          }
        } catch (error) {
          console.error(`Error importing dynamic component ${name}:`, error);
          // Create a placeholder component for testing if needed
          class PlaceholderComponent extends LitElement {
            render() { return html``; }
          }
          BaseComponent.registerComponent(name, PlaceholderComponent);
        }
      } else {
        // If component is a class, register it directly
        BaseComponent.registerComponent(name, component);
      }
    } else {
      console.warn(`Invalid component type for ${name}, using placeholder`);
      // Create a placeholder component for testing if needed
      class PlaceholderComponent extends LitElement {
        render() { return html``; }
      }
      BaseComponent.registerComponent(name, PlaceholderComponent);
    }
  } catch (error) {
    console.error(`Failed to register component ${name}:`, error);
  }
}

// Function to register all components
export async function registerAllComponents() {
  for (const [name, component] of components) {
    try {
      await registerComponent(name, component);
    } catch (error) {
      console.error(`Error registering ${name}:`, error);
    }
  }
  return true;
}

// Register all components immediately
const registrationPromise = registerAllComponents();

// Export the promise for tests to await
export { registrationPromise as default }; 