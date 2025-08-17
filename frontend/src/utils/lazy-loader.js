/**
 * Dynamic Component Loader for Bundle Optimization
 * Implements lazy loading of components to reduce initial bundle size
 */

// Component loading cache to prevent duplicate imports
const componentCache = new Map();
const loadingPromises = new Map();

/**
 * Lazy load a component with caching
 * @param {string} componentPath - Path to the component
 * @param {string} tagName - Custom element tag name
 * @returns {Promise<void>}
 */
export async function lazyLoadComponent(componentPath, tagName) {
  // Return cached component if already loaded
  if (componentCache.has(componentPath)) {
    return componentCache.get(componentPath);
  }

  // Return existing loading promise if in progress
  if (loadingPromises.has(componentPath)) {
    return loadingPromises.get(componentPath);
  }

  // Check if component is already defined
  if (customElements.get(tagName)) {
    componentCache.set(componentPath, true);
    return true;
  }

  // Create loading promise
  const loadingPromise = import(componentPath)
    .then(() => {
      componentCache.set(componentPath, true);
      loadingPromises.delete(componentPath);
      return true;
    })
    .catch((error) => {
      console.error(`Failed to load component ${componentPath}:`, error);
      loadingPromises.delete(componentPath);
      throw error;
    });

  loadingPromises.set(componentPath, loadingPromise);
  return loadingPromise;
}

/**
 * Preload components for faster subsequent loading
 * @param {Array<{path: string, tagName: string}>} components
 */
export async function preloadComponents(components) {
  const preloadPromises = components.map(({ path, tagName }) =>
    lazyLoadComponent(path, tagName).catch(() => {
      // Silent fail for preloading - component will load when needed
    })
  );

  await Promise.allSettled(preloadPromises);
}

/**
 * Load component on intersection (when element enters viewport)
 * @param {HTMLElement} element - Element to observe
 * @param {string} componentPath - Path to component
 * @param {string} tagName - Custom element tag name
 * @param {IntersectionObserverInit} options - Observer options
 */
export function lazyLoadOnIntersection(element, componentPath, tagName, options = {}) {
  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  const observer = new IntersectionObserver(
    async (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          try {
            await lazyLoadComponent(componentPath, tagName);
            observer.unobserve(entry.target);
          } catch (error) {
            console.error('Failed to lazy load component:', error);
          }
        }
      }
    },
    defaultOptions
  );

  observer.observe(element);
  return observer;
}

/**
 * Load component on user interaction
 * @param {HTMLElement} element - Element to add event listeners to
 * @param {string} componentPath - Path to component
 * @param {string} tagName - Custom element tag name
 * @param {Array<string>} events - Events to listen for
 */
export function lazyLoadOnInteraction(element, componentPath, tagName, events = ['click', 'focus']) {
  const loadComponent = async () => {
    try {
      await lazyLoadComponent(componentPath, tagName);
      // Remove event listeners after loading
      events.forEach(event => {
        element.removeEventListener(event, loadComponent);
      });
    } catch (error) {
      console.error('Failed to lazy load component on interaction:', error);
    }
  };

  events.forEach(event => {
    element.addEventListener(event, loadComponent, { once: true });
  });
}

/**
 * Route-based component loading
 * @param {Object} routes - Route to component mapping
 * @param {string} currentRoute - Current route
 */
export async function loadRouteComponents(routes, currentRoute) {
  const routeConfig = routes[currentRoute];
  if (!routeConfig) return;

  const { components = [] } = routeConfig;
  
  // Load critical components first
  const criticalComponents = components.filter(c => c.critical);
  await Promise.all(
    criticalComponents.map(({ path, tagName }) => 
      lazyLoadComponent(path, tagName)
    )
  );

  // Preload non-critical components
  const nonCriticalComponents = components.filter(c => !c.critical);
  preloadComponents(nonCriticalComponents);
}

/**
 * Bundle size analyzer helper
 * @returns {Object} Loading statistics
 */
export function getLoadingStats() {
  return {
    cached: componentCache.size,
    loading: loadingPromises.size,
    cacheEntries: Array.from(componentCache.keys()),
    loadingEntries: Array.from(loadingPromises.keys())
  };
}

/**
 * Clear component cache (useful for development)
 */
export function clearComponentCache() {
  componentCache.clear();
  loadingPromises.clear();
}

// Component registry for organized loading
export const COMPONENT_REGISTRY = {
  atoms: {
    'neo-button': () => import('@components/atoms/button/button.js'),
    'neo-input': () => import('@components/atoms/input/input.js'),
    'neo-badge': () => import('@components/atoms/badge/badge.js'),
    'neo-spinner': () => import('@components/atoms/spinner/spinner.js'),
    'neo-icon': () => import('@components/atoms/icon/icon.js'),
    'neo-avatar': () => import('@components/atoms/avatar/avatar.js'),
    'neo-switch': () => import('@components/atoms/switch/switch.js'),
    'neo-heading': () => import('@components/atoms/heading/heading.js'),
    'neo-divider': () => import('@components/atoms/divider/divider.js'),
    'neo-label': () => import('@components/atoms/label/label.js'),
  },
  molecules: {
    'neo-card': () => import('@components/molecules/card/card.js'),
    'neo-modal': () => import('@components/molecules/modal/modal.js'),
    'neo-toast': () => import('@components/molecules/toast/toast.js'),
    'neo-alert': () => import('@components/molecules/alert/alert.js'),
    'neo-input-field': () => import('@components/molecules/input-field/input-field.js'),
    'neo-search-bar': () => import('@components/molecules/search-bar/search-bar.js'),
    'neo-user-profile-summary': () => import('@components/molecules/user-profile-summary/user-profile-summary.js'),
    'neo-badge-counter': () => import('@components/molecules/badge-counter/badge-counter.js'),
    'neo-cta-button-row': () => import('@components/molecules/cta-button-row/cta-button-row.js'),
    'neo-navigation-link': () => import('@components/molecules/navigation-link/navigation-link.js'),
    'neo-select-dropdown': () => import('@components/molecules/select-dropdown/select-dropdown.js'),
  },
  organisms: {
    'neo-table': () => import('@components/organisms/table/table.js'),
    'neo-notification-list': () => import('@components/organisms/notification-list.js'),
    'neo-dashboard-layout': () => import('@components/organisms/dashboard-layout.js'),
  },
  pages: {
    'support-page': () => import('@components/pages/support-page.js'),
    'verify-email-page': () => import('@components/pages/verify-email-page.js'),
  }
};

/**
 * Load component by tag name using registry
 * @param {string} tagName - Custom element tag name
 * @returns {Promise<void>}
 */
export async function loadComponentByTag(tagName) {
  // Find component in registry
  for (const [category, components] of Object.entries(COMPONENT_REGISTRY)) {
    if (components[tagName]) {
      try {
        await components[tagName]();
        componentCache.set(tagName, true);
        return true;
      } catch (error) {
        console.error(`Failed to load component ${tagName}:`, error);
        throw error;
      }
    }
  }
  
  throw new Error(`Component ${tagName} not found in registry`);
}