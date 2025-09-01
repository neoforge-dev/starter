import { BaseComponent } from "./components/base-component.js";

// Import and register components
const components = [
  ["dashboard-page", () => import("./pages/dashboard-page.js")],
  ["support-page", () => import("./pages/support-page.js")],
  ["contact-page", () => import("./pages/contact-page.js")],
  ["profile-page", () => import("./pages/profile-page.js")],
  ["about-page", () => import("./pages/about-page.js")],
  ["faq-page", () => import("./pages/faq-page.js")]
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
            console.warn(`Could not find component class for ${name}`);
          }
        } catch (error) {
          console.error(`Error importing dynamic component ${name}:`, error);
        }
      } else {
        // If component is a class, register it directly
        BaseComponent.registerComponent(name, component);
      }
    } else {
      console.warn(`Invalid component type for ${name}`);
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

// Export the promise for other modules to await
export { registrationPromise as default };
