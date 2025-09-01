import { Logger } from './logger.js';

/**
 * Simple client-side router
 */
class Router {
  constructor() {
    this.routes = new Map();
    this.notFoundHandler = () => {
      Logger.warn('No route handler found for:', window.location.pathname);
    };
    this.currentRoute = null;
    this.params = {};
    this.query = {};

    // Bind methods
    this._handlePopState = this._handlePopState.bind(this);
    this._handleClick = this._handleClick.bind(this);

    // Initialize
    this._setup();
  }

  /**
   * Set up router event listeners
   */
  _setup() {
    window.addEventListener('popstate', this._handlePopState);
    document.addEventListener('click', this._handleClick);

    // Handle initial route
    this._handleRoute(window.location.pathname + window.location.search);
  }

  /**
   * Handle popstate events
   */
  _handlePopState() {
    this._handleRoute(window.location.pathname + window.location.search);
  }

  /**
   * Handle click events for internal navigation
   * @param {MouseEvent} event
   */
  _handleClick(event) {
    // Only handle primary mouse button clicks
    if (event.button !== 0) return;

    // Find closest anchor element
    const anchor = event.target.closest('a');
    if (!anchor) return;

    // Skip if:
    // - Has target attribute
    // - Has download attribute
    // - Has rel="external"
    // - Is not an internal link
    if (
      anchor.target ||
      anchor.hasAttribute('download') ||
      anchor.getAttribute('rel') === 'external' ||
      !this._isInternalUrl(anchor.href)
    ) {
      return;
    }

    // Prevent default behavior
    event.preventDefault();

    // Navigate to the URL
    const url = new URL(anchor.href);
    this.navigate(url.pathname + url.search);
  }

  /**
   * Check if a URL is internal
   * @param {string} url
   * @returns {boolean}
   */
  _isInternalUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Parse route parameters from path
   * @param {string} pattern
   * @param {string} path
   * @returns {Object|null}
   */
  _parseParams(pattern, path) {
    const paramNames = [];
    const regexPattern = pattern.replace(/:[^/]+/g, (match) => {
      paramNames.push(match.slice(1));
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPattern}$`);
    const match = path.match(regex);

    if (!match) return null;

    const params = {};
    paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1]);
    });

    return params;
  }

  /**
   * Parse query parameters from search string
   * @param {string} search
   * @returns {Object}
   */
  _parseQuery(search) {
    const query = {};
    const searchParams = new URLSearchParams(search);
    for (const [key, value] of searchParams) {
      query[key] = value;
    }
    return query;
  }

  /**
   * Handle route change
   * @param {string} url
   */
  _handleRoute(url) {
    const [pathname, search] = url.split('?');
    let matchedRoute = null;
    let matchedParams = {};

    // Find matching route
    for (const [pattern, handler] of this.routes) {
      const params = this._parseParams(pattern, pathname);
      if (params !== null) {
        matchedRoute = handler;
        matchedParams = params;
        break;
      }
    }

    // Update current route info
    this.currentRoute = pathname;
    this.params = matchedParams;
    this.query = this._parseQuery(search ? `?${search}` : '');

    // Call route handler or not found handler
    if (matchedRoute) {
      try {
        matchedRoute(this.params, this.query);
      } catch (error) {
        Logger.error('Error in route handler:', error);
      }
    } else {
      this.notFoundHandler();
    }

    // Dispatch route change event
    window.dispatchEvent(new CustomEvent('route-changed', {
      detail: {
        pathname,
        params: this.params,
        query: this.query
      }
    }));
  }

  /**
   * Register a route
   * @param {string} pattern - Route pattern (e.g., '/users/:id')
   * @param {Function} handler - Route handler
   */
  register(pattern, handler) {
    this.routes.set(pattern, handler);
    Logger.debug(`Registered route: ${pattern}`);
  }

  /**
   * Register a not found handler
   * @param {Function} handler
   */
  registerNotFound(handler) {
    this.notFoundHandler = handler;
  }

  /**
   * Navigate to a URL
   * @param {string} url
   * @param {Object} [options] - Navigation options
   * @param {boolean} [options.replace=false] - Replace current history entry
   */
  navigate(url, { replace = false } = {}) {
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](null, '', url);
    this._handleRoute(url);
  }

  /**
   * Get current route parameters
   * @returns {Object}
   */
  getParams() {
    return { ...this.params };
  }

  /**
   * Get current query parameters
   * @returns {Object}
   */
  getQuery() {
    return { ...this.query };
  }

  /**
   * Check if current route matches pattern
   * @param {string} pattern
   * @returns {boolean}
   */
  isRoute(pattern) {
    return this._parseParams(pattern, this.currentRoute) !== null;
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    window.removeEventListener('popstate', this._handlePopState);
    document.removeEventListener('click', this._handleClick);
    this.routes.clear();
    Logger.debug('Router destroyed');
  }
}

export const router = new Router();
