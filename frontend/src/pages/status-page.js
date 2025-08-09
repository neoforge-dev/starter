import {   html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";
import { apiService } from "../services/api.js";

/**
 * @element status-page
 * @description Status page component with system health information
 */
export class StatusPage extends BaseComponent {
  static properties = {
    status: { type: Object },
    loading: { type: Boolean },
    error: { type: String },
    darkMode: { type: Boolean },
    selectedFilter: { type: String },
    subscribing: { type: Boolean },
    subscribed: { type: Boolean },
    email: { type: String },
  };

  constructor() {
    super();
    this.status = null;
    this.loading = true;
    this.error = null;
    this.darkMode = false;
    this.selectedFilter = "all";
    this.subscribing = false;
    this.subscribed = false;
    this.email = "";
    console.log("Initializing shadow root for STATUS-PAGE");
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("Connected callback for STATUS-PAGE");
    this._fetchStatus();
  }

  async _fetchStatus() {
    try {
      this.loading = true;
      this.status = await apiService.getSystemStatus();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
    }
  }

  _handleFilterChange(e) {
    console.log("Binding event handler _handleFilterChange for STATUS-PAGE");
    this.selectedFilter = e.target.value;
  }

  _handleEmailInput(e) {
    this.email = e.target.value;
  }

  async _handleSubscribe() {
    if (!this.email) {
      this.error = "Please enter a valid email address";
      return;
    }

    try {
      this.subscribing = true;
      this.error = null;
      
      await apiService.subscribeToStatusUpdates(this.email);
      
      this.subscribed = true;
      this.subscribing = false;
      
      // Show success message
      this.dispatchEvent(new CustomEvent('subscription-success', {
        detail: { email: this.email },
        bubbles: true
      }));
      
    } catch (error) {
      this.error = `Subscription failed: ${error.message}`;
      this.subscribing = false;
    }
  }

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .page-container {
        max-width: var(--content-width);
        margin: 0 auto;
      }

      .status-overview {
        background: var(--color-bg-light);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
      }

      .service-list {
        display: grid;
        gap: var(--spacing-md);
      }

      .service-item {
        background: var(--color-bg-light);
        border-radius: var(--border-radius);
        padding: var(--spacing-md);
      }

      .dark {
        background: var(--color-bg-dark);
        color: var(--color-text-dark);
      }

      .subscribe-section {
        background: var(--color-bg-light);
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        margin-top: var(--spacing-lg);
      }

      .subscribe-form {
        display: flex;
        gap: var(--spacing-md);
        align-items: flex-end;
        margin-top: var(--spacing-md);
      }

      .subscribe-form input {
        flex: 1;
        padding: var(--spacing-sm);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-sm);
      }

      .subscribe-form button {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: var(--border-radius-sm);
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .subscribe-form button:hover:not(:disabled) {
        background: var(--color-primary-dark);
      }

      .subscribe-form button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .success-message {
        color: var(--color-success);
        margin-top: var(--spacing-sm);
      }

      .error-message {
        color: var(--color-error);
        margin-top: var(--spacing-sm);
      }
    `,
  ];

  render() {
    console.log("Creating render root for STATUS-PAGE");
    return html`
      <div class="page-container ${this.darkMode ? "dark" : ""}">
        ${this.loading
          ? html`<div class="loading">Loading status...</div>`
          : this.error
            ? html`<div class="error">${this.error}</div>`
            : html`
                <div class="status-overview">
                  <h1>System Status</h1>
                  <div class="overall-status">
                    <h2>Overall: ${this.status?.overall}</h2>
                    <p>Last updated: ${this.status?.lastUpdated}</p>
                    <p>Uptime: ${this.status?.uptime}%</p>
                  </div>
                </div>

                <div class="filter-section">
                  <select @change=${this._handleFilterChange}>
                    <option value="all">All Services</option>
                    <option value="operational">Operational</option>
                    <option value="issues">With Issues</option>
                  </select>
                </div>

                <div class="service-list">
                  ${this.status?.services
                    .filter(
                      (service) =>
                        this.selectedFilter === "all" ||
                        (this.selectedFilter === "operational" &&
                          service.status === "operational") ||
                        (this.selectedFilter === "issues" &&
                          service.status !== "operational")
                    )
                    .map(
                      (service) => html`
                        <div class="service-item">
                          <h3>${service.name}</h3>
                          <p>Status: ${service.status}</p>
                          <p>Uptime: ${service.uptime}%</p>
                        </div>
                      `
                    )}
                </div>

                <div class="incidents-section">
                  <h2>Recent Incidents</h2>
                  ${this.status?.incidents.map(
                    (incident) => html`
                      <div class="incident-item">
                        <h3>${incident.title}</h3>
                        <p>Status: ${incident.status}</p>
                        <p>Created: ${incident.createdAt}</p>
                        ${incident.resolvedAt
                          ? html`<p>Resolved: ${incident.resolvedAt}</p>`
                          : ""}
                      </div>
                    `
                  )}
                </div>

                <div class="subscribe-section">
                  <h2>Stay Updated</h2>
                  <p>Get notified about system status changes and maintenance windows.</p>
                  
                  ${this.subscribed
                    ? html`
                        <div class="success-message">
                          ✅ Successfully subscribed! You'll receive updates at ${this.email}
                        </div>
                      `
                    : html`
                        <div class="subscribe-form">
                          <div>
                            <label for="email">Email Address</label>
                            <input
                              id="email"
                              type="email"
                              placeholder="your@email.com"
                              .value=${this.email}
                              @input=${this._handleEmailInput}
                              ?disabled=${this.subscribing}
                            />
                          </div>
                          <button
                            @click=${this._handleSubscribe}
                            ?disabled=${this.subscribing || !this.email}
                          >
                            ${this.subscribing ? "Subscribing..." : "Subscribe"}
                          </button>
                        </div>
                        
                        ${this.error && !this.loading
                          ? html`<div class="error-message">${this.error}</div>`
                          : ""
                        }
                      `
                  }
                </div>
              `}
      </div>
    `;
  }
}

customElements.define("status-page", StatusPage);
