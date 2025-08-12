import {   LitElement, html, css   } from 'lit';

/**
 * User Behavior Analytics Component
 * Displays user interaction data and patterns
 * @element user-behavior
 */
export class UserBehavior extends LitElement {
  static get properties() {
    return {
      data: { type: Object },
      selectedMetric: { type: String },
      timeRange: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .behavior-analytics {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .controls {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: var(--surface-color, #fff);
        border-bottom: 1px solid var(--border-color, #eee);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }

      .metric-card {
        background: var(--surface-color, #fff);
        border: 1px solid var(--border-color, #eee);
        border-radius: 4px;
        padding: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .metric-card:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .metric-title {
        font-size: 0.875rem;
        color: var(--text-secondary-color, #666);
        margin-bottom: 0.5rem;
      }

      .metric-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--text-primary-color, #333);
      }

      .metric-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }

      .trend-up {
        color: var(--success-color, #28a745);
      }

      .trend-down {
        color: var(--error-color, #dc3545);
      }

      .details-section {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }

      .interaction-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .interaction-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: var(--surface-color, #fff);
        border: 1px solid var(--border-color, #eee);
        border-radius: 4px;
      }

      .interaction-path {
        font-family: monospace;
        color: var(--text-secondary-color, #666);
      }

      .interaction-count {
        font-weight: bold;
        color: var(--text-primary-color, #333);
      }

      select {
        padding: 0.5rem;
        border: 1px solid var(--border-color, #eee);
        border-radius: 4px;
        background: var(--input-background, #fff);
      }

      select:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
      }

      .no-data {
        text-align: center;
        color: var(--text-secondary-color, #666);
        padding: 2rem;
      }
    `;
  }

  constructor() {
    super();
    this.data = {
      pageViews: [],
      interactions: [],
      sessions: [],
    };
    this.selectedMetric = "pageViews";
    this.timeRange = "24h";
  }

  handleMetricChange(e) {
    this.selectedMetric = e.target.value;
  }

  handleTimeRangeChange(e) {
    this.timeRange = e.target.value;
  }

  calculateTrend(current, previous) {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }

  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  renderMetricCard(title, value, previousValue) {
    const trend = this.calculateTrend(value, previousValue);

    return html`
      <div class="metric-card">
        <div class="metric-title">${title}</div>
        <div class="metric-value">${this.formatNumber(value)}</div>
        ${trend !== 0
          ? html`
              <div
                class="metric-trend ${trend > 0 ? "trend-up" : "trend-down"}"
              >
                ${trend > 0 ? "↑" : "↓"} ${Math.abs(trend).toFixed(1)}%
              </div>
            `
          : ""}
      </div>
    `;
  }

  renderInteractionList(interactions) {
    return html`
      <div class="interaction-list">
        ${interactions.map(
          (interaction) => html`
            <div class="interaction-item">
              <span class="interaction-path">${interaction.path}</span>
              <span class="interaction-count"
                >${this.formatNumber(interaction.count)}</span
              >
            </div>
          `
        )}
      </div>
    `;
  }

  render() {
    if (!this.data) {
      return html`<div class="no-data">Loading...</div>`;
    }

    const { pageViews, interactions, sessions } = this.data;

    return html`
      <div class="behavior-analytics">
        <div class="controls">
          <select
            .value=${this.selectedMetric}
            @change=${this.handleMetricChange}
          >
            <option value="pageViews">Page Views</option>
            <option value="interactions">Interactions</option>
            <option value="sessions">Sessions</option>
          </select>
          <select
            .value=${this.timeRange}
            @change=${this.handleTimeRangeChange}
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <div class="metrics-grid">
          ${this.renderMetricCard(
            "Total Page Views",
            pageViews.current,
            pageViews.previous
          )}
          ${this.renderMetricCard(
            "Unique Interactions",
            interactions.current,
            interactions.previous
          )}
          ${this.renderMetricCard(
            "Active Sessions",
            sessions.current,
            sessions.previous
          )}
        </div>

        <div class="details-section">
          ${this.selectedMetric === "interactions"
            ? this.renderInteractionList(interactions.details)
            : ""}
        </div>
      </div>
    `;
  }
}

customElements.define("user-behavior", UserBehavior);
