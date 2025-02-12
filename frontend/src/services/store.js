import { EventTarget } from "/vendor/lit-core.min.js";

export class Store extends EventTarget {
  constructor(initialState = {}) {
    super();
    this._state = new Proxy(initialState, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;
        this.dispatchEvent(
          new CustomEvent("state-changed", {
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

  setState(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this._state[key] = value;
    });
  }

  subscribe(callback) {
    const handler = (e) => callback(e.detail);
    this.addEventListener("state-changed", handler);
    return () => this.removeEventListener("state-changed", handler);
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
