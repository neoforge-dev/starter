/**
 * Test Analytics Component - Molecule
 * Statistical visualization and analysis for A/B test results
 * Provides comprehensive insights with confidence intervals and significance testing
 */

import { LitElement, html, css } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import abTestingService from '../../services/ab-testing.js';

@customElement('test-analytics')
export class TestAnalytics extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .analytics-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #e5e7eb;
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .test-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .significance-badge {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .significant {
      background: #dcfce7;
      color: #166534;
    }

    .not-significant {
      background: #fef3c7;
      color: #92400e;
    }

    .overview-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 14px;
      color: #6b7280;
    }

    .metric-change {
      font-size: 12px;
      margin-top: 4px;
    }

    .positive { color: #059669; }
    .negative { color: #dc2626; }
    .neutral { color: #6b7280; }

    .variants-comparison {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }

    .variants-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .variants-table th,
    .variants-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .variants-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    .variants-table td {
      font-size: 14px;
      color: #111827;
    }

    .variant-name {
      font-weight: 500;
    }

    .control-badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      margin-left: 8px;
    }

    .confidence-interval {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }

    .p-value {
      font-family: monospace;
      font-weight: 500;
    }

    .p-value.significant {
      color: #059669;
    }

    .p-value.not-significant {
      color: #dc2626;
    }

    .chart-container {
      margin-bottom: 32px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .conversion-chart {
      display: flex;
      align-items: end;
      justify-content: space-around;
      height: 200px;
      margin: 20px 0;
    }

    .chart-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 80px;
    }

    .bar {
      width: 40px;
      background: linear-gradient(to top, #3b82f6, #60a5fa);
      border-radius: 4px 4px 0 0;
      margin-bottom: 8px;
      transition: all 0.3s ease;
      position: relative;
    }

    .bar.control {
      background: linear-gradient(to top, #6b7280, #9ca3af);
    }

    .bar:hover {
      transform: scale(1.05);
    }

    .bar-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
    }

    .bar-label {
      font-size: 12px;
      color: #374151;
      text-align: center;
      font-weight: 500;
    }

    .recommendations {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 32px;
    }

    .recommendations-title {
      font-size: 16px;
      font-weight: 600;
      color: #0369a1;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }

    .recommendations-title::before {
      content: "💡";
      margin-right: 8px;
    }

    .recommendation-item {
      margin-bottom: 8px;
      color: #0369a1;
      font-size: 14px;
    }

    .statistical-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .detail-label {
      font-size: 14px;
      color: #6b7280;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .error-state {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      color: #dc2626;
      text-align: center;
    }

    .refresh-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .refresh-btn:hover {
      background: #2563eb;
    }

    @media (max-width: 768px) {
      .overview-metrics {
        grid-template-columns: 1fr;
      }

      .analytics-header {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .variants-table {
        font-size: 12px;
      }

      .variants-table th,
      .variants-table td {
        padding: 8px 12px;
      }

      .conversion-chart {
        height: 150px;
      }
    }
  `;

  @property({ type: Number, attribute: 'test-id' })
  testId = null;

  @property({ type: Object })
  testData = null;

  @property({ type: Boolean, attribute: 'auto-refresh' })
  autoRefresh = false;

  @property({ type: Number, attribute: 'refresh-interval' })
  refreshInterval = 30000; // 30 seconds

  @state()
  private analytics = null;

  @state()
  private isLoading = false;

  @state()
  private error = null;

  private refreshTimer = null;

  connectedCallback() {
    super.connectedCallback();
    if (this.testId) {
      this._loadAnalytics();
    }

    if (this.autoRefresh) {
      this._startAutoRefresh();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAutoRefresh();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has('testId') && this.testId) {
      this._loadAnalytics();
    }

    if (changedProperties.has('autoRefresh')) {
      if (this.autoRefresh) {
        this._startAutoRefresh();
      } else {
        this._stopAutoRefresh();
      }
    }
  }

  async _loadAnalytics() {
    if (!this.testId) return;

    this.isLoading = true;
    this.error = null;

    try {
      this.analytics = await abTestingService.getTestAnalytics(this.testId);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      this.error = 'Failed to load test analytics. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  _startAutoRefresh() {
    this._stopAutoRefresh();
    this.refreshTimer = setInterval(() => {
      this._loadAnalytics();
    }, this.refreshInterval);
  }

  _stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  _formatPercentage(value) {
    return `${(value * 100).toFixed(2)}%`;
  }

  _formatNumber(value) {
    return new Intl.NumberFormat().format(value);
  }

  _formatPValue(pValue) {
    if (pValue === null || pValue === undefined) return 'N/A';
    if (pValue < 0.001) return '< 0.001';
    return pValue.toFixed(3);
  }

  _getSignificanceLevel(pValue) {
    if (pValue === null || pValue === undefined) return 'unknown';
    return pValue < 0.05 ? 'significant' : 'not-significant';
  }

  _renderOverviewMetrics() {
    if (!this.analytics) return '';

    const control = this.analytics.control_variant;
    const bestTreatment = this.analytics.treatment_variants.reduce((best, variant) =>
      variant.conversion_rate > (best?.conversion_rate || 0) ? variant : best, null
    );

    const improvement = bestTreatment && control.conversion_rate > 0
      ? ((bestTreatment.conversion_rate - control.conversion_rate) / control.conversion_rate)
      : 0;

    return html`
      <div class="overview-metrics">
        <div class="metric-card">
          <div class="metric-value">${this._formatNumber(this.analytics.total_participants)}</div>
          <div class="metric-label">Total Participants</div>
        </div>

        <div class="metric-card">
          <div class="metric-value">${this._formatPercentage(control.conversion_rate)}</div>
          <div class="metric-label">Control Conversion Rate</div>
        </div>

        <div class="metric-card">
          <div class="metric-value">${bestTreatment ? this._formatPercentage(bestTreatment.conversion_rate) : 'N/A'}</div>
          <div class="metric-label">Best Variant Rate</div>
          ${bestTreatment ? html`
            <div class="metric-change ${improvement > 0 ? 'positive' : improvement < 0 ? 'negative' : 'neutral'}">
              ${improvement > 0 ? '+' : ''}${this._formatPercentage(improvement)} vs control
            </div>
          ` : ''}
        </div>

        <div class="metric-card">
          <div class="metric-value">${this.analytics.confidence_level * 100}%</div>
          <div class="metric-label">Confidence Level</div>
        </div>
      </div>
    `;
  }

  _renderVariantsTable() {
    if (!this.analytics) return '';

    const allVariants = [this.analytics.control_variant, ...this.analytics.treatment_variants];

    return html`
      <div class="variants-comparison">
        <h3 class="section-title">Variant Performance</h3>
        <table class="variants-table">
          <thead>
            <tr>
              <th>Variant</th>
              <th>Participants</th>
              <th>Conversions</th>
              <th>Conversion Rate</th>
              <th>Confidence Interval</th>
              <th>P-Value</th>
              <th>Improvement</th>
            </tr>
          </thead>
          <tbody>
            ${allVariants.map(variant => {
              const improvement = variant.relative_improvement
                ? this._formatPercentage(variant.relative_improvement)
                : '—';

              return html`
                <tr>
                  <td>
                    <span class="variant-name">${variant.variant_name}</span>
                    ${variant.is_control ? html`<span class="control-badge">CONTROL</span>` : ''}
                  </td>
                  <td>${this._formatNumber(variant.participants)}</td>
                  <td>${this._formatNumber(variant.conversions)}</td>
                  <td>${this._formatPercentage(variant.conversion_rate)}</td>
                  <td class="confidence-interval">
                    ${variant.confidence_interval
                      ? `[${this._formatPercentage(variant.confidence_interval[0])}, ${this._formatPercentage(variant.confidence_interval[1])}]`
                      : 'N/A'
                    }
                  </td>
                  <td class="p-value ${this._getSignificanceLevel(variant.p_value)}">
                    ${this._formatPValue(variant.p_value)}
                  </td>
                  <td class="${variant.relative_improvement > 0 ? 'positive' : variant.relative_improvement < 0 ? 'negative' : 'neutral'}">
                    ${improvement}
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderConversionChart() {
    if (!this.analytics) return '';

    const allVariants = [this.analytics.control_variant, ...this.analytics.treatment_variants];
    const maxRate = Math.max(...allVariants.map(v => v.conversion_rate));

    return html`
      <div class="chart-container">
        <h3 class="section-title">Conversion Rate Comparison</h3>
        <div class="conversion-chart">
          ${allVariants.map(variant => {
            const height = maxRate > 0 ? (variant.conversion_rate / maxRate) * 160 : 0;

            return html`
              <div class="chart-bar">
                <div
                  class="bar ${variant.is_control ? 'control' : ''}"
                  style="height: ${height}px"
                >
                  <div class="bar-value">${this._formatPercentage(variant.conversion_rate)}</div>
                </div>
                <div class="bar-label">${variant.variant_name}</div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  _renderRecommendations() {
    if (!this.analytics || !this.analytics.insights.length) return '';

    return html`
      <div class="recommendations">
        <h3 class="recommendations-title">Insights & Recommendations</h3>
        ${this.analytics.insights.map(insight => html`
          <div class="recommendation-item">• ${insight}</div>
        `)}

        <div class="recommendation-item">
          <strong>Recommended Action:</strong> ${this.analytics.recommended_action.replace('_', ' ')}
        </div>

        <div class="recommendation-item">
          <strong>Confidence in Result:</strong> ${(this.analytics.confidence_in_result * 100).toFixed(1)}%
        </div>
      </div>
    `;
  }

  _renderStatisticalDetails() {
    if (!this.analytics) return '';

    return html`
      <div class="statistical-details">
        <h3 class="section-title">Statistical Details</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Statistical Method</span>
            <span class="detail-value">${this.analytics.statistical_method}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Minimum Detectable Effect</span>
            <span class="detail-value">${this._formatPercentage(this.analytics.minimum_detectable_effect)}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Test Duration</span>
            <span class="detail-value">${this.analytics.test_duration_days || 0} days</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Overall P-Value</span>
            <span class="detail-value ${this._getSignificanceLevel(this.analytics.overall_p_value)}">
              ${this._formatPValue(this.analytics.overall_p_value)}
            </span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Analysis Date</span>
            <span class="detail-value">${new Date(this.analytics.analysis_date).toLocaleString()}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Winner Variant</span>
            <span class="detail-value">
              ${this.analytics.winner_variant_id ? `Variant ${this.analytics.winner_variant_id}` : 'TBD'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="analytics-container">
          <div class="loading-state">Loading analytics...</div>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="analytics-container">
          <div class="error-state">
            ${this.error}
            <br><br>
            <button class="refresh-btn" @click=${this._loadAnalytics}>
              Retry
            </button>
          </div>
        </div>
      `;
    }

    if (!this.analytics) {
      return html`
        <div class="analytics-container">
          <div class="loading-state">No analytics data available</div>
        </div>
      `;
    }

    return html`
      <div class="analytics-container">
        <div class="analytics-header">
          <h2 class="test-title">${this.analytics.test_name}</h2>
          <div class="significance-badge ${this.analytics.is_statistically_significant ? 'significant' : 'not-significant'}">
            ${this.analytics.is_statistically_significant ? 'Statistically Significant' : 'Not Significant'}
          </div>
        </div>

        ${this._renderOverviewMetrics()}
        ${this._renderConversionChart()}
        ${this._renderVariantsTable()}
        ${this._renderRecommendations()}
        ${this._renderStatisticalDetails()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'test-analytics': TestAnalytics;
  }
}
