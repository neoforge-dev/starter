/**
 * Router service for handling navigation and transitions
 */
class RouterService {
  constructor() {
    this.routes = new Map();
    this.transitionManager = null;
    this._currentPath = "";
    this._initialized = false;

    // Bind methods
    this._handlePopState = this._handlePopState.bind(this);
    this._handleClick = this._handleClick.bind(this);
  }

  /**
   * Initialize router
   * @param {HTMLElement} transitionManager - Transition manager element
   */
  init(transitionManager) {
    if (this._initialized) return;

    this.transitionManager = transitionManager;
    this._currentPath = window.location.pathname;

    // Add event listeners
    window.addEventListener("popstate", this._handlePopState);
    document.addEventListener("click", this._handleClick);

    this._initialized = true;

    // Handle initial route
    this._handleRoute(this._currentPath);
  }

  /**
   * Register a route
   * @param {string} path - Route path
   * @param {Function} handler - Route handler function
   * @param {Object} [options] - Route options
   * @param {string} [options.transition] - Transition type for this route
   */
  register(path, handler, options = {}) {
    this.routes.set(path, { handler, options });
  }

  /**
   * Navigate to path
   * @param {string} path - Target path
   * @param {Object} [options] - Navigation options
   * @param {string} [options.transition] - Override transition type
   * @param {boolean} [options.replace=false] - Replace current history entry
   */
  async navigate(path, { transition, replace = false } = {}) {
    if (path === this._currentPath) return;

    // Update history
    if (replace) {
      window.history.replaceState(null, "", path);
    } else {
      window.history.pushState(null, "", path);
    }

    // Handle route change
    await this._handleRoute(path, transition);
  }

  /**
   * Handle route change
   * @private
   */
  async _handleRoute(path, transitionOverride) {
    const route = this.routes.get(path);
    if (!route) {
      console.warn(`No route handler found for path: ${path}`);
      return;
    }

    try {
      // Get new content from route handler
      const content = await route.handler();

      // Transition to new content
      if (this.transitionManager) {
        await this.transitionManager.transitionTo(
          content,
          transitionOverride || route.options.transition
        );
      }

      this._currentPath = path;
    } catch (error) {
      console.error("Error handling route:", error);
    }
  }

  /**
   * Handle popstate event
   * @private
   */
  _handlePopState() {
    const path = window.location.pathname;
    this._handleRoute(path);
  }

  /**
   * Handle click event for internal navigation
   * @private
   */
  _handleClick(event) {
    // Find closest anchor element
    const anchor = event.target.closest("a");
    if (!anchor) return;

    // Check if internal link
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("//")) return;

    // Prevent default navigation
    event.preventDefault();

    // Get transition from data attribute
    const transition = anchor.dataset.transition;

    // Navigate
    this.navigate(href, { transition });
  }

  /**
   * Clean up router
   */
  destroy() {
    window.removeEventListener("popstate", this._handlePopState);
    document.removeEventListener("click", this._handleClick);
    this.routes.clear();
    this.transitionManager = null;
    this._initialized = false;
  }
}

// Create singleton instance
const router = new RouterService();
export default router;
