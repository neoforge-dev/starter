import {   LitElement, html, css   } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

/**
 * Performance Chart Component
 * Visualizes performance metrics over time
 * @element performance-chart
 */
export class PerformanceChart extends LitElement {
  static get properties() {
    return {
      data: { type: Array },
      metric: { type: String },
      timeRange: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .chart-container {
        width: 100%;
        height: 100%;
        position: relative;
      }

      canvas {
        width: 100% !important;
        height: 100% !important;
      }

      .loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--text-secondary-color, #666);
      }

      .no-data {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: var(--text-secondary-color, #666);
      }
    `;
  }

  constructor() {
    super();
    this.data = [];
    this.metric = "";
    this.timeRange = "24h";
    this.chart = null;
    this.Chart = null;
  }

  async firstUpdated() {
    // Dynamically import Chart.js only when needed
    const { Chart, registerables } = await import("chart.js");
    Chart.register(...registerables);
    this.Chart = Chart;

    this.initializeChart();
  }

  updated(changedProperties) {
    if (changedProperties.has("data") || changedProperties.has("timeRange")) {
      this.updateChart();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  initializeChart() {
    if (!this.Chart) return; // Chart.js not loaded yet
    
    const ctx = this.shadowRoot.querySelector("canvas").getContext("2d");

    this.chart = new this.Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: this.metric,
            data: [],
            borderColor: "rgb(75, 192, 192)",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300,
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: this.getTimeUnit(),
            },
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Value (ms)",
            },
          },
        },
        plugins: {
          tooltip: {
            mode: "index",
            intersect: false,
          },
          legend: {
            display: true,
            position: "top",
          },
        },
      },
    });

    this.updateChart();
  }

  updateChart() {
    if (!this.chart || !this.data.length) return;

    const sortedData = [...this.data].sort((a, b) => a.timestamp - b.timestamp);
    const labels = sortedData.map((d) => new Date(d.timestamp));
    const values = sortedData.map((d) => d.value);

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = values;
    this.chart.data.datasets[0].label = this.metric;

    this.chart.options.scales.x.time.unit = this.getTimeUnit();

    this.chart.update();
  }

  getTimeUnit() {
    switch (this.timeRange) {
      case "1h":
        return "minute";
      case "24h":
        return "hour";
      case "7d":
        return "day";
      case "30d":
        return "week";
      default:
        return "hour";
    }
  }

  render() {
    if (!this.data) {
      return html`<div class="loading">Loading...</div>`;
    }

    if (!this.data.length) {
      return html`<div class="no-data">
        <p>No data available</p>
        <p>Start collecting metrics to see the chart</p>
      </div>`;
    }

    return html`
      <div class="chart-container">
        <canvas></canvas>
      </div>
    `;
  }
}

customElements.define("performance-chart", PerformanceChart);
