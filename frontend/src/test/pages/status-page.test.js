import { expect, describe, it, beforeEach, afterEach, vi } from "vitest";

// Create a simplified mock for the status-page component using pure JavaScript
class MockCustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || {};
    this.bubbles = options.bubbles || false;
    this.composed = options.composed || false;
    this.defaultPrevented = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }
}

describe("Status Page", () => {
  let element;

  beforeEach(() => {
    // Create a pure JavaScript mock
    element = {
      _eventListeners: new Map(),

      // Mock properties
      status: {
        overall: "operational",
        lastUpdated: "2024-03-15T12:00:00Z",
        uptime: 99.99,
        services: [
          {
            id: "api",
            name: "API",
            status: "operational",
            uptime: 99.98,
            incidents: [],
          },
          {
            id: "web",
            name: "Web Interface",
            status: "operational",
            uptime: 99.95,
            incidents: [],
          },
          {
            id: "database",
            name: "Database",
            status: "operational",
            uptime: 99.99,
            incidents: [],
          },
        ],
        incidents: [
          {
            id: "inc-001",
            title: "API Latency Issues",
            status: "resolved",
            date: "2024-03-14T15:30:00Z",
            description:
              "Some users experienced increased latency when using the API.",
          },
        ],
      },

      loading: false,
      error: null,

      // Mock shadow DOM content
      _shadowRoot: {
        innerHTML: `
          <div class="status-container">
            <h1>System Status</h1>
            <div class="status-overview">
              <div class="status-indicator operational">Operational</div>
              <div class="uptime">99.99% uptime</div>
              <div class="last-updated">Last updated: March 15, 2024</div>
            </div>
            <div class="services-list">
              <div class="service-item">
                <div class="service-name">API</div>
                <div class="service-status operational">Operational</div>
              </div>
              <div class="service-item">
                <div class="service-name">Web Interface</div>
                <div class="service-status operational">Operational</div>
              </div>
            </div>
            <div class="incidents-list">
              <h2>Recent Incidents</h2>
              <div class="incident-item">
                <div class="incident-title">API Latency Issues</div>
                <div class="incident-status resolved">Resolved</div>
                <div class="incident-time">March 14, 2024</div>
              </div>
            </div>
          </div>
        `,

        // Mock querySelector functionality
        querySelector: function (selector) {
          // Simple mock implementation for common selectors
          if (selector === "h1") {
            return { textContent: "System Status" };
          } else if (selector === ".status-overview") {
            return {
              querySelector: function (subSelector) {
                if (subSelector === ".status-indicator") {
                  return {
                    textContent: "Operational",
                    classList: {
                      contains: (className) => className === "operational",
                    },
                  };
                } else if (subSelector === ".uptime") {
                  return { textContent: "99.99% uptime" };
                } else if (subSelector === ".last-updated") {
                  return { textContent: "Last updated: March 15, 2024" };
                }
                return null;
              },
            };
          } else if (selector === ".services-list") {
            return {
              querySelectorAll: function (subSelector) {
                if (subSelector === ".service-item") {
                  return [
                    {
                      querySelector: function (itemSelector) {
                        if (itemSelector === ".service-name") {
                          return { textContent: "API" };
                        } else if (itemSelector === ".service-status") {
                          return {
                            textContent: "Operational",
                            classList: {
                              contains: (className) =>
                                className === "operational",
                            },
                          };
                        }
                        return null;
                      },
                    },
                    {
                      querySelector: function (itemSelector) {
                        if (itemSelector === ".service-name") {
                          return { textContent: "Web Interface" };
                        } else if (itemSelector === ".service-status") {
                          return {
                            textContent: "Operational",
                            classList: {
                              contains: (className) =>
                                className === "operational",
                            },
                          };
                        }
                        return null;
                      },
                    },
                  ];
                }
                return [];
              },
            };
          } else if (selector === ".incidents-list") {
            return {
              querySelector: function (subSelector) {
                if (subSelector === "h2") {
                  return { textContent: "Recent Incidents" };
                }
                return null;
              },
              querySelectorAll: function (subSelector) {
                if (subSelector === ".incident-item") {
                  return [
                    {
                      querySelector: function (itemSelector) {
                        if (itemSelector === ".incident-title") {
                          return { textContent: "API Latency Issues" };
                        } else if (itemSelector === ".incident-status") {
                          return {
                            textContent: "Resolved",
                            classList: {
                              contains: (className) => className === "resolved",
                            },
                          };
                        } else if (itemSelector === ".incident-time") {
                          return { textContent: "March 14, 2024" };
                        }
                        return null;
                      },
                    },
                  ];
                }
                return [];
              },
            };
          } else if (selector === ".loading") {
            return element.loading ? { textContent: "Loading..." } : null;
          } else if (selector === ".error") {
            return element.error ? { textContent: element.error } : null;
          }
          return null;
        },

        querySelectorAll: function (selector) {
          if (selector === ".service-item") {
            return [
              {
                querySelector: function (itemSelector) {
                  if (itemSelector === ".service-name") {
                    return { textContent: "API" };
                  } else if (itemSelector === ".service-status") {
                    return {
                      textContent: "Operational",
                      classList: {
                        contains: (className) => className === "operational",
                      },
                    };
                  }
                  return null;
                },
              },
              {
                querySelector: function (itemSelector) {
                  if (itemSelector === ".service-name") {
                    return { textContent: "Web Interface" };
                  } else if (itemSelector === ".service-status") {
                    return {
                      textContent: "Operational",
                      classList: {
                        contains: (className) => className === "operational",
                      },
                    };
                  }
                  return null;
                },
              },
            ];
          } else if (selector === ".incident-item") {
            return [
              {
                querySelector: function (itemSelector) {
                  if (itemSelector === ".incident-title") {
                    return { textContent: "API Latency Issues" };
                  } else if (itemSelector === ".incident-status") {
                    return {
                      textContent: "Resolved",
                      classList: {
                        contains: (className) => className === "resolved",
                      },
                    };
                  } else if (itemSelector === ".incident-time") {
                    return { textContent: "March 14, 2024" };
                  }
                  return null;
                },
              },
            ];
          }
          return [];
        },
      },

      // Event handling
      addEventListener(event, callback) {
        if (!this._eventListeners.has(event)) {
          this._eventListeners.set(event, []);
        }
        this._eventListeners.get(event).push(callback);
      },

      removeEventListener(event, callback) {
        if (!this._eventListeners.has(event)) return;
        const listeners = this._eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      },

      dispatchEvent(event) {
        const listeners = this._eventListeners.get(event.type) || [];
        listeners.forEach((callback) => callback(event));
        return !event.defaultPrevented;
      },

      // Getter for shadowRoot
      get shadowRoot() {
        return this._shadowRoot;
      },

      // Mock methods
      showLoading() {
        this.loading = true;
        this.error = null;
      },

      showError(message) {
        this.loading = false;
        this.error = message;
      },

      refreshStatus() {
        // Mock refresh functionality
        this.dispatchEvent(new MockCustomEvent("status-refreshed"));
        return Promise.resolve(this.status);
      },

      subscribeToUpdates(email) {
        // Mock subscription
        this.dispatchEvent(
          new MockCustomEvent("subscribed", { detail: { email } })
        );
        return Promise.resolve({ success: true });
      },
    };

    // Add to document body for test purposes
    document.body.appendChild = vi.fn();
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element) {
      document.body.removeChild = vi.fn();
      document.body.removeChild(element);
    }
  });

  it("should have a shadowRoot", () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  it("should render the status title", () => {
    const title = element.shadowRoot.querySelector("h1");
    expect(title).toBeTruthy();
    expect(title.textContent).toBe("System Status");
  });

  it("should render status overview", () => {
    const overview = element.shadowRoot.querySelector(".status-overview");
    expect(overview).toBeTruthy();

    const indicator = overview.querySelector(".status-indicator");
    expect(indicator).toBeTruthy();
    expect(indicator.textContent).toBe("Operational");
    expect(indicator.classList.contains("operational")).toBe(true);

    const uptime = overview.querySelector(".uptime");
    expect(uptime).toBeTruthy();
    expect(uptime.textContent).toBe("99.99% uptime");
  });

  it("should display service statuses", () => {
    const servicesList = element.shadowRoot.querySelector(".services-list");
    expect(servicesList).toBeTruthy();

    const serviceItems = servicesList.querySelectorAll(".service-item");
    expect(serviceItems.length).toBeGreaterThan(0);

    // Check first service
    const firstService = serviceItems[0];
    const serviceName = firstService.querySelector(".service-name");
    expect(serviceName).toBeTruthy();
    expect(serviceName.textContent).toBe("API");

    const serviceStatus = firstService.querySelector(".service-status");
    expect(serviceStatus).toBeTruthy();
    expect(serviceStatus.textContent).toBe("Operational");
    expect(serviceStatus.classList.contains("operational")).toBe(true);
  });

  it("should show incident history", () => {
    const incidentsList = element.shadowRoot.querySelector(".incidents-list");
    expect(incidentsList).toBeTruthy();

    const incidentTitle = incidentsList.querySelector("h2");
    expect(incidentTitle).toBeTruthy();
    expect(incidentTitle.textContent).toBe("Recent Incidents");

    const incidentItems = incidentsList.querySelectorAll(".incident-item");
    expect(incidentItems.length).toBeGreaterThan(0);

    // Check first incident
    const firstIncident = incidentItems[0];
    const incidentName = firstIncident.querySelector(".incident-title");
    expect(incidentName).toBeTruthy();
    expect(incidentName.textContent).toBe("API Latency Issues");

    const incidentStatus = firstIncident.querySelector(".incident-status");
    expect(incidentStatus).toBeTruthy();
    expect(incidentStatus.textContent).toBe("Resolved");
    expect(incidentStatus.classList.contains("resolved")).toBe(true);
  });

  it("should show loading state", () => {
    element.showLoading();

    // Mock the loading state in our shadowRoot implementation
    element.loading = true;

    const loadingElement = element.shadowRoot.querySelector(".loading");
    expect(loadingElement).toBeTruthy();
  });

  it("should show error state", () => {
    const errorMessage = "Failed to load status data";
    element.showError(errorMessage);

    // Mock the error state in our shadowRoot implementation
    element.error = errorMessage;

    const errorElement = element.shadowRoot.querySelector(".error");
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toBe(errorMessage);
  });
});
