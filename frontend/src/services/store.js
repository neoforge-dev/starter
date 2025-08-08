import { Logger } from '../utils/logger.js';
import { pwaService } from './pwa.js';

// Define event names
const STATE_CHANGED_EVENT = "state-changed";
const ACTION_DISPATCHED_EVENT = "action-dispatched";

export class Store extends EventTarget {
  constructor(initialState = {}) {
    super();
    this.actions = {};
    this.middleware = [];
    this._subscribers = new Set();
    this._devtools = null;
    
    // Initialize state with deep copy to prevent mutations
    this._state = this._deepFreeze(this._cloneDeep(initialState));
    
    // Set up development tools integration
    this._setupDevtools();
    
    // Initialize persistence
    this._persistenceConfig = null;
    this._initialized = false;
  }

  get state() {
    return this._state;
  }

  /**
   * Initialize the store with persistence and load saved state
   * @param {Object} config - Persistence configuration
   */
  async initialize(config = {}) {
    if (this._initialized) return;
    
    this._persistenceConfig = config;
    
    // Load persisted state if configured
    if (config.persist) {
      await this._loadPersistedState(config.persist);
    }
    
    this._initialized = true;
    Logger.info('Store initialized');
  }

  /**
   * Dispatch an action to update the state.
   * @param {string|Object} action - Action type or action object
   * @param {any} payload - The payload to pass to the action
   * @returns {Promise} - Promise that resolves when action is complete
   */
  async dispatch(action, payload) {
    const actionObj = typeof action === 'string' 
      ? { type: action, payload } 
      : action;

    try {
      // Apply middleware
      let processedAction = actionObj;
      for (const middleware of this.middleware) {
        processedAction = await middleware(processedAction, this._state, this);
        if (!processedAction) return; // Middleware can cancel action
      }

      const { type, payload: actionPayload } = processedAction;

      // Check if action exists
      if (!this.actions[type]) {
        Logger.warn(`Action type "${type}" is not defined`);
        return;
      }

      // Log action for debugging
      Logger.debug(`Dispatching action: ${type}`, actionPayload);

      // Get previous state for comparison
      const prevState = this._cloneDeep(this._state);

      // Execute action
      const result = this.actions[type](this._state, actionPayload);
      
      // Handle async actions
      if (result instanceof Promise) {
        await result;
      }

      // Check if state actually changed
      if (!this._stateHasChanged(prevState, this._state)) {
        Logger.debug(`Action "${type}" did not change state`);
        return;
      }

      // Freeze new state
      this._state = this._deepFreeze(this._state);

      // Notify subscribers
      this._notifyStateChange(type, actionPayload, prevState);

      // Persist state if configured
      await this._persistState();

      // Send to devtools
      if (this._devtools) {
        this._devtools.send(type, this._state);
      }

      // Dispatch action event
      this.dispatchEvent(new CustomEvent(ACTION_DISPATCHED_EVENT, {
        detail: { action: processedAction, prevState, newState: this._state }
      }));

    } catch (error) {
      Logger.error(`Error dispatching action "${actionObj.type}":`, error);
      throw error;
    }
  }

  /**
   * Subscribe to state changes.
   * @param {function} callback - Function to call when state changes
   * @param {Object} options - Subscription options
   * @returns {function} - Unsubscribe function
   */
  subscribe(callback, options = {}) {
    const subscriber = {
      callback,
      selector: options.selector,
      id: Math.random().toString(36).substr(2, 9)
    };

    this._subscribers.add(subscriber);

    // Immediately call with current state if requested
    if (options.immediate) {
      const selectedState = subscriber.selector 
        ? subscriber.selector(this._state) 
        : this._state;
      callback(selectedState, null);
    }

    // Return unsubscribe function
    return () => {
      this._subscribers.delete(subscriber);
    };
  }

  /**
   * Add actions to the store
   * @param {Object} actions - Object containing action functions
   */
  addActions(actions) {
    Object.entries(actions).forEach(([type, actionFn]) => {
      if (typeof actionFn !== 'function') {
        throw new Error(`Action "${type}" must be a function`);
      }
      this.actions[type] = actionFn;
    });
    Logger.debug(`Added ${Object.keys(actions).length} actions to store`);
  }

  /**
   * Add middleware to the store
   * @param {function} middleware - Middleware function
   */
  addMiddleware(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middleware.push(middleware);
    Logger.debug('Added middleware to store');
  }

  /**
   * Get a slice of state
   * @param {function} selector - Function to select state slice
   * @returns {any} - Selected state
   */
  select(selector) {
    return selector(this._state);
  }

  /**
   * Replace entire state (for hydration)
   * @param {Object} newState - New state object
   */
  replaceState(newState) {
    const prevState = this._state;
    this._state = this._deepFreeze(this._cloneDeep(newState));
    this._notifyStateChange('REPLACE_STATE', newState, prevState);
  }

  /**
   * Clear all state and reset to initial
   * @param {Object} initialState - Optional new initial state
   */
  reset(initialState = {}) {
    const prevState = this._state;
    this._state = this._deepFreeze(this._cloneDeep(initialState));
    this._notifyStateChange('RESET', initialState, prevState);
  }

  // Private utility methods
  _notifyStateChange(actionType, payload, prevState) {
    this._subscribers.forEach(subscriber => {
      try {
        const prevSelectedState = subscriber.selector 
          ? subscriber.selector(prevState) 
          : prevState;
        const newSelectedState = subscriber.selector 
          ? subscriber.selector(this._state) 
          : this._state;

        // Only notify if selected state actually changed
        if (this._stateHasChanged(prevSelectedState, newSelectedState)) {
          subscriber.callback(newSelectedState, prevSelectedState, actionType);
        }
      } catch (error) {
        Logger.error('Error in state change subscriber:', error);
      }
    });

    // Emit legacy event for backward compatibility
    this.dispatchEvent(new CustomEvent(STATE_CHANGED_EVENT, {
      detail: {
        actionType,
        payload,
        state: this._state,
        prevState
      }
    }));
  }

  _stateHasChanged(prev, current) {
    return JSON.stringify(prev) !== JSON.stringify(current);
  }

  _cloneDeep(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this._cloneDeep(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this._cloneDeep(obj[key]);
      });
      return cloned;
    }
    return obj;
  }

  _deepFreeze(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] !== null && typeof obj[prop] === 'object') {
        this._deepFreeze(obj[prop]);
      }
    });
    
    return Object.freeze(obj);
  }

  _setupDevtools() {
    if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
      this._devtools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: 'NeoForge Store'
      });
      this._devtools.init(this._state);
    }
  }

  async _loadPersistedState(persistConfig) {
    try {
      const { key = 'neoforge-state', whitelist = [], blacklist = [] } = persistConfig;
      
      const persistedState = await pwaService.getOfflineData(key);
      if (persistedState) {
        // Filter state based on whitelist/blacklist
        const filteredState = this._filterPersistedState(persistedState, whitelist, blacklist);
        
        // Merge with current state
        this._state = this._deepFreeze({
          ...this._state,
          ...filteredState
        });
        
        Logger.info('Loaded persisted state');
      }
    } catch (error) {
      Logger.warn('Failed to load persisted state:', error);
    }
  }

  async _persistState() {
    if (!this._persistenceConfig?.persist) return;

    try {
      const { key = 'neoforge-state', whitelist = [], blacklist = [] } = this._persistenceConfig.persist;
      
      // Filter state for persistence
      const stateToSave = this._filterPersistedState(this._state, whitelist, blacklist);
      
      await pwaService.storeOfflineData(key, stateToSave);
      Logger.debug('State persisted');
    } catch (error) {
      Logger.warn('Failed to persist state:', error);
    }
  }

  _filterPersistedState(state, whitelist, blacklist) {
    if (whitelist.length > 0) {
      // Only include whitelisted keys
      return Object.keys(state)
        .filter(key => whitelist.includes(key))
        .reduce((obj, key) => {
          obj[key] = state[key];
          return obj;
        }, {});
    }

    if (blacklist.length > 0) {
      // Exclude blacklisted keys
      return Object.keys(state)
        .filter(key => !blacklist.includes(key))
        .reduce((obj, key) => {
          obj[key] = state[key];
          return obj;
        }, {});
    }

    return state;
  }
}

// Enhanced mixin for components to connect to the store
export const StoreMixin = (superClass) =>
  class extends superClass {
    constructor() {
      super();
      this._storeSubscriptions = [];
      this._connectedToStore = false;
    }

    connectedCallback() {
      super.connectedCallback();
      this._connectToStore();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._disconnectFromStore();
    }

    /**
     * Connect to store with automatic re-rendering
     */
    _connectToStore() {
      if (this._connectedToStore) return;

      // Subscribe to general state changes
      if (this.stateChanged) {
        const unsubscribe = store.subscribe((newState, prevState, actionType) => {
          this.stateChanged(newState, prevState, actionType);
          // Trigger re-render
          this.requestUpdate();
        });
        this._storeSubscriptions.push(unsubscribe);
      }

      // Handle specific state subscriptions
      if (this.stateSelectors) {
        Object.entries(this.stateSelectors).forEach(([name, selector]) => {
          const unsubscribe = store.subscribe(
            (selectedState, prevSelectedState, actionType) => {
              const methodName = `${name}Changed`;
              if (this[methodName]) {
                this[methodName](selectedState, prevSelectedState, actionType);
              }
              this.requestUpdate();
            },
            { selector, immediate: true }
          );
          this._storeSubscriptions.push(unsubscribe);
        });
      }

      this._connectedToStore = true;
    }

    /**
     * Disconnect from store
     */
    _disconnectFromStore() {
      this._storeSubscriptions.forEach(unsubscribe => unsubscribe());
      this._storeSubscriptions = [];
      this._connectedToStore = false;
    }

    /**
     * Convenience method to dispatch actions
     */
    dispatch(action, payload) {
      return store.dispatch(action, payload);
    }

    /**
     * Convenience method to get current state
     */
    getState() {
      return store.state;
    }

    /**
     * Convenience method to select state
     */
    select(selector) {
      return store.select(selector);
    }
  };

// Built-in middleware
export const LoggerMiddleware = async (action, state, store) => {
  Logger.debug('Action dispatched:', action.type, action.payload);
  return action;
};

export const ThunkMiddleware = async (action, state, store) => {
  // Handle function actions (thunks)
  if (typeof action === 'function') {
    return await action(store.dispatch.bind(store), () => store.state);
  }
  return action;
};

export const ErrorMiddleware = async (action, state, store) => {
  try {
    return action;
  } catch (error) {
    Logger.error('Action error:', error);
    await store.dispatch('SET_ERROR', error.message);
    throw error;
  }
};

// Create the application store with initial state
export const store = new Store({
  // User state
  user: null,
  isAuthenticated: false,
  
  // UI state
  theme: localStorage.getItem('theme') || 'light',
  loading: false,
  error: null,
  notifications: [],
  
  // Navigation state
  currentRoute: '/',
  routeParams: {},
  
  // Application state
  online: navigator.onLine,
  pwaInstalled: false,
  updateAvailable: false,
  
  // Data cache
  cache: {
    projects: null,
    analytics: null,
    lastUpdated: null
  },
  
  // Settings
  settings: {
    language: 'en',
    autoSave: true,
    notifications: true
  }
});

// Add comprehensive actions
store.addActions({
  // User actions
  SET_USER: (state, user) => {
    state.user = user;
    state.isAuthenticated = !!user;
  },
  
  LOGOUT: (state) => {
    state.user = null;
    state.isAuthenticated = false;
  },
  
  // UI actions
  SET_THEME: (state, theme) => {
    state.theme = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },
  
  SET_LOADING: (state, loading) => {
    state.loading = loading;
  },
  
  SET_ERROR: (state, error) => {
    state.error = error;
  },
  
  CLEAR_ERROR: (state) => {
    state.error = null;
  },
  
  // Notification actions
  ADD_NOTIFICATION: (state, notification) => {
    const id = Date.now().toString();
    state.notifications.push({
      id,
      timestamp: Date.now(),
      ...notification
    });
  },
  
  REMOVE_NOTIFICATION: (state, id) => {
    state.notifications = state.notifications.filter(n => n.id !== id);
  },
  
  CLEAR_NOTIFICATIONS: (state) => {
    state.notifications = [];
  },
  
  // Navigation actions
  SET_ROUTE: (state, { route, params = {} }) => {
    state.currentRoute = route;
    state.routeParams = params;
  },
  
  // App state actions
  SET_ONLINE: (state, online) => {
    state.online = online;
  },
  
  SET_PWA_INSTALLED: (state, installed) => {
    state.pwaInstalled = installed;
  },
  
  SET_UPDATE_AVAILABLE: (state, available) => {
    state.updateAvailable = available;
  },
  
  // Cache actions
  SET_CACHE_DATA: (state, { key, data }) => {
    state.cache[key] = data;
    state.cache.lastUpdated = Date.now();
  },
  
  CLEAR_CACHE: (state) => {
    state.cache = {
      projects: null,
      analytics: null,
      lastUpdated: null
    };
  },
  
  // Settings actions
  UPDATE_SETTINGS: (state, settings) => {
    state.settings = { ...state.settings, ...settings };
  }
});

// Add middleware
store.addMiddleware(ThunkMiddleware);
store.addMiddleware(LoggerMiddleware);
store.addMiddleware(ErrorMiddleware);

// Initialize store with persistence
store.initialize({
  persist: {
    key: 'neoforge-state',
    whitelist: ['theme', 'settings', 'user'], // Only persist these keys
    blacklist: ['loading', 'error', 'notifications'] // Don't persist these
  }
});

// Set up event listeners for app state
window.addEventListener('online', () => {
  store.dispatch('SET_ONLINE', true);
});

window.addEventListener('offline', () => {
  store.dispatch('SET_ONLINE', false);
});

// PWA install events
window.addEventListener('pwa-install-available', () => {
  store.dispatch('ADD_NOTIFICATION', {
    type: 'info',
    title: 'Install App',
    message: 'Install NeoForge for a better experience!'
  });
});

window.addEventListener('pwa-update-available', () => {
  store.dispatch('SET_UPDATE_AVAILABLE', true);
  store.dispatch('ADD_NOTIFICATION', {
    type: 'info',
    title: 'Update Available',
    message: 'A new version is ready to install.'
  });
});

// Export selectors for common use cases
export const selectors = {
  user: state => state.user,
  isAuthenticated: state => state.isAuthenticated,
  theme: state => state.theme,
  loading: state => state.loading,
  error: state => state.error,
  notifications: state => state.notifications,
  currentRoute: state => state.currentRoute,
  isOnline: state => state.online,
  settings: state => state.settings
};
