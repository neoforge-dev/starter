import { LitElement, html, css } from 'lit';
import { apiService as api } from '../../services/api.js';

/**
 * Funnel Chart Component (Molecule)
 * Interactive conversion funnel visualization with drop-off analysis
 * Shows user progression through defined conversion steps
 * @element funnel-chart
 */
export class FunnelChart extends LitElement {
  static get properties() {
    return {
      data: { type: Array },
      steps: { type: Array },
      timeRange: { type: String },
      showDropoffRates: { type: Boolean },
      showTooltips: { type: Boolean },
      interactive: { type: Boolean },
      loading: { type: Boolean },
      height: { type: Number },
      colorScheme: { type: Array },
      selectedSegment: { type: Object },
      animationEnabled: { type: Boolean },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
        min-height: 300px;
        background: var(--surface-color, #fff);
        border-radius: 8px;
        border: 1px solid var(--border-color, #e0e0e0);
        overflow: hidden;
      }

      .funnel-container {
        padding: 1rem;
        height: 100%;
      }

      .funnel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }

      .funnel-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary-color, #333);
        margin: 0;
      }

      .funnel-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .toggle-button {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        background: var(--secondary-color, #f8f9fa);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toggle-button:hover {
        background: var(--hover-color, #e9ecef);
      }

      .toggle-button.active {
        background: var(--primary-color, #007bff);
        color: white;
        border-color: var(--primary-color, #007bff);
      }

      .funnel-chart {
        position: relative;
        height: calc(100% - 60px);
        min-height: 240px;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        color: var(--text-secondary-color, #666);
      }

      .funnel-step {
        position: relative;
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .funnel-step:hover {
        transform: translateX(2px);
      }

      .funnel-step.selected {
        transform: translateX(4px);
      }

      .step-bar {
        position: relative;
        height: 60px;
        background: var(--step-color);
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
        transition: all 0.3s ease;
        clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 100%, 0 100%);
      }

      .step-bar:first-child {
        clip-path: none;
        border-radius: 4px 4px 0 0;
      }

      .step-bar:last-child {
        clip-path: none;
        border-radius: 0 0 4px 4px;
      }

      .step-content {
        padding: 0 1rem;
        flex: 1;
        z-index: 2;
        position: relative;
      }

      .step-name {
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
      }

      .step-metrics {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.9);
      }

      .step-count {
        font-weight: 600;
      }

      .step-percentage {
        opacity: 0.8;
      }

      .dropoff-rate {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(220, 53, 69, 0.9);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .dropoff-indicator {
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid var(--warning-color, #ffc107);
        opacity: 0.7;
      }

      .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 0.75rem;
        border-radius: 4px;
        font-size: 0.875rem;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s ease;
      }

      .tooltip.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .tooltip-title {
        font-weight: 600;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        padding-bottom: 0.25rem;
      }

      .tooltip-content {
        display: grid;
        gap: 0.25rem;
        font-size: 0.8rem;
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
      }

      .summary-stats {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--background-color, #f8f9fa);
        border-radius: 4px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
      }

      .stat-item {
        text-align: center;
      }

      .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color, #007bff);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary-color, #666);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 0.25rem;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--text-secondary-color, #666);
        gap: 1rem;
      }

      .empty-icon {
        font-size: 3rem;
        opacity: 0.5;
      }

      /* Animation keyframes */
      @keyframes grow-width {
        from { width: 0; }
        to { width: var(--target-width); }
      }

      .step-bar.animated {
        animation: grow-width 0.8s ease-out forwards;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .funnel-container {
          padding: 0.5rem;
        }
        
        .step-content {
          padding: 0 0.5rem;
        }
        
        .step-metrics {
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .summary-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
  }

  constructor() {
    super();
    this.data = [];
    this.steps = [];
    this.timeRange = '7d';
    this.showDropoffRates = true;
    this.showTooltips = true;
    this.interactive = true;
    this.loading = false;
    this.height = 400;
    this.colorScheme = [
      '#007bff', '#0056b3', '#004085', '#002752',
      '#6f42c1', '#5a359a', '#452a7a', '#2f1e5a'
    ];
    this.selectedSegment = null;
    this.animationEnabled = true;
    
    this.tooltip = null;
    this.resizeObserver = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadFunnelData();
    this.setupResizeObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.requestUpdate();
      });
      this.resizeObserver.observe(this);
    }
  }

  async loadFunnelData() {
    this.loading = true;
    
    try {
      // Define default funnel steps if not provided
      if (this.steps.length === 0) {
        this.steps = [
          { name: 'Landing Page View', event_type: 'page_enter', path: '/' },
          { name: 'Product View', event_type: 'page_enter', path: '/product' },
          { name: 'Add to Cart', event_type: 'click_interaction', element: '.add-to-cart' },
          { name: 'Checkout Started', event_type: 'page_enter', path: '/checkout' },
          { name: 'Order Completed', event_type: 'conversion', conversion_type: 'purchase' }
        ];
      }

      // Fetch analytics data for funnel steps
      const funnelData = await this.fetchFunnelAnalytics();
      this.processData(funnelData);
      
    } catch (error) {
      console.error('[FunnelChart] Error loading funnel data:', error);
    } finally {
      this.loading = false;
    }
  }

  async fetchFunnelAnalytics() {
    const endDate = new Date();
    const startDate = new Date();
    
    // Calculate start date based on time range
    switch (this.timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const response = await api.get('/api/v1/events/analytics', {
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        group_by: ['event_type', 'page_path', 'data'],
        aggregate_functions: ['count', 'count_distinct_sessions'],
      }
    });

    return response.data;
  }

  processData(analyticsData) {
    const processedData = [];
    let previousCount = null;
    
    this.steps.forEach((step, index) => {
      // Find matching events for this step
      const matchingEvents = this.findMatchingEvents(analyticsData.results, step);
      const stepCount = matchingEvents.reduce((sum, event) => sum + event.count, 0);
      const uniqueSessionCount = matchingEvents.reduce((sum, event) => sum + (event.metrics.count_distinct_sessions || 0), 0);
      
      // Calculate conversion rate and drop-off
      const conversionRate = previousCount ? (stepCount / previousCount) * 100 : 100;
      const dropoffRate = previousCount ? ((previousCount - stepCount) / previousCount) * 100 : 0;
      
      const stepData = {
        ...step,
        index,
        count: stepCount,
        uniqueSessions: uniqueSessionCount,
        conversionRate,
        dropoffRate,
        color: this.colorScheme[index % this.colorScheme.length],
        width: this.calculateStepWidth(stepCount, processedData[0]?.count || stepCount),
      };
      
      processedData.push(stepData);
      previousCount = stepCount;
    });
    
    this.data = processedData;
  }

  findMatchingEvents(events, step) {
    return events.filter(event => {
      // Match by event type
      if (step.event_type && event.dimensions.event_type !== step.event_type) {
        return false;
      }
      
      // Match by page path
      if (step.path && !event.dimensions.page_path?.includes(step.path)) {
        return false;
      }
      
      // Match by element or other criteria
      if (step.element) {
        const eventData = event.dimensions.data || {};
        return eventData.element && JSON.stringify(eventData.element).includes(step.element);
      }
      
      // Match by conversion type
      if (step.conversion_type) {
        const eventData = event.dimensions.data || {};
        return eventData.conversionType === step.conversion_type;
      }
      
      return true;
    });
  }

  calculateStepWidth(count, maxCount) {
    return Math.max((count / maxCount) * 100, 10); // Minimum 10% width
  }

  handleStepClick(step, event) {
    if (!this.interactive) return;
    
    this.selectedSegment = this.selectedSegment === step ? null : step;
    
    this.dispatchEvent(new CustomEvent('step-selected', {
      detail: {
        step,
        data: this.getStepDetails(step),
      },
      bubbles: true,
      composed: true,
    }));
  }

  handleStepMouseEnter(step, event) {
    if (!this.showTooltips) return;
    
    this.showTooltip(step, event);
  }

  handleStepMouseLeave() {
    this.hideTooltip();
  }

  showTooltip(step, event) {
    const tooltipContent = this.renderTooltipContent(step);
    
    // Create or update tooltip
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'tooltip';
      document.body.appendChild(this.tooltip);
    }
    
    this.tooltip.innerHTML = tooltipContent;
    this.tooltip.classList.add('visible');
    
    // Position tooltip
    const rect = event.target.getBoundingClientRect();
    this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
    this.tooltip.style.top = `${rect.top - 10}px`;
    this.tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
  }

  renderTooltipContent(step) {
    const avgSessionValue = step.count > 0 ? (step.uniqueSessions / step.count * 100).toFixed(1) : 0;
    
    return `
      <div class="tooltip-title">${step.name}</div>
      <div class="tooltip-content">
        <div class="metric-row">
          <span>Total Events:</span>
          <strong>${step.count.toLocaleString()}</strong>
        </div>
        <div class="metric-row">
          <span>Unique Sessions:</span>
          <strong>${step.uniqueSessions.toLocaleString()}</strong>
        </div>
        <div class="metric-row">
          <span>Conversion Rate:</span>
          <strong>${step.conversionRate.toFixed(1)}%</strong>
        </div>
        ${step.dropoffRate > 0 ? `
          <div class="metric-row">
            <span>Drop-off Rate:</span>
            <strong style="color: #dc3545">${step.dropoffRate.toFixed(1)}%</strong>
          </div>
        ` : ''}
        <div class="metric-row">
          <span>Session Rate:</span>
          <strong>${avgSessionValue}%</strong>
        </div>
      </div>
    `;
  }

  getStepDetails(step) {
    return {
      ...step,
      insights: this.generateStepInsights(step),
      recommendations: this.generateStepRecommendations(step),
    };
  }

  generateStepInsights(step) {
    const insights = [];
    
    if (step.dropoffRate > 50) {
      insights.push({
        type: 'warning',
        message: `High drop-off rate of ${step.dropoffRate.toFixed(1)}% indicates a potential bottleneck.`,
      });
    }
    
    if (step.conversionRate > 80) {
      insights.push({
        type: 'success',
        message: `Excellent conversion rate of ${step.conversionRate.toFixed(1)}%.`,
      });
    }
    
    const sessionToEventRatio = step.count > 0 ? step.uniqueSessions / step.count : 0;
    if (sessionToEventRatio < 0.5) {
      insights.push({
        type: 'info',
        message: 'Users are performing this action multiple times per session.',
      });
    }
    
    return insights;
  }

  generateStepRecommendations(step) {
    const recommendations = [];
    
    if (step.dropoffRate > 30) {
      recommendations.push('Consider A/B testing this step to improve conversion');
      recommendations.push('Review user feedback and usability testing for this stage');
    }
    
    if (step.conversionRate < 20) {
      recommendations.push('Simplify the user experience for this step');
      recommendations.push('Add progress indicators to reduce abandonment');
    }
    
    return recommendations;
  }

  toggleDropoffRates() {
    this.showDropoffRates = !this.showDropoffRates;
  }

  toggleTooltips() {
    this.showTooltips = !this.showTooltips;
  }

  renderStep(step) {
    const isSelected = this.selectedSegment === step;
    const stepStyle = `
      --step-color: ${step.color};
      --target-width: ${step.width}%;
    `;
    
    return html`
      <div 
        class="funnel-step ${isSelected ? 'selected' : ''}"
        @click=${(e) => this.handleStepClick(step, e)}
        @mouseenter=${(e) => this.handleStepMouseEnter(step, e)}
        @mouseleave=${() => this.handleStepMouseLeave()}
      >
        <div 
          class="step-bar ${this.animationEnabled ? 'animated' : ''}"
          style=${stepStyle}
        >
          <div class="step-content">
            <div class="step-name">${step.name}</div>
            <div class="step-metrics">
              <div class="step-count">${step.count.toLocaleString()}</div>
              <div class="step-percentage">${step.conversionRate.toFixed(1)}%</div>
            </div>
          </div>
          
          ${this.showDropoffRates && step.dropoffRate > 0 ? html`
            <div class="dropoff-rate">-${step.dropoffRate.toFixed(1)}%</div>
          ` : ''}
        </div>
        
        ${step.dropoffRate > 25 ? html`
          <div class="dropoff-indicator"></div>
        ` : ''}
      </div>
    `;
  }

  renderSummaryStats() {
    if (this.data.length === 0) return '';
    
    const totalUsers = this.data[0]?.count || 0;
    const completedUsers = this.data[this.data.length - 1]?.count || 0;
    const overallConversion = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;
    const avgDropoff = this.data.reduce((sum, step) => sum + step.dropoffRate, 0) / this.data.length;
    
    return html`
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${totalUsers.toLocaleString()}</span>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-item">
          <span class="stat-value">${completedUsers.toLocaleString()}</span>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-item">
          <span class="stat-value">${overallConversion.toFixed(1)}%</span>
          <div class="stat-label">Overall Rate</div>
        </div>
        <div class="stat-item">
          <span class="stat-value">${avgDropoff.toFixed(1)}%</span>
          <div class="stat-label">Avg Drop-off</div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="funnel-container">
          <div class="loading-spinner">
            <div>Loading funnel data...</div>
          </div>
        </div>
      `;
    }

    if (this.data.length === 0) {
      return html`
        <div class="funnel-container">
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <div>No funnel data available</div>
            <div>Configure funnel steps or check your time range</div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="funnel-container">
        <div class="funnel-header">
          <h3 class="funnel-title">Conversion Funnel</h3>
          <div class="funnel-controls">
            <button 
              class="toggle-button ${this.showDropoffRates ? 'active' : ''}"
              @click=${this.toggleDropoffRates}
            >
              Drop-off Rates
            </button>
            <button 
              class="toggle-button ${this.showTooltips ? 'active' : ''}"
              @click=${this.toggleTooltips}
            >
              Tooltips
            </button>
          </div>
        </div>

        <div class="funnel-chart">
          ${this.data.map(step => this.renderStep(step))}
        </div>

        ${this.renderSummaryStats()}
      </div>
    `;
  }
}

customElements.define('funnel-chart', FunnelChart);