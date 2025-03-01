import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import analytics from "../../services/analytics.js";

/**
 * Analytics Dashboard Component
 * Integrates performance metrics, error logs, and user behavior analytics
 * @element analytics-dashboard
 */
export class AnalyticsDashboard extends LitElement {
  static get properties() {
    return {
      activeTab: { type: String },
      timeRange: { type: String },
      performanceData: { type: Object },
      errorData: { type: Array },
      userBehaviorData: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: var(--surface-color, #fff);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .dashboard {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color, #eee);
      }

      .title {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary-color, #333);
      }

      .tab-bar {
        display: flex;
        gap: 1rem;
        padding: 0 1rem;
        background: var(--surface-color, #fff);
        border-bottom: 1px solid var(--border-color, #eee);
      }

      .tab {
        padding: 1rem;
        cursor: pointer;
        color: var(--text-secondary-color, #666);
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }

      .tab:hover {
        color: var(--text-primary-color, #333);
      }

      .tab.active {
        color: var(--primary-color, #007bff);
        border-bottom-color: var(--primary-color, #007bff);
      }

      .content {
        flex: 1;
        overflow: hidden;
        position: relative;
      }

      .tab-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease;
      }

      .tab-content.active {
        opacity: 1;
        visibility: visible;
      }

      .time-range {
        margin-left: auto;
        padding: 0.5rem;
        border: 1px solid var(--border-color, #eee);
        border-radius: 4px;
        background: var(--input-background, #fff);
      }

      .time-range:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }

      .metric-card {
        height: 200px;
      }
    `;
  }

  constructor() {
    super();
    this.activeTab = "performance";
    this.timeRange = "24h";
    this.performanceData = new Map();
    this.errorData = [];
    this.userBehaviorData = {};
    this.unsubscribe = null;
  }

  async loadComponents() {
    // Load components only when needed
    await Promise.all([
      import("./performance-chart.js"),
      import("./error-log.js"),
      import("./user-behavior.js"),
    ]);
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadComponents();
    this.unsubscribe = analytics.subscribe(
      this.handleAnalyticsUpdate.bind(this)
    );
    this.updateData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleAnalyticsUpdate(type, data) {
    this.updateData();
  }

  updateData() {
    this.performanceData = {
      navigation: analytics.getPerformanceData("navigation", this.timeRange),
      paint: analytics.getPerformanceData("paint", this.timeRange),
      "layout-shift": analytics.getPerformanceData(
        "layout-shift",
        this.timeRange
      ),
    };
    this.errorData = analytics.getErrorData(this.timeRange);
    this.userBehaviorData = analytics.getUserBehaviorData(this.timeRange);
  }

  handleTabChange(tab) {
    this.activeTab = tab;
  }

  handleTimeRangeChange(e) {
    this.timeRange = e.target.value;
    this.updateData();
  }

  renderPerformanceTab() {
    const metrics = ["navigation", "paint", "layout-shift"];

    return html`
      <div class="metrics-grid">
        ${metrics.map(
          (metric) => html`
            <div class="metric-card">
              <performance-chart
                .data=${this.performanceData[metric] || []}
                .metric=${metric}
                .timeRange=${this.timeRange}
              ></performance-chart>
            </div>
          `
        )}
      </div>
    `;
  }

  renderErrorTab() {
    return html`
      <error-log
        .errors=${this.errorData}
        .timeRange=${this.timeRange}
      ></error-log>
    `;
  }

  renderBehaviorTab() {
    return html`
      <user-behavior
        .data=${this.userBehaviorData}
        .timeRange=${this.timeRange}
      ></user-behavior>
    `;
  }

  render() {
    return html`
      <div class="dashboard">
        <div class="header">
          <h2 class="title">Analytics Dashboard</h2>
        </div>

        <div class="tab-bar">
          <div
            class="tab ${this.activeTab === "performance" ? "active" : ""}"
            @click=${() => this.handleTabChange("performance")}
          >
            Performance
          </div>
          <div
            class="tab ${this.activeTab === "errors" ? "active" : ""}"
            @click=${() => this.handleTabChange("errors")}
          >
            Errors
          </div>
          <div
            class="tab ${this.activeTab === "behavior" ? "active" : ""}"
            @click=${() => this.handleTabChange("behavior")}
          >
            User Behavior
          </div>

          <select
            class="time-range"
            .value=${this.timeRange}
            @change=${this.handleTimeRangeChange}
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <div class="content">
          <div
            class="tab-content ${this.activeTab === "performance"
              ? "active"
              : ""}"
          >
            ${this.renderPerformanceTab()}
          </div>
          <div
            class="tab-content ${this.activeTab === "errors" ? "active" : ""}"
          >
            ${this.renderErrorTab()}
          </div>
          <div
            class="tab-content ${this.activeTab === "behavior" ? "active" : ""}"
          >
            ${this.renderBehaviorTab()}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("analytics-dashboard", AnalyticsDashboard);
