import {  LitElement, html, css  } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import { baseStyles } from "../../styles/base.js";

export class Charts extends LitElement {
  static properties = {
    type: { type: String }, // line, bar, pie, donut
    data: { type: Array },
    labels: { type: Array },
    options: { type: Object },
    width: { type: Number },
    height: { type: Number },
    loading: { type: Boolean },
  };

  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
        position: relative;
      }

      .chart-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      canvas {
        width: 100%;
        height: 100%;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(var(--surface-color-rgb), 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tooltip {
        position: absolute;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-sm);
        box-shadow: var(--shadow-md);
        pointer-events: none;
        opacity: 0;
        transition: opacity var(--transition-fast);
      }

      .tooltip.visible {
        opacity: 1;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: var(--font-size-sm);
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: var(--radius-sm);
      }
    `,
  ];

  constructor() {
    super();
    this.type = "line";
    this.data = [];
    this.labels = [];
    this.options = {};
    this.width = 600;
    this.height = 400;
    this.loading = false;
    this._canvas = null;
    this._ctx = null;
    this._tooltip = null;
    this._chart = null;
    this._colors = [
      "#2563eb",
      "#7c3aed",
      "#db2777",
      "#dc2626",
      "#d97706",
      "#059669",
      "#0891b2",
    ];
  }

  firstUpdated() {
    this._setupCanvas();
    this._setupTooltip();
    this.renderChart();
  }

  updated(changedProps) {
    if (
      changedProps.has("data") ||
      changedProps.has("type") ||
      changedProps.has("options")
    ) {
      this.renderChart();
    }
  }

  _setupCanvas() {
    this._canvas = this.shadowRoot.querySelector("canvas");
    this._ctx = this._canvas.getContext("2d");
    this._canvas.width = this.width;
    this._canvas.height = this.height;
  }

  _setupTooltip() {
    this._tooltip = this.shadowRoot.querySelector(".tooltip");
    this._canvas.addEventListener("mousemove", (e) => this._handleMouseMove(e));
    this._canvas.addEventListener("mouseleave", () => this._hideTooltip());
  }

  _handleMouseMove(e) {
    const rect = this._canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find nearest data point
    const dataPoint = this._findNearestDataPoint(x, y);
    if (dataPoint) {
      this._showTooltip(dataPoint, e.clientX, e.clientY);
    } else {
      this._hideTooltip();
    }
  }

  _findNearestDataPoint(x, y) {
    // Implementation depends on chart type
    switch (this.type) {
      case "line":
        return this._findNearestLinePoint(x, y);
      case "bar":
        return this._findNearestBarPoint(x, y);
      case "pie":
      case "donut":
        return this._findNearestPiePoint(x, y);
      default:
        return null;
    }
  }

  _showTooltip(dataPoint, clientX, clientY) {
    if (!this._tooltip) return;

    const rect = this._canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    this._tooltip.innerHTML = `
      <div class="tooltip-label">${dataPoint.label}</div>
      <div class="tooltip-value">${dataPoint.value}</div>
    `;

    this._tooltip.style.left = `${x + 10}px`;
    this._tooltip.style.top = `${y + 10}px`;
    this._tooltip.classList.add("visible");
  }

  _hideTooltip() {
    if (this._tooltip) {
      this._tooltip.classList.remove("visible");
    }
  }

  renderChart() {
    if (!this._ctx) return;

    // Clear previous chart
    this._ctx.clearRect(0, 0, this.width, this.height);

    switch (this.type) {
      case "line":
        this._renderLineChart();
        break;
      case "bar":
        this._renderBarChart();
        break;
      case "pie":
        this._renderPieChart(false);
        break;
      case "donut":
        this._renderPieChart(true);
        break;
    }
  }

  _renderLineChart() {
    const ctx = this._ctx;
    const padding = 40;
    const chartWidth = this.width - padding * 2;
    const chartHeight = this.height - padding * 2;

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, this.height - padding);
    ctx.lineTo(this.width - padding, this.height - padding);
    ctx.strokeStyle = getComputedStyle(this).getPropertyValue("--border-color");
    ctx.stroke();

    // Draw data lines
    if (this.data.length > 0) {
      const xStep = chartWidth / (this.data.length - 1);
      const maxValue = Math.max(...this.data);
      const yScale = chartHeight / maxValue;

      ctx.beginPath();
      ctx.moveTo(padding, this.height - padding - this.data[0] * yScale);

      this.data.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = this.height - padding - value * yScale;
        ctx.lineTo(x, y);
      });

      ctx.strokeStyle = this._colors[0];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw points
      this.data.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = this.height - padding - value * yScale;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this._colors[0];
        ctx.fill();
      });
    }
  }

  _renderBarChart() {
    const ctx = this._ctx;
    const padding = 40;
    const chartWidth = this.width - padding * 2;
    const chartHeight = this.height - padding * 2;

    if (this.data.length > 0) {
      const barWidth = (chartWidth / this.data.length) * 0.8;
      const maxValue = Math.max(...this.data);
      const yScale = chartHeight / maxValue;

      this.data.forEach((value, index) => {
        const x = padding + (chartWidth / this.data.length) * index;
        const y = this.height - padding - value * yScale;
        const height = value * yScale;

        ctx.fillStyle = this._colors[index % this._colors.length];
        ctx.fillRect(x, y, barWidth, height);
      });
    }
  }

  _renderPieChart(isDonut = false) {
    const ctx = this._ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    const total = this.data.reduce((sum, value) => sum + value, 0);
    let startAngle = 0;

    this.data.forEach((value, index) => {
      const sliceAngle = (2 * Math.PI * value) / total;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();

      ctx.fillStyle = this._colors[index % this._colors.length];
      ctx.fill();

      if (isDonut) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle =
          getComputedStyle(this).getPropertyValue("--surface-color");
        ctx.fill();
      }

      startAngle += sliceAngle;
    });
  }

  render() {
    return html`
      <div
        class="chart-container"
        style="width: ${this.width}px; height: ${this.height}px;"
      >
        <canvas></canvas>
        <div class="tooltip"></div>
        ${this.loading
          ? html`
              <div class="loading-overlay">
                <neo-spinner></neo-spinner>
              </div>
            `
          : ""}
      </div>
      <div class="legend">
        ${this.labels.map(
          (label, index) => html`
            <div class="legend-item">
              <div
                class="legend-color"
                style="background-color: ${this._colors[
                  index % this._colors.length
                ]}"
              ></div>
              <span>${label}</span>
            </div>
          `
        )}
      </div>
    `;
  }
}

customElements.define("neo-charts", Charts);
