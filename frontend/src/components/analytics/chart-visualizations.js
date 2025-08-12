import { LitElement, html, css } from 'lit';

/**
 * Chart Visualizations Component
 * Integrates Chart.js for advanced analytics visualizations
 * @element chart-visualizations
 */
export class ChartVisualizations extends LitElement {
  static get properties() {
    return {
      chartType: { type: String },
      data: { type: Object },
      options: { type: Object },
      width: { type: Number },
      height: { type: Number },
      responsive: { type: Boolean },
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
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 300px;
      }

      .chart-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-secondary-color, #666);
        font-style: italic;
      }

      .chart-error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--error-color, #dc3545);
        font-style: italic;
        flex-direction: column;
        gap: 1rem;
      }

      .retry-button {
        padding: 0.5rem 1rem;
        background: var(--primary-color, #007bff);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
      }

      .retry-button:hover {
        background: var(--primary-hover-color, #0056b3);
      }

      canvas {
        max-width: 100%;
        max-height: 100%;
      }
    `;
  }

  constructor() {
    super();
    this.chartType = 'line';
    this.data = {};
    this.options = {};
    this.width = null;
    this.height = null;
    this.responsive = true;
    this.chart = null;
    this.isLoading = false;
    this.hasError = false;
    this.chartLibraryLoaded = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.loadChartLibrary();
    this.renderChart();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyChart();
  }

  async loadChartLibrary() {
    if (this.chartLibraryLoaded || window.Chart) {
      this.chartLibraryLoaded = true;
      return;
    }

    try {
      this.isLoading = true;
      this.requestUpdate();

      // Load Chart.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js';
      script.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          this.chartLibraryLoaded = true;
          this.isLoading = false;
          this.hasError = false;
          resolve();
        };
        script.onerror = () => {
          this.isLoading = false;
          this.hasError = true;
          reject(new Error('Failed to load Chart.js'));
        };
        document.head.appendChild(script);
      });
      
      this.requestUpdate();
    } catch (error) {
      console.error('Error loading Chart.js:', error);
      this.hasError = true;
      this.isLoading = false;
      this.requestUpdate();
    }
  }

  async updated(changedProperties) {
    if (changedProperties.has('data') || changedProperties.has('chartType') || changedProperties.has('options')) {
      await this.renderChart();
    }
  }

  async renderChart() {
    if (!this.chartLibraryLoaded || !window.Chart || !this.data || Object.keys(this.data).length === 0) {
      return;
    }

    // Destroy existing chart
    this.destroyChart();

    const canvas = this.shadowRoot.querySelector('canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    try {
      const config = this.buildChartConfig();
      this.chart = new window.Chart(ctx, config);
      this.hasError = false;
    } catch (error) {
      console.error('Error creating chart:', error);
      this.hasError = true;
      this.requestUpdate();
    }
  }

  buildChartConfig() {
    const defaultOptions = {
      responsive: this.responsive,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
        }
      },
      scales: this.getScalesConfig()
    };

    return {
      type: this.chartType,
      data: this.data,
      options: { ...defaultOptions, ...this.options }
    };
  }

  getScalesConfig() {
    const commonScaleConfig = {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      ticks: {
        color: 'rgba(0, 0, 0, 0.7)',
        font: {
          size: 11
        }
      }
    };

    switch (this.chartType) {
      case 'line':
      case 'bar':
        return {
          x: commonScaleConfig,
          y: { 
            ...commonScaleConfig,
            beginAtZero: true
          }
        };
      case 'pie':
      case 'doughnut':
        return {};
      case 'radar':
        return {
          r: {
            ...commonScaleConfig,
            beginAtZero: true
          }
        };
      default:
        return {
          x: commonScaleConfig,
          y: { 
            ...commonScaleConfig,
            beginAtZero: true
          }
        };
    }
  }

  destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  handleRetry() {
    this.hasError = false;
    this.loadChartLibrary().then(() => {
      this.renderChart();
    });
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="chart-container">
          <div class="chart-loading">
            🔄 Loading Chart.js...
          </div>
        </div>
      `;
    }

    if (this.hasError) {
      return html`
        <div class="chart-container">
          <div class="chart-error">
            <div>⚠️ Failed to load chart visualization</div>
            <button class="retry-button" @click=${this.handleRetry}>
              Retry
            </button>
          </div>
        </div>
      `;
    }

    if (!this.data || Object.keys(this.data).length === 0) {
      return html`
        <div class="chart-container">
          <div class="chart-loading">
            📊 No data available for visualization
          </div>
        </div>
      `;
    }

    return html`
      <div class="chart-container">
        <canvas></canvas>
      </div>
    `;
  }
}

/**
 * Chart Data Builder - Utility functions for creating Chart.js compatible data
 */
export class ChartDataBuilder {
  
  /**
   * Build component usage chart data
   */
  static buildComponentUsageChart(componentUsageMap) {
    const components = Array.from(componentUsageMap.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      labels: components.map(c => c.name),
      datasets: [
        {
          label: 'Access Count',
          data: components.map(c => c.accessCount),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(99, 255, 132, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(255, 99, 255, 1)',
            'rgba(99, 255, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  /**
   * Build performance timeline chart data
   */
  static buildPerformanceTimelineChart(performanceMetrics) {
    const { componentSwitching, searchResponse } = performanceMetrics;
    
    const switchingData = componentSwitching.map(metric => ({
      x: new Date(metric.timestamp),
      y: metric.duration
    }));

    const searchData = searchResponse.map(metric => ({
      x: new Date(metric.timestamp),
      y: metric.responseTime
    }));

    return {
      datasets: [
        {
          label: 'Component Switch Time (ms)',
          data: switchingData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Search Response Time (ms)',
          data: searchData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          tension: 0.1
        }
      ]
    };
  }

  /**
   * Build search patterns chart data
   */
  static buildSearchPatternsChart(searchMetrics) {
    const queryFrequency = new Map();
    
    searchMetrics.forEach(search => {
      const count = queryFrequency.get(search.query) || 0;
      queryFrequency.set(search.query, count + 1);
    });

    const topQueries = Array.from(queryFrequency.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      labels: topQueries.map(item => item.query.substring(0, 20) + (item.query.length > 20 ? '...' : '')),
      datasets: [
        {
          label: 'Search Frequency',
          data: topQueries.map(item => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  /**
   * Build keyboard shortcuts usage chart
   */
  static buildKeyboardShortcutsChart(keyboardShortcuts) {
    const shortcuts = Array.from(keyboardShortcuts.values())
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    return {
      labels: shortcuts.map(shortcut => shortcut.shortcut),
      datasets: [
        {
          label: 'Usage Count',
          data: shortcuts.map(shortcut => shortcut.usage),
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  /**
   * Build property interactions heatmap-style chart
   */
  static buildPropertyInteractionsChart(propertyInteractions) {
    const interactions = Array.from(propertyInteractions.values())
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 15);

    return {
      labels: interactions.map(prop => `${prop.componentName}.${prop.property}`),
      datasets: [
        {
          label: 'Interactions',
          data: interactions.map(prop => prop.interactions),
          backgroundColor: interactions.map((_, index) => {
            const hue = (index * 137.508) % 360; // Golden angle approximation for good color distribution
            return `hsla(${hue}, 70%, 60%, 0.8)`;
          }),
          borderColor: interactions.map((_, index) => {
            const hue = (index * 137.508) % 360;
            return `hsla(${hue}, 70%, 50%, 1)`;
          }),
          borderWidth: 1
        }
      ]
    };
  }

  /**
   * Build session activity timeline
   */
  static buildSessionActivityChart(playgroundData) {
    const { componentUsage, searchMetrics } = playgroundData;
    
    // Create time buckets (hourly)
    const now = Date.now();
    const hoursAgo24 = now - (24 * 60 * 60 * 1000);
    const buckets = [];
    
    for (let i = 0; i < 24; i++) {
      const bucketStart = hoursAgo24 + (i * 60 * 60 * 1000);
      const bucketEnd = bucketStart + (60 * 60 * 1000);
      
      buckets.push({
        label: new Date(bucketStart).getHours() + ':00',
        componentUsage: 0,
        searches: 0,
        timestamp: bucketStart
      });
    }

    // Fill buckets with data
    Array.from(componentUsage.values()).forEach(component => {
      if (component.lastAccess >= hoursAgo24) {
        const bucketIndex = Math.floor((component.lastAccess - hoursAgo24) / (60 * 60 * 1000));
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].componentUsage += component.accessCount;
        }
      }
    });

    searchMetrics.forEach(search => {
      if (search.timestamp >= hoursAgo24) {
        const bucketIndex = Math.floor((search.timestamp - hoursAgo24) / (60 * 60 * 1000));
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].searches += 1;
        }
      }
    });

    return {
      labels: buckets.map(bucket => bucket.label),
      datasets: [
        {
          label: 'Component Usage',
          data: buckets.map(bucket => bucket.componentUsage),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Search Queries',
          data: buckets.map(bucket => bucket.searches),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1'
        }
      ]
    };
  }
}

customElements.define("chart-visualizations", ChartVisualizations);