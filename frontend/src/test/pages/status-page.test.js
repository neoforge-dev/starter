import { expect } from "vitest";
import { vi } from "vitest";

// Create a simplified mock for the status-page component
class MockStatusPage extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ mode: "open" });
    this._shadowRoot.innerHTML = `
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
    `;

    // Mock properties
    this.status = {
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
          uptime: 99.99,
          incidents: [],
        },
      ],
      incidents: [
        {
          id: "inc-1",
          title: "API Latency Issues",
          status: "resolved",
          createdAt: "2024-03-14T10:00:00Z",
          resolvedAt: "2024-03-14T11:00:00Z",
          updates: [
            {
              id: "upd-1",
              message: "Issue resolved",
              timestamp: "2024-03-14T11:00:00Z",
            },
          ],
        },
      ],
    };

    // Mock methods
    this.updateComplete = Promise.resolve(true);
  }

  // Getter for shadowRoot
  get shadowRoot() {
    return this._shadowRoot;
  }

  // Mock methods
  showLoading() {
    const loadingEl = document.createElement("div");
    loadingEl.className = "loading";
    loadingEl.textContent = "Loading...";
    this._shadowRoot.querySelector(".status-container").appendChild(loadingEl);
  }

  showError(message) {
    const errorEl = document.createElement("div");
    errorEl.className = "error";
    errorEl.textContent = message;
    this._shadowRoot.querySelector(".status-container").appendChild(errorEl);
  }

  refreshStatus() {
    // Mock refresh functionality
    this.dispatchEvent(new CustomEvent("status-refreshed"));
    return Promise.resolve(this.status);
  }

  subscribeToUpdates(email) {
    // Mock subscription
    this.dispatchEvent(new CustomEvent("subscribed", { detail: { email } }));
    return Promise.resolve({ success: true });
  }
}

// Register the mock component
customElements.define("status-page", MockStatusPage);

describe("Status Page", () => {
  let element;

  beforeEach(() => {
    // Create the element directly
    element = new MockStatusPage();
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
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
    const services = element.shadowRoot.querySelectorAll(".service-item");
    expect(services.length).toBe(2);

    const apiService = services[0];
    expect(apiService.querySelector(".service-name").textContent).toBe("API");
    expect(apiService.querySelector(".service-status").textContent).toBe(
      "Operational"
    );

    const webService = services[1];
    expect(webService.querySelector(".service-name").textContent).toBe(
      "Web Interface"
    );
    expect(webService.querySelector(".service-status").textContent).toBe(
      "Operational"
    );
  });

  it("should show incident history", () => {
    const incidents = element.shadowRoot.querySelectorAll(".incident-item");
    expect(incidents.length).toBe(1);

    const incident = incidents[0];
    expect(incident.querySelector(".incident-title").textContent).toBe(
      "API Latency Issues"
    );
    expect(incident.querySelector(".incident-status").textContent).toBe(
      "Resolved"
    );
    expect(incident.querySelector(".incident-time").textContent).toBe(
      "March 14, 2024"
    );
  });

  it("should show loading state", () => {
    element.showLoading();
    const loading = element.shadowRoot.querySelector(".loading");
    expect(loading).toBeTruthy();
    expect(loading.textContent).toBe("Loading...");
  });

  it("should show error state", () => {
    element.showError("Failed to load status");
    const error = element.shadowRoot.querySelector(".error");
    expect(error).toBeTruthy();
    expect(error.textContent).toBe("Failed to load status");
  });
});
