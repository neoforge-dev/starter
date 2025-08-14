/**
 * A/B Testing Dashboard Page - Complete interface for A/B testing management
 * Integrates all A/B testing components into a comprehensive dashboard
 */

import { LitElement, html, css } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';
import abTestingService from '../../services/ab-testing.js';
import '../organisms/ab-test-manager.js';
import '../molecules/test-analytics.js';
import '../molecules/variant-renderer.js';

@customElement('ab-testing-dashboard')
export class AbTestingDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .dashboard-title {
      font-size: 36px;
      font-weight: 700;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 12px 0;
    }

    .dashboard-subtitle {
      font-size: 18px;
      color: #64748b;
      margin: 0;
    }

    .dashboard-nav {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;
      background: white;
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    .nav-btn {
      padding: 12px 24px;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-btn:hover {
      color: #3b82f6;
      background: #f8fafc;
    }

    .nav-btn.active {
      color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2);
    }

    .performance-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .overview-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .overview-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      font-size: 24px;
    }

    .icon-tests { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .icon-users { background: linear-gradient(135deg, #10b981, #059669); }
    .icon-conversions { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .icon-performance { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

    .card-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .card-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .card-trend {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .trend-positive { color: #059669; }
    .trend-negative { color: #dc2626; }
    .trend-neutral { color: #64748b; }

    .quick-actions {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .actions-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .action-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .action-card:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }

    .action-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .action-description {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
    }

    .content-area {
      background: white;
      border-radius: 12px;
      padding: 32px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      min-height: 600px;
    }

    .analytics-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 1000px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    .modal-header {
      padding: 24px 24px 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #64748b;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.2s ease;
    }

    .close-btn:hover {
      background: #f1f5f9;
    }

    .example-tests {
      margin-bottom: 32px;
    }

    .example-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .example-title {
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .example-description {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 12px;
    }

    .try-example-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    .try-example-btn:hover {
      background: #2563eb;
    }

    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 50%;
      border-top-color: #3b82f6;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 24px 16px;
      }
      
      .dashboard-nav {
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .nav-btn {
        flex: 1;
        min-width: 120px;
        padding: 10px 16px;
      }
      
      .performance-overview {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
      
      .content-area {
        padding: 20px;
      }
      
      .modal-content {
        margin: 10px;
        max-height: calc(100vh - 20px);
      }
    }
  `;

  @state()
  private currentView = 'overview';

  @state()
  private performanceMetrics = null;

  @state()
  private selectedTest = null;

  @state()
  private showAnalyticsModal = false;

  @state()
  private isLoading = false;

  connectedCallback() {
    super.connectedCallback();
    this._loadPerformanceMetrics();
    
    // Initialize A/B testing service
    abTestingService.initialize().then(() => {
      console.log('A/B testing service initialized');
    });
  }

  async _loadPerformanceMetrics() {
    this.isLoading = true;
    
    try {
      // Get performance metrics from A/B testing service
      this.performanceMetrics = await abTestingService.getPerformanceMetrics();
      
      // Also get additional metrics from the API
      const apiMetrics = await abTestingService.listTests({ limit: 100 });
      
      // Combine metrics
      this.performanceMetrics = {
        ...this.performanceMetrics,
        totalTests: apiMetrics.total || 0,
        activeTests: apiMetrics.tests?.filter(t => t.status === 'active').length || 0,
        completedTests: apiMetrics.tests?.filter(t => t.status === 'completed').length || 0
      };
      
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      this.isLoading = false;
    }
  }

  _switchView(view) {
    this.currentView = view;
  }

  _showAnalytics(test) {
    this.selectedTest = test;
    this.showAnalyticsModal = true;
  }

  _closeAnalyticsModal() {
    this.showAnalyticsModal = false;
    this.selectedTest = null;
  }

  _createExampleTest(type) {
    let testData;
    
    switch (type) {
      case 'button':
        testData = {
          test_key: `button_color_${Date.now()}`,
          name: 'Button Color Test',
          description: 'Testing different button colors for conversion optimization',
          primary_metric: 'click_through',
          variants: [
            {
              variant_key: 'control',
              name: 'Blue Button',
              description: 'Original blue button',
              traffic_allocation: 0.5,
              is_control: true,
              configuration: { button_color: '#3b82f6' }
            },
            {
              variant_key: 'green_button',
              name: 'Green Button',
              description: 'Green button variant',
              traffic_allocation: 0.5,
              is_control: false,
              configuration: { button_color: '#10b981' }
            }
          ]
        };
        break;
        
      case 'headline':
        testData = {
          test_key: `headline_${Date.now()}`,
          name: 'Landing Page Headline Test',
          description: 'Testing different headlines for better engagement',
          primary_metric: 'page_engagement',
          variants: [
            {
              variant_key: 'control',
              name: 'Original Headline',
              description: 'Current headline',
              traffic_allocation: 0.5,
              is_control: true,
              configuration: { headline: 'Welcome to Our Product' }
            },
            {
              variant_key: 'benefit_focused',
              name: 'Benefit-Focused Headline',
              description: 'Headline focused on benefits',
              traffic_allocation: 0.5,
              is_control: false,
              configuration: { headline: 'Boost Your Productivity by 50%' }
            }
          ]
        };
        break;
        
      case 'pricing':
        testData = {
          test_key: `pricing_${Date.now()}`,
          name: 'Pricing Strategy Test',
          description: 'Testing different pricing presentations',
          primary_metric: 'signup',
          variants: [
            {
              variant_key: 'control',
              name: 'Monthly Pricing',
              description: 'Show monthly prices',
              traffic_allocation: 0.5,
              is_control: true,
              configuration: { pricing_period: 'monthly' }
            },
            {
              variant_key: 'annual_discount',
              name: 'Annual with Discount',
              description: 'Show annual pricing with discount',
              traffic_allocation: 0.5,
              is_control: false,
              configuration: { pricing_period: 'annual', discount: 0.2 }
            }
          ]
        };
        break;
        
      default:
        return;
    }
    
    this.dispatchEvent(new CustomEvent('create-example-test', {
      detail: { testData },
      bubbles: true
    }));
    
    this._switchView('manager');
  }

  _renderPerformanceOverview() {
    if (!this.performanceMetrics) {
      return html`
        <div class="performance-overview">
          ${[1, 2, 3, 4].map(() => html`
            <div class="overview-card">
              <div class="loading-spinner"></div>
            </div>
          `)}
        </div>
      `;
    }

    return html`
      <div class="performance-overview">
        <div class="overview-card">
          <div class="card-icon icon-tests">🧪</div>
          <div class="card-value">${this.performanceMetrics.totalTests || 0}</div>
          <div class="card-label">Total Tests</div>
          <div class="card-trend trend-neutral">
            ${this.performanceMetrics.activeTests || 0} active
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon icon-users">👥</div>
          <div class="card-value">${this.performanceMetrics.totalAssignments || 0}</div>
          <div class="card-label">Total Participants</div>
          <div class="card-trend trend-positive">
            ↗ ${((this.performanceMetrics.cacheHitRate || 0) * 100).toFixed(1)}% cache hit rate
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon icon-conversions">📈</div>
          <div class="card-value">${this.performanceMetrics.completedTests || 0}</div>
          <div class="card-label">Completed Tests</div>
          <div class="card-trend trend-positive">
            ${this.performanceMetrics.activeTestsCount || 0} currently running
          </div>
        </div>
        
        <div class="overview-card">
          <div class="card-icon icon-performance">⚡</div>
          <div class="card-value">${(this.performanceMetrics.averageAssignmentTime || 0).toFixed(0)}ms</div>
          <div class="card-label">Avg Assignment Time</div>
          <div class="card-trend trend-positive">
            ↗ Optimized performance
          </div>
        </div>
      </div>
    `;
  }

  _renderQuickActions() {
    return html`
      <div class="quick-actions">
        <h3 class="actions-title">Quick Start</h3>
        <div class="actions-grid">
          <div class="action-card" @click=${() => this._switchView('manager')}>
            <div class="action-title">Create New Test</div>
            <div class="action-description">
              Set up a new A/B test with custom variants and traffic allocation
            </div>
          </div>
          
          <div class="action-card" @click=${() => this._switchView('examples')}>
            <div class="action-title">Try Examples</div>
            <div class="action-description">
              Get started quickly with pre-built test templates for common scenarios
            </div>
          </div>
          
          <div class="action-card" @click=${() => this._switchView('integration')}>
            <div class="action-title">Integration Guide</div>
            <div class="action-description">
              Learn how to integrate A/B testing into your components and track conversions
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderExamples() {
    return html`
      <div class="example-tests">
        <h3>Example A/B Tests</h3>
        <p>Try these common A/B testing scenarios to get started:</p>
        
        <div class="example-card">
          <div class="example-title">Button Color Optimization</div>
          <div class="example-description">
            Test different button colors to see which performs better for click-through rates.
            This is a classic A/B test that often shows significant results.
          </div>
          <button class="try-example-btn" @click=${() => this._createExampleTest('button')}>
            Create Button Test
          </button>
        </div>
        
        <div class="example-card">
          <div class="example-title">Landing Page Headlines</div>
          <div class="example-description">
            Compare different headlines to optimize for engagement and conversions.
            Headlines can make a huge difference in user engagement.
          </div>
          <button class="try-example-btn" @click=${() => this._createExampleTest('headline')}>
            Create Headline Test
          </button>
        </div>
        
        <div class="example-card">
          <div class="example-title">Pricing Strategy</div>
          <div class="example-description">
            Test different pricing presentations to maximize signups and revenue.
            Try monthly vs annual pricing or different discount strategies.
          </div>
          <button class="try-example-btn" @click=${() => this._createExampleTest('pricing')}>
            Create Pricing Test
          </button>
        </div>
      </div>
    `;
  }

  _renderIntegrationGuide() {
    return html`
      <div class="integration-guide">
        <h3>A/B Testing Integration Guide</h3>
        
        <h4>1. Basic Variant Rendering</h4>
        <pre><code>&lt;variant-renderer
  test-key="my_test_key"
  .variants=${{
    control: html\`&lt;button style="background: blue"&gt;Sign Up&lt;/button&gt;\`,
    variant_a: html\`&lt;button style="background: green"&gt;Get Started&lt;/button&gt;\`
  }}
  default-variant="control"
&gt;&lt;/variant-renderer&gt;</code></pre>

        <h4>2. Track Conversions</h4>
        <pre><code>// In your component
const variantRenderer = this.shadowRoot.querySelector('variant-renderer');
await variantRenderer.trackConversion('button_click', 1, {
  section: 'hero',
  user_type: 'new'
});</code></pre>

        <h4>3. Programmatic Test Assignment</h4>
        <pre><code>import abTestingService from './services/ab-testing.js';

// Get variant for a test
const variant = await abTestingService.getVariant('my_test');
if (variant?.variantKey === 'variant_a') {
  // Show variant A
} else {
  // Show control
}</code></pre>

        <h4>4. Event-Driven Integration</h4>
        <pre><code>// Listen for A/B testing events
abTestingService.subscribe((eventType, data) => {
  if (eventType === 'assignment') {
    console.log('User assigned to variant:', data.assignment.variant_key);
  }
});</code></pre>
      </div>
    `;
  }

  _renderCurrentView() {
    switch (this.currentView) {
      case 'overview':
        return html`
          ${this._renderPerformanceOverview()}
          ${this._renderQuickActions()}
        `;
        
      case 'manager':
        return html`
          <ab-test-manager @view-analytics=${(e) => this._showAnalytics(e.detail.test)}></ab-test-manager>
        `;
        
      case 'examples':
        return this._renderExamples();
        
      case 'integration':
        return this._renderIntegrationGuide();
        
      default:
        return this._renderPerformanceOverview();
    }
  }

  render() {
    return html`
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1 class="dashboard-title">A/B Testing Dashboard</h1>
          <p class="dashboard-subtitle">
            Optimize conversions with data-driven experiments
          </p>
        </div>

        <nav class="dashboard-nav">
          <button 
            class="nav-btn ${this.currentView === 'overview' ? 'active' : ''}"
            @click=${() => this._switchView('overview')}
          >
            Overview
          </button>
          <button 
            class="nav-btn ${this.currentView === 'manager' ? 'active' : ''}"
            @click=${() => this._switchView('manager')}
          >
            Test Manager
          </button>
          <button 
            class="nav-btn ${this.currentView === 'examples' ? 'active' : ''}"
            @click=${() => this._switchView('examples')}
          >
            Examples
          </button>
          <button 
            class="nav-btn ${this.currentView === 'integration' ? 'active' : ''}"
            @click=${() => this._switchView('integration')}
          >
            Integration
          </button>
        </nav>

        <div class="content-area">
          ${this._renderCurrentView()}
        </div>
      </div>

      ${this.showAnalyticsModal && this.selectedTest ? html`
        <div class="analytics-modal" @click=${(e) => e.target === e.currentTarget && this._closeAnalyticsModal()}>
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title">Test Analytics</h3>
              <button class="close-btn" @click=${this._closeAnalyticsModal}>×</button>
            </div>
            <test-analytics 
              test-id=${this.selectedTest.id}
              auto-refresh
            ></test-analytics>
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ab-testing-dashboard': AbTestingDashboard;
  }
}