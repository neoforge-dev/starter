/**
 * Developer Experience Page
 * 
 * Main entry point for the NeoForge Developer Experience featuring:
 * - Interactive API Playground
 * - Developer Portal with API key management
 * - Comprehensive integration guides
 * - Usage analytics and monitoring
 * - SDK downloads and documentation
 */

import { LitElement, html, css } from 'lit';
import { Logger } from '../utils/logger.js';
import '../components/developer/api-playground.js';
import '../components/developer/developer-portal.js';
import '../components/developer/integration-guides.js';

export class DeveloperPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }

    .developer-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .hero-section {
      text-align: center;
      padding: 80px 20px;
      color: white;
    }

    .hero-title {
      font-size: 64px;
      font-weight: 800;
      margin: 0 0 24px 0;
      background: linear-gradient(45deg, #fff, #e2e8f0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      font-size: 24px;
      opacity: 0.9;
      margin: 0 0 32px 0;
      font-weight: 300;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.4;
    }

    .hero-stats {
      display: flex;
      justify-content: center;
      gap: 48px;
      margin-bottom: 48px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
      display: block;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hero-cta {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 16px 32px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: rgba(255, 255, 255, 0.95);
      color: #4f46e5;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      background: white;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(20px);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .navigation-tabs {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px 16px 0 0;
      padding: 0;
      margin: 0 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-bottom: none;
      display: flex;
      overflow-x: auto;
    }

    .nav-tab {
      padding: 20px 32px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-tab:hover {
      color: #374151;
      background: rgba(0, 0, 0, 0.02);
    }

    .nav-tab.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
      background: rgba(79, 70, 229, 0.05);
    }

    .content-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 0 0 16px 16px;
      margin: 0 20px 40px 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-top: none;
      min-height: 80vh;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 32px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      text-align: center;
      transition: all 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
    }

    .feature-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      font-size: 28px;
    }

    .feature-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 12px 0;
    }

    .feature-description {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .feature-link {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .feature-link:hover {
      text-decoration: underline;
    }

    .quick-start-section {
      background: linear-gradient(135deg, #1f2937, #374151);
      color: white;
      padding: 60px 20px;
      text-align: center;
    }

    .quick-start-title {
      font-size: 36px;
      font-weight: 700;
      margin: 0 0 16px 0;
    }

    .quick-start-description {
      font-size: 18px;
      opacity: 0.9;
      margin: 0 0 32px 0;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.6;
    }

    .quick-start-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .step-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 24px;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .step-number {
      width: 32px;
      height: 32px;
      background: #4f46e5;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .step-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .step-description {
      opacity: 0.9;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 48px;
      }
      
      .hero-subtitle {
        font-size: 20px;
      }
      
      .hero-stats {
        flex-direction: column;
        gap: 24px;
      }
      
      .hero-cta {
        flex-direction: column;
        align-items: center;
      }
      
      .navigation-tabs {
        margin: 0 10px;
      }
      
      .content-container {
        margin: 0 10px 20px 10px;
      }
      
      .nav-tab {
        padding: 16px 20px;
        font-size: 14px;
      }
    }
  `;

  static properties = {
    activeTab: { type: String },
    user: { type: Object }
  };

  constructor() {
    super();
    this.activeTab = 'overview';
    this.user = null;
    this.loadUserData();
  }

  async loadUserData() {
    try {
      const token = localStorage.getItem('neoforge_auth_token');
      if (!token) return;
      
      const response = await fetch('/api/v1/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        this.user = await response.json();
        this.requestUpdate();
      }
    } catch (error) {
      Logger.error('Failed to load user data:', error);
    }
  }

  selectTab(tab) {
    this.activeTab = tab;
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="developer-container">
        ${this.renderHeroSection()}
        ${this.renderNavigationTabs()}
        ${this.renderContent()}
        ${this.activeTab === 'overview' ? this.renderQuickStartSection() : ''}
      </div>
    `;
  }

  renderHeroSection() {
    return html`
      <div class="hero-section">
        <h1 class="hero-title">Developer Experience</h1>
        <p class="hero-subtitle">
          Everything you need to integrate NeoForge API into your application. 
          From authentication to advanced features, we've got you covered.
        </p>
        
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">22+</span>
            <span class="stat-label">API Endpoints</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">99.9%</span>
            <span class="stat-label">Uptime</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">< 100ms</span>
            <span class="stat-label">Response Time</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">24/7</span>
            <span class="stat-label">Support</span>
          </div>
        </div>

        <div class="hero-cta">
          <button class="btn btn-primary" @click=${() => this.selectTab('playground')}>
            🧪 Try API Playground
          </button>
          <button class="btn btn-secondary" @click=${() => this.selectTab('guides')}>
            📚 View Guides
          </button>
          <a href="/docs" class="btn btn-secondary">
            📖 API Documentation
          </a>
        </div>
      </div>
    `;
  }

  renderNavigationTabs() {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: '🏠' },
      { id: 'playground', label: 'API Playground', icon: '🧪' },
      { id: 'portal', label: 'Developer Portal', icon: '🚀' },
      { id: 'guides', label: 'Integration Guides', icon: '📚' },
      { id: 'documentation', label: 'API Docs', icon: '📖' }
    ];

    return html`
      <div class="navigation-tabs">
        ${tabs.map(tab => html`
          <button 
            class="nav-tab ${this.activeTab === tab.id ? 'active' : ''}"
            @click=${() => this.selectTab(tab.id)}
          >
            <span>${tab.icon}</span>
            <span>${tab.label}</span>
          </button>
        `)}
      </div>
    `;
  }

  renderContent() {
    return html`
      <div class="content-container">
        <div class="tab-content ${this.activeTab === 'overview' ? 'active' : ''}">
          ${this.renderOverviewContent()}
        </div>
        
        <div class="tab-content ${this.activeTab === 'playground' ? 'active' : ''}">
          <api-playground></api-playground>
        </div>
        
        <div class="tab-content ${this.activeTab === 'portal' ? 'active' : ''}">
          <developer-portal></developer-portal>
        </div>
        
        <div class="tab-content ${this.activeTab === 'guides' ? 'active' : ''}">
          <integration-guides></integration-guides>
        </div>
        
        <div class="tab-content ${this.activeTab === 'documentation' ? 'active' : ''}">
          ${this.renderDocumentationContent()}
        </div>
      </div>
    `;
  }

  renderOverviewContent() {
    return html`
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🧪</div>
          <h3 class="feature-title">Interactive Playground</h3>
          <p class="feature-description">
            Test all API endpoints in real-time with our interactive playground. 
            No setup required - authenticate and start testing immediately.
          </p>
          <a href="#" class="feature-link" @click=${() => this.selectTab('playground')}>
            Try Now →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔐</div>
          <h3 class="feature-title">API Key Management</h3>
          <p class="feature-description">
            Generate, manage, and monitor your API keys with granular permissions 
            and usage analytics. Keep track of rate limits and quotas.
          </p>
          <a href="#" class="feature-link" @click=${() => this.selectTab('portal')}>
            Manage Keys →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <h3 class="feature-title">Step-by-Step Guides</h3>
          <p class="feature-description">
            Comprehensive integration guides with code examples in multiple languages. 
            Get from zero to production in minutes.
          </p>
          <a href="#" class="feature-link" @click=${() => this.selectTab('guides')}>
            Read Guides →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3 class="feature-title">Usage Analytics</h3>
          <p class="feature-description">
            Monitor your API usage with detailed analytics. Track requests, 
            error rates, response times, and identify optimization opportunities.
          </p>
          <a href="#" class="feature-link" @click=${() => this.selectTab('portal')}>
            View Analytics →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3 class="feature-title">High Performance</h3>
          <p class="feature-description">
            Built for scale with < 100ms response times, 99.9% uptime, 
            and global CDN distribution. Handle millions of requests reliably.
          </p>
          <a href="#" class="feature-link">
            Learn More →
          </a>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🛡️</div>
          <h3 class="feature-title">Enterprise Security</h3>
          <p class="feature-description">
            SOC 2 compliant with JWT authentication, rate limiting, 
            and comprehensive audit logging. Your data is secure.
          </p>
          <a href="#" class="feature-link">
            Security Details →
          </a>
        </div>
      </div>
    `;
  }

  renderDocumentationContent() {
    return html`
      <div style="padding: 40px; text-align: center;">
        <h2 style="margin-bottom: 20px; color: #1f2937;">📖 API Documentation</h2>
        <p style="color: #6b7280; margin-bottom: 32px; font-size: 18px;">
          Comprehensive API documentation with interactive examples and code samples.
        </p>
        
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <a href="/docs" class="btn btn-primary" target="_blank">
            📖 OpenAPI Docs
          </a>
          <a href="/docs/redoc" class="btn btn-secondary" target="_blank">
            📋 ReDoc Format
          </a>
          <button class="btn btn-secondary" @click=${() => this.selectTab('playground')}>
            🧪 Interactive Testing
          </button>
        </div>

        <div style="margin-top: 40px; padding: 32px; background: #f8fafc; border-radius: 12px; text-align: left;">
          <h3 style="margin: 0 0 16px 0; color: #1f2937;">🚀 Quick Start Examples</h3>
          
          <div style="background: #1f2937; color: #f9fafb; padding: 20px; border-radius: 8px; font-family: monospace; margin: 16px 0;">
            <div style="margin-bottom: 12px; color: #9ca3af; font-size: 12px;">AUTHENTICATION</div>
            <div>curl -X POST "https://api.neoforge.dev/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "user@example.com", "password": "password"}'</div>
          </div>

          <div style="background: #1f2937; color: #f9fafb; padding: 20px; border-radius: 8px; font-family: monospace; margin: 16px 0;">
            <div style="margin-bottom: 12px; color: #9ca3af; font-size: 12px;">GET USER PROFILE</div>
            <div>curl -X GET "https://api.neoforge.dev/api/v1/users/me" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"</div>
          </div>

          <div style="background: #1f2937; color: #f9fafb; padding: 20px; border-radius: 8px; font-family: monospace; margin: 16px 0;">
            <div style="margin-bottom: 12px; color: #9ca3af; font-size: 12px;">CREATE PROJECT</div>
            <div>curl -X POST "https://api.neoforge.dev/api/v1/projects" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Project", "description": "A new project"}'</div>
          </div>
        </div>
      </div>
    `;
  }

  renderQuickStartSection() {
    return html`
      <div class="quick-start-section">
        <h2 class="quick-start-title">🚀 Get Started in Minutes</h2>
        <p class="quick-start-description">
          Follow these simple steps to integrate NeoForge API into your application 
          and start building powerful features today.
        </p>
        
        <div class="quick-start-steps">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3 class="step-title">Create Account</h3>
            <p class="step-description">
              Sign up for free and get instant access to all API endpoints with 1,000 free requests per month.
            </p>
          </div>
          
          <div class="step-card">
            <div class="step-number">2</div>
            <h3 class="step-title">Get API Key</h3>
            <p class="step-description">
              Generate your API key in the Developer Portal with custom permissions and rate limits.
            </p>
          </div>
          
          <div class="step-card">
            <div class="step-number">3</div>
            <h3 class="step-title">Make First Request</h3>
            <p class="step-description">
              Test your integration with our interactive playground or follow our quickstart guide.
            </p>
          </div>
          
          <div class="step-card">
            <div class="step-number">4</div>
            <h3 class="step-title">Go to Production</h3>
            <p class="step-description">
              Deploy with confidence using our production checklist and monitoring tools.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('developer-page', DeveloperPage);