import {  html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { BaseComponent } from "../components/base-component.js";
import { baseStyles } from "../styles/base.js";

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
  };

  constructor() {
    super();
    this.status = null;
    this.loading = true;
    this.error = null;
    this.darkMode = false;
    this.selectedFilter = "all";
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
      this.status = await window.status.getStatus();
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

  _handleSubscribe() {
    console.log("Binding event handler _handleSubscribe for STATUS-PAGE");
    // TODO: Implement subscription logic
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
                  <button @click=${this._handleSubscribe}>
                    Subscribe to Updates
                  </button>
                </div>
              `}
      </div>
    `;
  }
}

customElements.define("status-page", StatusPage);
