import { LitElement, html, css } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import analytics from "../../services/analytics.js";
import { ChartDataBuilder } from "./chart-visualizations.js";

/**
 * Playground Analytics Dashboard Component
 * Provides comprehensive insights into playground usage, performance, and developer behavior
 * @element playground-analytics
 */
export class PlaygroundAnalytics extends LitElement {
  static get properties() {
    return {
      activeTab: { type: String },
      timeRange: { type: String },
      playgroundData: { type: Object },
      isVisible: { type: Boolean },
      refreshInterval: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: var(--surface-color, #fff);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .analytics-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .refresh-button, .export-button {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .refresh-button:hover, .export-button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .auto-refresh {
        font-size: 0.8rem;
        opacity: 0.8;
        margin-right: 1rem;
      }

      .tab-navigation {
        display: flex;
        background: var(--surface-color, #fff);
        border-bottom: 1px solid var(--border-color, #eee);
        overflow-x: auto;
      }

      .tab {
        padding: 1rem 1.5rem;
        cursor: pointer;
        color: var(--text-secondary-color, #666);
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;
        white-space: nowrap;
        position: relative;
      }

      .tab:hover {
        color: var(--text-primary-color, #333);
        background: var(--hover-color, #f8f9fa);
      }

      .tab.active {
        color: var(--primary-color, #667eea);
        border-bottom-color: var(--primary-color, #667eea);
        background: var(--selected-color, #f0f2ff);
      }

      .tab-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: var(--accent-color, #ff6b6b);
        color: white;
        border-radius: 10px;
        padding: 0.1rem 0.4rem;
        font-size: 0.7rem;
        min-width: 1.2rem;
        text-align: center;
      }

      .content-area {
        height: calc(100% - 120px);
        overflow-y: auto;
        padding: 1rem;
      }

      .metrics-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .summary-card {
        background: var(--surface-color, #fff);
        border: 1px solid var(--border-color, #eee);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .summary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .card-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        display: block;
      }

      .card-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary-color, #333);
        line-height: 1;
        margin-bottom: 0.25rem;
      }

      .card-label {
        font-size: 0.9rem;
        color: var(--text-secondary-color, #666);
        margin-bottom: 0.5rem;
      }

      .card-trend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .trend-positive {
        color: var(--success-color, #28a745);
      }

      .trend-negative {
        color: var(--error-color, #dc3545);
      }

      .trend-neutral {
        color: var(--text-secondary-color, #666);
      }

      .detailed-section {
        background: var(--surface-color, #fff);
        border: 1px solid var(--border-color, #eee);
        border-radius: 8px;
        overflow: hidden;
      }

      .section-header {
        background: var(--light-background, #f8f9fa);
        padding: 1rem;
        border-bottom: 1px solid var(--border-color, #eee);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .section-title {
        font-weight: 600;
        color: var(--text-primary-color, #333);
        margin: 0;
      }

      .section-content {
        padding: 1rem;
        max-height: 400px;
        overflow-y: auto;
      }

      .component-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .component-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: var(--item-background, #f8f9fa);
        border-radius: 6px;
        transition: background-color 0.2s ease;
      }

      .component-item:hover {
        background: var(--hover-color, #e9ecef);
      }

      .component-info {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .component-name {
        font-weight: 500;
        color: var(--text-primary-color, #333);
        margin-bottom: 0.25rem;
      }

      .component-category {
        font-size: 0.8rem;
        color: var(--text-secondary-color, #666);
      }

      .component-stats {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .stat-value {
        font-weight: 600;
        color: var(--text-primary-color, #333);
        font-size: 0.9rem;
      }

      .stat-label {
        font-size: 0.7rem;
        color: var(--text-secondary-color, #666);
        margin-top: 0.1rem;
      }

      .chart-container {
        height: 300px;
        margin: 1rem 0;
        padding: 1rem;
        background: var(--surface-color, #fff);
        border-radius: 8px;
        position: relative;
      }

      .chart-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-secondary-color, #666);
        font-style: italic;
      }

      .time-range-selector {
        background: var(--input-background, #fff);
        border: 1px solid var(--border-color, #ddd);
        border-radius: 4px;
        padding: 0.5rem;
        font-size: 0.9rem;
      }

      .time-range-selector:focus {
        outline: none;
        border-color: var(--primary-color, #667eea);
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }

      .no-data {
        text-align: center;
        color: var(--text-secondary-color, #666);
        padding: 3rem 1rem;
        font-style: italic;
      }

      @media (max-width: 768px) {
        .metrics-summary {
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .summary-card {
          padding: 1rem;
        }

        .card-value {
          font-size: 1.5rem;
        }

        .component-stats {
          gap: 0.5rem;
        }

        .tab {
          padding: 0.75rem 1rem;
        }
      }
    `;
  }

  constructor() {
    super();
    this.activeTab = "overview";
    this.timeRange = "24h";
    this.playgroundData = {};
    this.isVisible = false;
    this.refreshInterval = 30000; // 30 seconds
    this.unsubscribe = null;
    this.autoRefreshTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = analytics.subscribe(this.handleAnalyticsUpdate.bind(this));
    this.updateData();
    this.startAutoRefresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.stopAutoRefresh();
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefreshTimer = setInterval(() => {
      if (this.isVisible) {
        this.updateData();
      }
    }, this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  handleAnalyticsUpdate() {
    if (this.isVisible) {
      this.updateData();
    }
  }

  updateData() {
    this.playgroundData = analytics.getPlaygroundData(this.timeRange);
    this.requestUpdate();
  }

  handleTabChange(tab) {
    this.activeTab = tab;
  }

  handleTimeRangeChange(e) {
    this.timeRange = e.target.value;
    this.updateData();
  }

  handleRefresh() {
    this.updateData();
    // Visual feedback
    const button = this.shadowRoot.querySelector('.refresh-button');
    button.textContent = '⏳ Refreshing...';
    setTimeout(() => {
      button.textContent = '🔄 Refresh';
    }, 1000);
  }

  handleExport(format = 'json') {
    const exportData = analytics.exportData(format, this.timeRange);
    
    if (format === 'json') {
      this.downloadFile(exportData, `playground-analytics-${Date.now()}.json`, 'application/json');
    } else if (format === 'csv') {
      // Export component usage CSV
      this.downloadFile(exportData.componentUsage, `component-usage-${Date.now()}.csv`, 'text/csv');
    }
  }

  downloadFile(data, filename, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  renderOverviewTab() {
    const { componentUsage, searchMetrics, performanceMetrics, sessionDuration } = this.playgroundData;
    
    const totalComponents = componentUsage ? componentUsage.size : 0;
    const totalSearches = searchMetrics ? searchMetrics.length : 0;
    const avgSwitchTime = performanceMetrics?.componentSwitching?.length > 0 
      ? performanceMetrics.componentSwitching.reduce((acc, metric) => acc + metric.duration, 0) / performanceMetrics.componentSwitching.length 
      : 0;

    return html`
      <div class="metrics-summary">
        <div class="summary-card">
          <span class="card-icon">🧩</span>
          <div class="card-value">${totalComponents}</div>
          <div class="card-label">Components Used</div>
          <div class="card-trend trend-positive">
            📈 Active session
          </div>
        </div>

        <div class="summary-card">
          <span class="card-icon">🔍</span>
          <div class="card-value">${totalSearches}</div>
          <div class="card-label">Search Queries</div>
          <div class="card-trend trend-neutral">
            ${searchMetrics?.length > 0 ? `Avg ${(searchMetrics.reduce((acc, s) => acc + (s.responseTime || 0), 0) / searchMetrics.length).toFixed(0)}ms` : 'No data'}
          </div>
        </div>

        <div class="summary-card">
          <span class="card-icon">⚡</span>
          <div class="card-value">${avgSwitchTime.toFixed(0)}ms</div>
          <div class="card-label">Avg Switch Time</div>
          <div class="card-trend ${avgSwitchTime < 100 ? 'trend-positive' : 'trend-negative'}">
            ${avgSwitchTime < 100 ? '🟢 Fast' : '🟡 Could be faster'}
          </div>
        </div>

        <div class="summary-card">
          <span class="card-icon">⏱️</span>
          <div class="card-value">${Math.round((sessionDuration?.current || 0) / 60000)}m</div>
          <div class="card-label">Session Duration</div>
          <div class="card-trend trend-positive">
            🔥 Active learning
          </div>
        </div>
      </div>

      ${this.renderMostUsedComponents()}
      ${this.renderComponentUsageChart()}
    `;
  }

  renderMostUsedComponents() {
    const { componentUsage } = this.playgroundData;
    
    if (!componentUsage || componentUsage.size === 0) {
      return html`<div class="no-data">No component usage data available yet.</div>`;
    }

    const sortedComponents = Array.from(componentUsage.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return html`
      <div class="detailed-section">
        <div class="section-header">
          <h3 class="section-title">Most Used Components</h3>
          <span class="section-meta">${componentUsage.size} total</span>
        </div>
        <div class="section-content">
          <div class="component-list">
            ${sortedComponents.map((component, index) => html`
              <div class="component-item">
                <div class="component-info">
                  <div class="component-name">
                    ${index === 0 ? '🏆 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : ''}
                    ${component.name}
                  </div>
                  <div class="component-category">${component.category}</div>
                </div>
                <div class="component-stats">
                  <div class="stat">
                    <div class="stat-value">${component.accessCount}</div>
                    <div class="stat-label">Uses</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${Math.round(component.totalTime / 1000)}s</div>
                    <div class="stat-label">Time</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${component.lastAccess ? new Date(component.lastAccess).toLocaleTimeString() : 'N/A'}</div>
                    <div class="stat-label">Last Used</div>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  renderPerformanceTab() {
    const { performanceMetrics } = this.playgroundData;

    const avgSwitchTime = performanceMetrics?.componentSwitching?.length > 0 
      ? performanceMetrics.componentSwitching.reduce((acc, metric) => acc + metric.duration, 0) / performanceMetrics.componentSwitching.length 
      : 0;

    const avgSearchTime = performanceMetrics?.searchResponse?.length > 0
      ? performanceMetrics.searchResponse.reduce((acc, metric) => acc + metric.responseTime, 0) / performanceMetrics.searchResponse.length
      : 0;

    return html`
      <div class="metrics-summary">
        <div class="summary-card">
          <span class="card-icon">🚀</span>
          <div class="card-value">${performanceMetrics?.componentSwitching?.length || 0}</div>
          <div class="card-label">Component Switches</div>
          <div class="card-trend ${avgSwitchTime < 100 ? 'trend-positive' : 'trend-negative'}">
            Avg: ${avgSwitchTime.toFixed(1)}ms
          </div>
        </div>

        <div class="summary-card">
          <span class="card-icon">🔍</span>
          <div class="card-value">${performanceMetrics?.searchResponse?.length || 0}</div>
          <div class="card-label">Search Operations</div>
          <div class="card-trend ${avgSearchTime < 50 ? 'trend-positive' : 'trend-negative'}">
            Avg: ${avgSearchTime.toFixed(1)}ms
          </div>
        </div>

        <div class="summary-card">
          <span class="card-icon">🔨</span>
          <div class="card-value">${performanceMetrics?.buildTimes?.length || 0}</div>
          <div class="card-label">Build Operations</div>
        </div>

        <div class="summary-card">
          <span class="card-icon">💾</span>
          <div class="card-value">${performanceMetrics?.memoryUsage?.length || 0}</div>
          <div class="card-label">Memory Samples</div>
        </div>
      </div>

      <div class="chart-container">
        <chart-visualizations 
          .chartType=${"line"}
          .data=${ChartDataBuilder.buildPerformanceTimelineChart(performanceMetrics || {})}
          .options=${{
            plugins: {
              title: {
                display: true,
                text: 'Performance Timeline (Last 24 Hours)'
              }
            },
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'hour'
                },
                title: {
                  display: true,
                  text: 'Time'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Time (ms)'
                },
                beginAtZero: true
              }
            }
          }}
        ></chart-visualizations>
      </div>

      ${this.renderSessionActivityChart()}
    `;
  }

  renderBehaviorTab() {
    const { keyboardShortcuts, propertyInteractions, searchMetrics } = this.playgroundData;

    const totalShortcuts = keyboardShortcuts ? Array.from(keyboardShortcuts.values()).reduce((sum, shortcut) => sum + shortcut.usage, 0) : 0;
    const totalPropertyChanges = propertyInteractions ? Array.from(propertyInteractions.values()).reduce((sum, prop) => sum + prop.interactions, 0) : 0;

    return html`
      <div class="metrics-summary">
        <div class="summary-card">
          <span class="card-icon">⌨️</span>
          <div class="card-value">${totalShortcuts}</div>
          <div class="card-label">Keyboard Shortcuts</div>
          <div class="card-trend trend-positive">
            ${keyboardShortcuts ? keyboardShortcuts.size : 0} unique shortcuts
          </div>
        </div>

        <div class="summary-card">
          <span class="card-icon">🎛️</span>
          <div class="card-value">${totalPropertyChanges}</div>
          <div class="card-label">Property Changes</div>
          <div class="card-trend trend-positive">
            ${propertyInteractions ? propertyInteractions.size : 0} unique properties
          </div>
        </div>

        <div class="summary-card">
          <span class="card-icon">🎯</span>
          <div class="card-value">${searchMetrics ? new Set(searchMetrics.map(s => s.query)).size : 0}</div>
          <div class="card-label">Unique Searches</div>
          <div class="card-trend trend-neutral">
            ${searchMetrics?.length || 0} total queries
          </div>
        </div>
      </div>

      ${this.renderKeyboardShortcuts()}
      ${this.renderSearchPatterns()}
      ${this.renderKeyboardShortcutsChart()}
      ${this.renderPropertyInteractionsChart()}
    `;
  }

  renderKeyboardShortcuts() {
    const { keyboardShortcuts } = this.playgroundData;
    
    if (!keyboardShortcuts || keyboardShortcuts.size === 0) {
      return html``;
    }

    const sortedShortcuts = Array.from(keyboardShortcuts.values())
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 8);

    return html`
      <div class="detailed-section">
        <div class="section-header">
          <h3 class="section-title">Top Keyboard Shortcuts</h3>
        </div>
        <div class="section-content">
          <div class="component-list">
            ${sortedShortcuts.map(shortcut => html`
              <div class="component-item">
                <div class="component-info">
                  <div class="component-name">⌨️ ${shortcut.shortcut}</div>
                  <div class="component-category">Last used: ${shortcut.lastUsed ? new Date(shortcut.lastUsed).toLocaleString() : 'Never'}</div>
                </div>
                <div class="component-stats">
                  <div class="stat">
                    <div class="stat-value">${shortcut.usage}</div>
                    <div class="stat-label">Times Used</div>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  renderSearchPatterns() {
    const { searchMetrics } = this.playgroundData;
    
    if (!searchMetrics || searchMetrics.length === 0) {
      return html``;
    }

    const queryFrequency = new Map();
    searchMetrics.forEach(search => {
      const count = queryFrequency.get(search.query) || 0;
      queryFrequency.set(search.query, count + 1);
    });

    const topQueries = Array.from(queryFrequency.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return html`
      <div class="detailed-section">
        <div class="section-header">
          <h3 class="section-title">Search Patterns</h3>
        </div>
        <div class="section-content">
          <div class="component-list">
            ${topQueries.map(({ query, count }) => html`
              <div class="component-item">
                <div class="component-info">
                  <div class="component-name">🔍 "${query}"</div>
                  <div class="component-category">Search query</div>
                </div>
                <div class="component-stats">
                  <div class="stat">
                    <div class="stat-value">${count}</div>
                    <div class="stat-label">Times Searched</div>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  renderComponentUsageChart() {
    const { componentUsage } = this.playgroundData;
    
    if (!componentUsage || componentUsage.size === 0) {
      return html``;
    }

    return html`
      <div class="detailed-section">
        <div class="section-header">
          <h3 class="section-title">Component Usage Distribution</h3>
        </div>
        <div class="section-content">
          <div class="chart-container">
            <chart-visualizations 
              .chartType=${"doughnut"}
              .data=${ChartDataBuilder.buildComponentUsageChart(componentUsage)}
              .options=${{
                plugins: {
                  title: {
                    display: true,
                    text: 'Most Used Components'
                  },
                  legend: {
                    position: 'right'
                  }
                }
              }}
            ></chart-visualizations>
          </div>
        </div>
      </div>
    `;
  }

  renderSessionActivityChart() {
    return html`
      <div class="detailed-section" style="margin-top: 1rem;">
        <div class="section-header">
          <h3 class="section-title">Session Activity Timeline</h3>
        </div>
        <div class="section-content">
          <div class="chart-container">
            <chart-visualizations 
              .chartType=${"line"}
              .data=${ChartDataBuilder.buildSessionActivityChart(this.playgroundData)}
              .options=${{
                plugins: {
                  title: {
                    display: true,
                    text: 'Activity Over Time (24 Hours)'
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Component Usage'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Search Queries'
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  }
                }
              }}
            ></chart-visualizations>
          </div>
        </div>
      </div>
    `;
  }

  renderSearchPatternsChart() {
    const { searchMetrics } = this.playgroundData;
    
    if (!searchMetrics || searchMetrics.length === 0) {
      return html``;
    }

    return html`
      <div class="detailed-section" style="margin-top: 1rem;">
        <div class="section-header">
          <h3 class="section-title">Search Query Patterns</h3>
        </div>
        <div class="section-content">
          <div class="chart-container">
            <chart-visualizations 
              .chartType=${"bar"}
              .data=${ChartDataBuilder.buildSearchPatternsChart(searchMetrics)}
              .options=${{
                plugins: {
                  title: {
                    display: true,
                    text: 'Most Common Search Terms'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Frequency'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Search Query'
                    }
                  }
                }
              }}
            ></chart-visualizations>
          </div>
        </div>
      </div>
    `;
  }

  renderKeyboardShortcutsChart() {
    const { keyboardShortcuts } = this.playgroundData;
    
    if (!keyboardShortcuts || keyboardShortcuts.size === 0) {
      return html``;
    }

    return html`
      <div class="detailed-section" style="margin-top: 1rem;">
        <div class="section-header">
          <h3 class="section-title">Keyboard Shortcuts Usage</h3>
        </div>
        <div class="section-content">
          <div class="chart-container">
            <chart-visualizations 
              .chartType=${"horizontalBar"}
              .data=${ChartDataBuilder.buildKeyboardShortcutsChart(keyboardShortcuts)}
              .options=${{
                plugins: {
                  title: {
                    display: true,
                    text: 'Most Used Keyboard Shortcuts'
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Usage Count'
                    }
                  }
                }
              }}
            ></chart-visualizations>
          </div>
        </div>
      </div>
    `;
  }

  renderPropertyInteractionsChart() {
    const { propertyInteractions } = this.playgroundData;
    
    if (!propertyInteractions || propertyInteractions.size === 0) {
      return html``;
    }

    return html`
      <div class="detailed-section" style="margin-top: 1rem;">
        <div class="section-header">
          <h3 class="section-title">Property Interaction Heatmap</h3>
        </div>
        <div class="section-content">
          <div class="chart-container">
            <chart-visualizations 
              .chartType=${"bar"}
              .data=${ChartDataBuilder.buildPropertyInteractionsChart(propertyInteractions)}
              .options=${{
                plugins: {
                  title: {
                    display: true,
                    text: 'Most Modified Component Properties'
                  },
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Interaction Count'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Component.Property'
                    },
                    ticks: {
                      maxRotation: 45
                    }
                  }
                }
              }}
            ></chart-visualizations>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const componentCount = this.playgroundData.componentUsage?.size || 0;
    const searchCount = this.playgroundData.searchMetrics?.length || 0;
    const shortcutCount = this.playgroundData.keyboardShortcuts?.size || 0;

    return html`
      <div class="analytics-header">
        <h2 class="header-title">🎯 Playground Analytics</h2>
        <div class="header-actions">
          <span class="auto-refresh">Auto-refresh: ${this.refreshInterval / 1000}s</span>
          
          <select
            class="time-range-selector"
            .value=${this.timeRange}
            @change=${this.handleTimeRangeChange}
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button class="export-button" @click=${() => this.handleExport('json')}>
            📁 Export JSON
          </button>
          
          <button class="export-button" @click=${() => this.handleExport('csv')}>
            📊 Export CSV
          </button>
          
          <button class="refresh-button" @click=${this.handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div class="tab-navigation">
        <div
          class="tab ${this.activeTab === "overview" ? "active" : ""}"
          @click=${() => this.handleTabChange("overview")}
        >
          📊 Overview
          ${componentCount > 0 ? html`<span class="tab-badge">${componentCount}</span>` : ''}
        </div>
        <div
          class="tab ${this.activeTab === "performance" ? "active" : ""}"
          @click=${() => this.handleTabChange("performance")}
        >
          ⚡ Performance
        </div>
        <div
          class="tab ${this.activeTab === "behavior" ? "active" : ""}"
          @click=${() => this.handleTabChange("behavior")}
        >
          🎯 Behavior
          ${shortcutCount > 0 ? html`<span class="tab-badge">${shortcutCount}</span>` : ''}
        </div>
      </div>

      <div class="content-area">
        ${this.activeTab === "overview" ? this.renderOverviewTab() : ''}
        ${this.activeTab === "performance" ? this.renderPerformanceTab() : ''}
        ${this.activeTab === "behavior" ? this.renderBehaviorTab() : ''}
      </div>
    `;
  }
}

customElements.define("playground-analytics", PlaygroundAnalytics);