/**
 * Integration Guides Component
 * 
 * Comprehensive integration tutorials and quickstart guides for NeoForge API:
 * - Step-by-step authentication setup
 * - Code examples in multiple languages
 * - Interactive tutorials with live testing
 * - Best practices and common patterns
 * - Troubleshooting and error handling
 */

import { LitElement, html, css } from 'lit';

export class IntegrationGuides extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }

    .guides-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      padding: 40px 0;
      color: white;
    }

    .header h1 {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 16px 0;
      background: linear-gradient(45deg, #fff, #e2e8f0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header p {
      font-size: 20px;
      opacity: 0.9;
      margin: 0;
      font-weight: 300;
    }

    .guides-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 24px;
      margin-bottom: 40px;
    }

    .sidebar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      height: fit-content;
      position: sticky;
      top: 20px;
    }

    .content-area {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .nav-section {
      margin-bottom: 32px;
    }

    .nav-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .nav-item {
      padding: 8px 12px;
      margin: 2px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-item:hover {
      background: #f3f4f6;
    }

    .nav-item.active {
      background: #4f46e5;
      color: white;
    }

    .nav-item-icon {
      font-size: 16px;
    }

    .guide-content {
      padding: 32px;
    }

    .guide-header {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .guide-title {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .guide-description {
      font-size: 18px;
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    .guide-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #7c3aed);
      transition: width 0.3s;
    }

    .step {
      margin-bottom: 48px;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .step-number {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
    }

    .step-title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .step-content {
      margin-left: 56px;
    }

    .step-description {
      font-size: 16px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .code-block {
      background: #1f2937;
      color: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 14px;
      overflow-x: auto;
      position: relative;
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #374151;
    }

    .code-title {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .code-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn-copy {
      background: #374151;
      color: #f9fafb;
    }

    .btn-copy:hover {
      background: #4b5563;
    }

    .btn-test {
      background: #10b981;
      color: white;
    }

    .btn-test:hover {
      background: #059669;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
      padding: 12px 24px;
      font-size: 14px;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .language-tabs {
      display: flex;
      border-bottom: 1px solid #374151;
      margin-bottom: 16px;
    }

    .language-tab {
      padding: 8px 16px;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .language-tab:hover {
      color: #f9fafb;
    }

    .language-tab.active {
      color: #f9fafb;
      border-bottom-color: #4f46e5;
    }

    .warning-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .warning-icon {
      font-size: 20px;
      color: #f59e0b;
      margin-top: 2px;
    }

    .warning-content {
      flex: 1;
    }

    .warning-title {
      font-weight: 600;
      color: #92400e;
      margin: 0 0 4px 0;
    }

    .warning-text {
      color: #92400e;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    .success-box {
      background: #d1fae5;
      border: 1px solid #10b981;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .success-icon {
      font-size: 20px;
      color: #10b981;
      margin-top: 2px;
    }

    .success-content {
      flex: 1;
    }

    .success-title {
      font-weight: 600;
      color: #065f46;
      margin: 0 0 4px 0;
    }

    .success-text {
      color: #065f46;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    .interactive-demo {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .demo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .demo-title {
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .demo-form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: end;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    }

    .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .demo-result {
      background: #1f2937;
      color: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }

    .troubleshooting {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .troubleshooting h4 {
      color: #991b1b;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .troubleshooting-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .troubleshooting-item {
      padding: 12px 0;
      border-bottom: 1px solid #fecaca;
      color: #7f1d1d;
    }

    .troubleshooting-item:last-child {
      border-bottom: none;
    }

    .troubleshooting-problem {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .troubleshooting-solution {
      font-size: 14px;
      line-height: 1.5;
    }

    .next-steps {
      background: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin: 32px 0;
      text-align: center;
    }

    .next-steps h4 {
      color: #1d4ed8;
      margin: 0 0 12px 0;
    }

    .next-steps p {
      color: #1e40af;
      margin: 0 0 16px 0;
    }

    .next-steps-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    @media (max-width: 1024px) {
      .guides-layout {
        grid-template-columns: 1fr;
      }
      
      .sidebar {
        position: static;
        order: 2;
      }
      
      .content-area {
        order: 1;
      }
    }

    @media (max-width: 768px) {
      .guide-content {
        padding: 20px;
      }
      
      .step-content {
        margin-left: 0;
      }
      
      .step-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .next-steps-actions {
        flex-direction: column;
      }
    }
  `;

  static properties = {
    activeGuide: { type: String },
    activeLanguage: { type: String },
    completedSteps: { type: Array },
    demoResults: { type: Object }
  };

  constructor() {
    super();
    this.activeGuide = 'quickstart';
    this.activeLanguage = 'javascript';
    this.completedSteps = [];
    this.demoResults = {};
  }

  selectGuide(guide) {
    this.activeGuide = guide;
    this.completedSteps = [];
    this.requestUpdate();
  }

  selectLanguage(language) {
    this.activeLanguage = language;
    this.requestUpdate();
  }

  copyCode(code) {
    navigator.clipboard.writeText(code);
    // Could show toast notification
  }

  async testCode(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      this.demoResults[endpoint] = {
        status: response.status,
        data: result
      };
      this.requestUpdate();
    } catch (error) {
      this.demoResults[endpoint] = {
        status: 'error',
        data: { error: error.message }
      };
      this.requestUpdate();
    }
  }

  markStepComplete(stepId) {
    if (!this.completedSteps.includes(stepId)) {
      this.completedSteps.push(stepId);
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <div class="guides-container">
        <div class="header">
          <h1>📚 Integration Guides</h1>
          <p>Step-by-step tutorials to get you up and running in minutes</p>
        </div>

        <div class="guides-layout">
          ${this.renderSidebar()}
          ${this.renderContent()}
        </div>
      </div>
    `;
  }

  renderSidebar() {
    const guides = [
      {
        section: 'Getting Started',
        items: [
          { id: 'quickstart', icon: '🚀', title: 'Quick Start' },
          { id: 'authentication', icon: '🔐', title: 'Authentication' },
          { id: 'first-request', icon: '📡', title: 'Your First Request' }
        ]
      },
      {
        section: 'Core Features',
        items: [
          { id: 'users', icon: '👥', title: 'User Management' },
          { id: 'projects', icon: '📁', title: 'Projects & Organizations' },
          { id: 'billing', icon: '💳', title: 'Billing & Subscriptions' }
        ]
      },
      {
        section: 'Advanced',
        items: [
          { id: 'webhooks', icon: '🪝', title: 'Webhooks' },
          { id: 'rate-limiting', icon: '⚡', title: 'Rate Limiting' },
          { id: 'pagination', icon: '📄', title: 'Pagination' },
          { id: 'errors', icon: '🚨', title: 'Error Handling' }
        ]
      },
      {
        section: 'Production',
        items: [
          { id: 'security', icon: '🛡️', title: 'Security Best Practices' },
          { id: 'monitoring', icon: '📊', title: 'Monitoring & Analytics' },
          { id: 'deployment', icon: '🚀', title: 'Deployment Guide' }
        ]
      }
    ];

    return html`
      <div class="sidebar">
        ${guides.map(section => html`
          <div class="nav-section">
            <h3>${section.section}</h3>
            ${section.items.map(item => html`
              <div 
                class="nav-item ${this.activeGuide === item.id ? 'active' : ''}"
                @click=${() => this.selectGuide(item.id)}
              >
                <span class="nav-item-icon">${item.icon}</span>
                <span>${item.title}</span>
              </div>
            `)}
          </div>
        `)}
      </div>
    `;
  }

  renderContent() {
    return html`
      <div class="content-area">
        <div class="guide-content">
          ${this.renderGuideContent()}
        </div>
      </div>
    `;
  }

  renderGuideContent() {
    switch (this.activeGuide) {
      case 'quickstart':
        return this.renderQuickStartGuide();
      case 'authentication':
        return this.renderAuthenticationGuide();
      case 'first-request':
        return this.renderFirstRequestGuide();
      case 'users':
        return this.renderUsersGuide();
      case 'projects':
        return this.renderProjectsGuide();
      case 'billing':
        return this.renderBillingGuide();
      case 'webhooks':
        return this.renderWebhooksGuide();
      case 'rate-limiting':
        return this.renderRateLimitingGuide();
      case 'pagination':
        return this.renderPaginationGuide();
      case 'errors':
        return this.renderErrorHandlingGuide();
      case 'security':
        return this.renderSecurityGuide();
      case 'monitoring':
        return this.renderMonitoringGuide();
      case 'deployment':
        return this.renderDeploymentGuide();
      default:
        return this.renderQuickStartGuide();
    }
  }

  renderQuickStartGuide() {
    const progress = (this.completedSteps.length / 4) * 100;
    
    return html`
      <div class="guide-header">
        <h1 class="guide-title">
          🚀 Quick Start Guide
        </h1>
        <p class="guide-description">
          Get started with NeoForge API in under 10 minutes. This guide will walk you through 
          setting up authentication, making your first API call, and understanding the response format.
        </p>
        <div class="guide-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span>${this.completedSteps.length}/4 steps completed</span>
        </div>
      </div>

      <div class="step">
        <div class="step-header">
          <div class="step-number">1</div>
          <h2 class="step-title">Create Your Account</h2>
        </div>
        <div class="step-content">
          <p class="step-description">
            First, you'll need a NeoForge account to access the API. Sign up for free and 
            get 1,000 API calls per month on the starter plan.
          </p>
          
          <div class="interactive-demo">
            <div class="demo-header">
              <h4 class="demo-title">Try it now</h4>
            </div>
            <form class="demo-form" @submit=${(e) => this.handleRegistration(e)}>
              <div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" class="form-input" name="email" placeholder="you@company.com" required>
                </div>
                <div class="form-group">
                  <label>Password</label>
                  <input type="password" class="form-input" name="password" placeholder="Secure password" required>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">Sign Up</button>
            </form>
            ${this.demoResults.registration ? html`
              <div class="demo-result">${JSON.stringify(this.demoResults.registration, null, 2)}</div>
            ` : ''}
          </div>

          <button class="btn btn-primary" @click=${() => this.markStepComplete('account')}>
            ✓ I have an account
          </button>
        </div>
      </div>

      <div class="step">
        <div class="step-header">
          <div class="step-number">2</div>
          <h2 class="step-title">Get Your API Key</h2>
        </div>
        <div class="step-content">
          <p class="step-description">
            Navigate to your Developer Portal and create your first API key. You'll use this 
            key to authenticate all your API requests.
          </p>

          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Your API Key Format</span>
              <div class="code-actions">
                <button class="btn btn-copy" @click=${() => this.copyCode('nf_sk_1234567890abcdef...')}>
                  📋 Copy
                </button>
              </div>
            </div>
            <div>nf_sk_1234567890abcdef1234567890abcdef</div>
          </div>

          <div class="warning-box">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <div class="warning-title">Keep Your API Key Secret</div>
              <p class="warning-text">
                Never expose your API key in client-side code or public repositories. 
                Always use environment variables in production.
              </p>
            </div>
          </div>

          <button class="btn btn-primary" @click=${() => this.markStepComplete('api-key')}>
            ✓ I have my API key
          </button>
        </div>
      </div>

      <div class="step">
        <div class="step-header">
          <div class="step-number">3</div>
          <h2 class="step-title">Make Your First Request</h2>
        </div>
        <div class="step-content">
          <p class="step-description">
            Let's start with a simple request to get your user profile. This will verify 
            your authentication is working correctly.
          </p>

          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Get User Profile</span>
              <div class="code-actions">
                <button class="btn btn-copy" @click=${() => this.copyCode(this.getCodeExample('profile', this.activeLanguage))}>
                  📋 Copy
                </button>
                <button class="btn btn-test" @click=${() => this.testCode('/api/v1/users/me', {})}>
                  🧪 Test
                </button>
              </div>
            </div>
            <div class="language-tabs">
              ${['javascript', 'python', 'curl', 'php'].map(lang => html`
                <button 
                  class="language-tab ${this.activeLanguage === lang ? 'active' : ''}"
                  @click=${() => this.selectLanguage(lang)}
                >
                  ${lang.toUpperCase()}
                </button>
              `)}
            </div>
            <div>${this.getCodeExample('profile', this.activeLanguage)}</div>
          </div>

          ${this.demoResults['/api/v1/users/me'] ? html`
            <div class="success-box">
              <div class="success-icon">✅</div>
              <div class="success-content">
                <div class="success-title">Success!</div>
                <p class="success-text">Your API request was successful.</p>
              </div>
            </div>
            <div class="demo-result">${JSON.stringify(this.demoResults['/api/v1/users/me'], null, 2)}</div>
          ` : ''}

          <button class="btn btn-primary" @click=${() => this.markStepComplete('first-request')}>
            ✓ Request successful
          </button>
        </div>
      </div>

      <div class="step">
        <div class="step-header">
          <div class="step-number">4</div>
          <h2 class="step-title">Explore the API</h2>
        </div>
        <div class="step-content">
          <p class="step-description">
            Great! Now you're ready to explore all the features NeoForge API has to offer. 
            Try these popular endpoints to get started.
          </p>

          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Popular Endpoints</span>
            </div>
            <div>
GET /api/v1/users/me          # Get current user
GET /api/v1/projects          # List projects  
POST /api/v1/projects         # Create project
GET /api/v1/organizations     # List organizations
POST /api/v1/auth/logout      # Logout user
            </div>
          </div>

          <button class="btn btn-primary" @click=${() => this.markStepComplete('explore')}>
            ✓ Ready to build
          </button>
        </div>
      </div>

      ${this.completedSteps.length >= 4 ? html`
        <div class="next-steps">
          <h4>🎉 Congratulations!</h4>
          <p>You've completed the quick start guide. You're now ready to integrate NeoForge into your application.</p>
          <div class="next-steps-actions">
            <button class="btn btn-primary" @click=${() => this.selectGuide('users')}>
              👥 User Management Guide
            </button>
            <button class="btn btn-primary" @click=${() => this.selectGuide('projects')}>
              📁 Projects Guide  
            </button>
            <button class="btn btn-primary">
              🧪 Open API Playground
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }

  renderAuthenticationGuide() {
    return html`
      <div class="guide-header">
        <h1 class="guide-title">
          🔐 Authentication Guide
        </h1>
        <p class="guide-description">
          Learn how to authenticate users, manage sessions, and handle JWT tokens securely.
        </p>
      </div>

      <div class="step">
        <div class="step-header">
          <div class="step-number">1</div>
          <h2 class="step-title">Understanding JWT Authentication</h2>
        </div>
        <div class="step-content">
          <p class="step-description">
            NeoForge uses JWT (JSON Web Tokens) for authentication. When a user logs in, 
            you receive an access token and a refresh token.
          </p>

          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Login Request</span>
              <div class="code-actions">
                <button class="btn btn-copy" @click=${() => this.copyCode(this.getCodeExample('login', this.activeLanguage))}>
                  📋 Copy
                </button>
              </div>
            </div>
            <div class="language-tabs">
              ${['javascript', 'python', 'curl'].map(lang => html`
                <button 
                  class="language-tab ${this.activeLanguage === lang ? 'active' : ''}"
                  @click=${() => this.selectLanguage(lang)}
                >
                  ${lang.toUpperCase()}
                </button>
              `)}
            </div>
            <div>${this.getCodeExample('login', this.activeLanguage)}</div>
          </div>

          <div class="warning-box">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <div class="warning-title">Token Security</div>
              <p class="warning-text">
                Store tokens securely. Use httpOnly cookies for web apps or secure storage for mobile apps.
                Never store tokens in localStorage for production applications.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-header">
          <div class="step-number">2</div>
          <h2 class="step-title">Making Authenticated Requests</h2>
        </div>
        <div class="step-content">
          <p class="step-description">
            Include the access token in the Authorization header for all authenticated requests.
          </p>

          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Authenticated Request</span>
            </div>
            <div>${this.getCodeExample('authenticated-request', this.activeLanguage)}</div>
          </div>
        </div>
      </div>

      <div class="troubleshooting">
        <h4>🚨 Common Authentication Issues</h4>
        <ul class="troubleshooting-list">
          <li class="troubleshooting-item">
            <div class="troubleshooting-problem">401 Unauthorized Error</div>
            <div class="troubleshooting-solution">
              Check that your token is valid and included in the Authorization header as "Bearer {token}"
            </div>
          </li>
          <li class="troubleshooting-item">
            <div class="troubleshooting-problem">Token Expired</div>
            <div class="troubleshooting-solution">
              Use the refresh token to get a new access token, or redirect to login
            </div>
          </li>
          <li class="troubleshooting-item">
            <div class="troubleshooting-problem">Invalid Credentials</div>
            <div class="troubleshooting-solution">
              Verify email/password combination. Check for typos and ensure account exists
            </div>
          </li>
        </ul>
      </div>
    `;
  }

  renderFirstRequestGuide() {
    return html`
      <div class="guide-header">
        <h1 class="guide-title">
          📡 Your First Request
        </h1>
        <p class="guide-description">
          Learn the basics of making API requests, handling responses, and understanding the data format.
        </p>
      </div>

      <!-- Content for first request guide -->
      <div class="step">
        <div class="step-header">
          <div class="step-number">1</div>
          <h2 class="step-title">API Base URL and Endpoints</h2>
        </div>
        <div class="step-content">
          <p class="step-description">
            All API requests are made to: <strong>https://api.neoforge.dev</strong>
          </p>
          
          <div class="code-block">
            <div class="code-header">
              <span class="code-title">Available Endpoints</span>
            </div>
            <div>
Base URL: https://api.neoforge.dev

Authentication:
POST /api/v1/auth/login
POST /api/v1/auth/logout  
POST /api/v1/auth/refresh

Users:
GET  /api/v1/users/me
PUT  /api/v1/users/me
GET  /api/v1/users/profile

Projects:
GET  /api/v1/projects
POST /api/v1/projects
GET  /api/v1/projects/{id}
PUT  /api/v1/projects/{id}
DELETE /api/v1/projects/{id}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Add other guide render methods...
  renderUsersGuide() {
    return html`<div>Users guide content...</div>`;
  }

  renderProjectsGuide() {
    return html`<div>Projects guide content...</div>`;
  }

  renderBillingGuide() {
    return html`<div>Billing guide content...</div>`;
  }

  renderWebhooksGuide() {
    return html`<div>Webhooks guide content...</div>`;
  }

  renderRateLimitingGuide() {
    return html`<div>Rate limiting guide content...</div>`;
  }

  renderPaginationGuide() {
    return html`<div>Pagination guide content...</div>`;
  }

  renderErrorHandlingGuide() {
    return html`<div>Error handling guide content...</div>`;
  }

  renderSecurityGuide() {
    return html`<div>Security guide content...</div>`;
  }

  renderMonitoringGuide() {
    return html`<div>Monitoring guide content...</div>`;
  }

  renderDeploymentGuide() {
    return html`<div>Deployment guide content...</div>`;
  }

  getCodeExample(type, language) {
    const examples = {
      profile: {
        javascript: `const response = await fetch('https://api.neoforge.dev/api/v1/users/me', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
});

const user = await response.json();
console.log(user);`,
        python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.neoforge.dev/api/v1/users/me',
    headers=headers
)

user = response.json()
print(user)`,
        curl: `curl -X GET "https://api.neoforge.dev/api/v1/users/me" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`,
        php: `<?php
$headers = [
    'Authorization: Bearer YOUR_ACCESS_TOKEN',
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.neoforge.dev/api/v1/users/me');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$user = json_decode($response, true);
curl_close($ch);

print_r($user);
?>`
      },
      login: {
        javascript: `const response = await fetch('https://api.neoforge.dev/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'secure-password'
  })
});

const { access_token, refresh_token } = await response.json();

// Store tokens securely
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);`,
        python: `import requests

response = requests.post(
    'https://api.neoforge.dev/api/v1/auth/login',
    json={
        'username': 'user@example.com',
        'password': 'secure-password'
    }
)

tokens = response.json()
access_token = tokens['access_token']
refresh_token = tokens['refresh_token']

# Store tokens securely`,
        curl: `curl -X POST "https://api.neoforge.dev/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "user@example.com",
    "password": "secure-password"
  }'`
      },
      'authenticated-request': {
        javascript: `// Always include the Authorization header
const response = await fetch('https://api.neoforge.dev/api/v1/projects', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + access_token,
    'Content-Type': 'application/json'
  }
});

if (response.status === 401) {
  // Token expired, refresh or redirect to login
  await refreshToken();
}

const data = await response.json();`,
        python: `headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.neoforge.dev/api/v1/projects',
    headers=headers
)

if response.status_code == 401:
    # Token expired, refresh or redirect to login
    refresh_token()

data = response.json()`,
        curl: `curl -X GET "https://api.neoforge.dev/api/v1/projects" \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`
      }
    };

    return examples[type]?.[language] || '';
  }

  async handleRegistration(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        })
      });
      
      const result = await response.json();
      this.demoResults.registration = result;
      this.requestUpdate();
      
      if (response.ok) {
        this.markStepComplete('account');
      }
    } catch (error) {
      this.demoResults.registration = { error: error.message };
      this.requestUpdate();
    }
  }
}

customElements.define('integration-guides', IntegrationGuides);