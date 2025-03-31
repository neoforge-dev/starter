import { EventTarget } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

// Define event names
const STATE_CHANGED_EVENT = "state-changed";

export class Store extends EventTarget {
  constructor(initialState = {}) {
    super();
    this._state = new Proxy(initialState, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;
        this.dispatchEvent(
          new CustomEvent(STATE_CHANGED_EVENT, {
            detail: {
              property,
              value,
              oldValue,
              state: this._state,
            },
          })
        );
        return true;
      },
    });
  }

  get state() {
    return this._state;
  }

  /**
   * Directly set state properties. Consider using actions for complex updates.
   * @param {object} updates An object containing key-value pairs to update in the state.
   */
  setState(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this._state[key] = value;
    });
  }

  /**
   * Subscribe to state changes.
   * @param {function} callback A function to call when the state changes.
   * @returns {function} A function to unsubscribe from state changes.
   */
  subscribe(callback) {
    const handler = (e) => callback(e.detail);
    this.addEventListener(STATE_CHANGED_EVENT, handler);
    return () => this.removeEventListener(STATE_CHANGED_EVENT, handler);
  }

  /**
   * Dispatch an action to update the state.
   * @param {string} type The type of action to dispatch.
   * @param {any} payload The payload to pass to the action.
   */
  dispatch(type, payload) {
    if (typeof this.actions[type] === 'function') {
      this.actions[type](this._state, payload);
    } else {
      console.warn(`Action type ${type} is not defined.`);
    }
  }

  /**
   * Define actions to update the state.
   * @param {object} actions An object containing action functions.
   * Each function should accept the current state and a payload.
   */
  addActions(actions) {
    this.actions = { ...this.actions, ...actions };
  }
}

// Create a mixin for components to easily connect to the store
export const StoreMixin = (superClass) =>
  class extends superClass {
    constructor() {
      super();
      this._unsubscribe = null;
    }

    connectedCallback() {
      super.connectedCallback();
      if (this.stateChanged) {
        this._unsubscribe = store.subscribe(({ property, value, state }) =>
          this.stateChanged(property, value, state)
        );
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
    }
  };

// Create the application store with initial state
export const store = new Store({
  user: null,
  theme: "light",
  notifications: [],
  loading: false,
  error: null,
});

store.addActions({
  setTheme: (state, theme) => {
    state.theme = theme;
  },
  setLoading: (state, loading) => {
    state.loading = loading;
  },
  setError: (state, error) => {
    state.error = error;
  }
});
