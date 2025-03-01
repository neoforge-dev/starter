import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";
import { performanceMonitor } from "../../services/performance-monitor.js";

/**
 * Performance monitoring dashboard
 * @customElement performance-dashboard
 */
export class PerformanceDashboard extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg);
      }

      .dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .metric-card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        position: relative;
        overflow: hidden;
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .metric-title {
        font-size: 1.1rem;
        font-weight: 500;
        margin: 0;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 600;
        margin: var(--spacing-sm) 0;
      }

      .metric-unit {
        font-size: 0.9rem;
        color: var(--color-text-secondary);
      }

      .metric-status {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .status-good {
        background: #22c55e;
      }

      .status-warning {
        background: #f59e0b;
      }

      .status-critical {
        background: #ef4444;
      }

      .budget-bar {
        height: 4px;
        background: var(--color-surface-hover);
        border-radius: var(--radius-full);
        margin-top: var(--spacing-md);
        overflow: hidden;
      }

      .budget-progress {
        height: 100%;
        background: var(--color-primary);
        transition: width var(--transition-normal);
      }

      .budget-warning {
        background: #f59e0b;
      }

      .budget-critical {
        background: #ef4444;
      }

      .history-graph {
        width: 100%;
        height: 60px;
        margin-top: var(--spacing-md);
      }

      .violations-list {
        margin-top: var(--spacing-lg);
      }

      .violation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        background: var(--color-surface-hover);
        margin-bottom: var(--spacing-sm);
      }

      .violation-metric {
        font-weight: 500;
      }

      .violation-time {
        font-size: 0.9rem;
        color: var(--color-text-secondary);
      }
    `,
  ];

  static properties = {
    _metrics: { type: Object, state: true },
    _violations: { type: Array, state: true },
    _history: { type: Object, state: true },
  };

  constructor() {
    super();
    this._metrics = {};
    this._violations = [];
    this._history = {};
    this._unsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = performanceMonitor.subscribe((metrics) => {
      this._metrics = metrics;
      this._updateHistory(metrics);
    });

    // Listen for budget violations
    window.addEventListener(
      "performance-budget-violation",
      this._handleViolation.bind(this)
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
    window.removeEventListener(
      "performance-budget-violation",
      this._handleViolation.bind(this)
    );
  }

  render() {
    return html`
      <div class="dashboard">
        ${this._renderCoreMetrics()} ${this._renderResourceMetrics()}
      </div>
      ${this._renderViolations()}
    `;
  }

  _renderCoreMetrics() {
    const coreMetrics = [
      {
        name: "FCP",
        value: this._metrics.fcp,
        unit: "ms",
        budget: 1800,
        description: "First Contentful Paint",
      },
      {
        name: "LCP",
        value: this._metrics.lcp,
        unit: "ms",
        budget: 2500,
        description: "Largest Contentful Paint",
      },
      {
        name: "FID",
        value: this._metrics.fid,
        unit: "ms",
        budget: 100,
        description: "First Input Delay",
      },
      {
        name: "CLS",
        value: this._metrics.cls,
        unit: "",
        budget: 0.1,
        description: "Cumulative Layout Shift",
      },
      {
        name: "TBT",
        value: this._metrics.tbt,
        unit: "ms",
        budget: 300,
        description: "Total Blocking Time",
      },
    ];

    return coreMetrics.map(
      (metric) => html`
        <div class="metric-card">
          <div
            class="metric-status ${this._getMetricStatus(
              metric.value,
              metric.budget
            )}"
          ></div>
          <div class="metric-header">
            <div>
              <h3 class="metric-title">${metric.name}</h3>
              <div class="metric-description">${metric.description}</div>
            </div>
          </div>
          <div class="metric-value">
            ${this._formatValue(metric.value)}
            <span class="metric-unit">${metric.unit}</span>
          </div>
          <div class="budget-bar">
            <div
              class="budget-progress ${this._getBudgetClass(
                metric.value,
                metric.budget
              )}"
              style="width: ${this._calculateProgress(
                metric.value,
                metric.budget
              )}%"
            ></div>
          </div>
          ${this._renderHistoryGraph(metric.name.toLowerCase())}
        </div>
      `
    );
  }

  _renderResourceMetrics() {
    const resources = ["script", "style", "image", "font", "other"];
    return resources.map(
      (type) => html`
        <div class="metric-card">
          <div class="metric-header">
            <h3 class="metric-title">${type} Resources</h3>
          </div>
          <div>
            <div>Count: ${this._metrics[`resourceCount_${type}`] || 0}</div>
            <div>
              Size:
              ${this._formatBytes(this._metrics[`resourceSize_${type}`] || 0)}
            </div>
            <div>
              Time:
              ${this._formatTime(this._metrics[`resourceTime_${type}`] || 0)}
            </div>
          </div>
        </div>
      `
    );
  }

  _renderViolations() {
    if (!this._violations.length) return null;

    return html`
      <div class="violations-list">
        <h3>Budget Violations</h3>
        ${this._violations.map(
          (violation) => html`
            <div class="violation-item">
              <span class="violation-metric"
                >${violation.metric}:
                ${this._formatValue(violation.value)}</span
              >
              <span class="violation-time"
                >${this._formatTimestamp(violation.timestamp)}</span
              >
            </div>
          `
        )}
      </div>
    `;
  }

  _renderHistoryGraph(metric) {
    if (!this._history[metric]) return null;

    const values = this._history[metric];
    const max = Math.max(...values);
    const points = values
      .map(
        (value, index) =>
          `${(index * 100) / (values.length - 1)},${
            100 - (value * 100) / (max || 1)
          }`
      )
      .join(" ");

    return html`
      <div class="history-graph">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <polyline
            points="${points}"
            fill="none"
            stroke="var(--color-primary)"
            stroke-width="2"
          />
        </svg>
      </div>
    `;
  }

  _handleViolation(event) {
    const violation = event.detail;
    this._violations = [violation, ...this._violations.slice(0, 9)];
  }

  _updateHistory(metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      if (!this._history[key]) {
        this._history[key] = [];
      }
      this._history[key].push(value);
      if (this._history[key].length > 50) {
        this._history[key].shift();
      }
    });
  }

  _getMetricStatus(value, budget) {
    if (!value || !budget) return "";
    const ratio = value / budget;
    if (ratio > 1) return "status-critical";
    if (ratio > 0.8) return "status-warning";
    return "status-good";
  }

  _getBudgetClass(value, budget) {
    if (!value || !budget) return "";
    const ratio = value / budget;
    if (ratio > 1) return "budget-critical";
    if (ratio > 0.8) return "budget-warning";
    return "";
  }

  _calculateProgress(value, budget) {
    if (!value || !budget) return 0;
    return Math.min((value / budget) * 100, 100);
  }

  _formatValue(value) {
    if (value == null) return "N/A";
    if (typeof value === "number") {
      return value.toFixed(2);
    }
    return value;
  }

  _formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  }

  _formatTime(ms) {
    if (!ms) return "0ms";
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  _formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }
}

customElements.define("performance-dashboard", PerformanceDashboard);
