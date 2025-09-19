/**
 * Developer Portal Component
 * 
 * Comprehensive developer dashboard for API management featuring:
 * - API key generation and management
 * - Usage analytics and rate limiting
 * - Integration guides and quickstart tutorials
 * - SDK documentation and downloads
 * - Developer account settings
 */

import { LitElement, html, css } from 'lit';

export class DeveloperPortal extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }

    .portal-container {
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

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 40px;
    }

    .card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .card h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .api-keys-section {
      grid-column: 1 / -1;
    }

    .api-key-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
    }

    .api-key-info {
      flex: 1;
    }

    .api-key-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .api-key-value {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 13px;
      color: #6b7280;
      background: #ffffff;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      margin-bottom: 8px;
    }

    .api-key-meta {
      font-size: 12px;
      color: #9ca3af;
    }

    .api-key-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-small {
      padding: 6px 12px;
      font-size: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8fafc, #e2e8f0);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .usage-chart {
      background: #1f2937;
      border-radius: 12px;
      padding: 20px;
      color: white;
      margin-top: 16px;
    }

    .chart-placeholder {
      height: 200px;
      background: linear-gradient(45deg, #374151, #4b5563);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-style: italic;
    }

    .quick-start-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .quick-start-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .quick-start-item:last-child {
      border-bottom: none;
    }

    .quick-start-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 18px;
    }

    .quick-start-content {
      flex: 1;
    }

    .quick-start-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .quick-start-description {
      font-size: 14px;
      color: #6b7280;
    }

    .integration-guides {
      grid-column: 1 / -1;
    }

    .guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .guide-card {
      background: linear-gradient(135deg, #f8fafc, #e2e8f0);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
      cursor: pointer;
    }

    .guide-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .guide-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      font-size: 24px;
    }

    .guide-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .guide-description {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .guide-features {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .guide-features li {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .guide-features li::before {
      content: '✓';
      color: #10b981;
      font-weight: bold;
    }

    .sdk-downloads {
      grid-column: 1 / -1;
    }

    .sdk-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .sdk-card {
      background: #1f2937;
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      transition: all 0.2s;
    }

    .sdk-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .sdk-logo {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px auto;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .sdk-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .sdk-version {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 16px;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal h3 {
      margin: 0 0 20px 0;
      font-size: 24px;
      color: #1f2937;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .form-select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      box-sizing: border-box;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .rate-limit-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
    }

    .rate-limit-bar {
      flex: 1;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .rate-limit-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s;
    }

    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .guide-grid,
      .sdk-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  static properties = {
    user: { type: Object },
    apiKeys: { type: Array },
    usage: { type: Object },
    showCreateModal: { type: Boolean },
    selectedGuide: { type: String }
  };

  constructor() {
    super();
    this.user = null;
    this.apiKeys = [];
    this.usage = {
      totalRequests: 0,
      requestsToday: 0,
      errorRate: 0,
      avgResponseTime: 0,
      rateLimitUsage: 0
    };
    this.showCreateModal = false;
    this.selectedGuide = null;
    
    this.loadUserData();
    this.loadApiKeys();
    this.loadUsageStats();
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
      console.error('Failed to load user data:', error);
    }
  }

  async loadApiKeys() {
    try {
      const token = localStorage.getItem('neoforge_auth_token');
      if (!token) return;
      
      // Simulated API keys for demo
      this.apiKeys = [
        {
          id: '1',
          name: 'Production API Key',
          key: 'nf_prod_' + '•'.repeat(32),
          created: '2024-01-15',
          lastUsed: '2024-01-20',
          permissions: ['read', 'write'],
          rateLimit: 1000
        },
        {
          id: '2',
          name: 'Development API Key',
          key: 'nf_dev_' + '•'.repeat(32),
          created: '2024-01-10',
          lastUsed: '2024-01-19',
          permissions: ['read'],
          rateLimit: 100
        }
      ];
      
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  }

  async loadUsageStats() {
    try {
      const token = localStorage.getItem('neoforge_auth_token');
      if (!token) return;
      
      // Simulated usage stats for demo
      this.usage = {
        totalRequests: 15847,
        requestsToday: 234,
        errorRate: 2.1,
        avgResponseTime: 145,
        rateLimitUsage: 67
      };
      
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }

  async createApiKey(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
      const newKey = {
        id: Date.now().toString(),
        name: formData.get('name'),
        key: 'nf_' + Math.random().toString(36).substring(2, 34),
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never',
        permissions: Array.from(formData.getAll('permissions')),
        rateLimit: parseInt(formData.get('rateLimit'))
      };
      
      this.apiKeys.push(newKey);
      this.showCreateModal = false;
      this.requestUpdate();
      
      // Show the actual key to user (only time they'll see it)
      alert(`Your new API key (save this, you won't see it again):\n\n${newKey.key}`);
      
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key');
    }
  }

  async revokeApiKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    
    try {
      this.apiKeys = this.apiKeys.filter(key => key.id !== keyId);
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  }

  copyApiKey(key) {
    navigator.clipboard.writeText(key);
    // Could add toast notification here
  }

  openGuide(guide) {
    this.selectedGuide = guide;
    // Could open modal or navigate to guide page
  }

  downloadSDK(language) {
    // Would trigger SDK download
    console.log(`Downloading ${language} SDK`);
  }

  render() {
    return html`
      <div class="portal-container">
        <div class="header">
          <h1>🚀 Developer Portal</h1>
          <p>Manage your API access, monitor usage, and accelerate integration</p>
        </div>

        <div class="dashboard-grid">
          ${this.renderApiKeysSection()}
          ${this.renderUsageAnalytics()}
          ${this.renderQuickStart()}
          ${this.renderIntegrationGuides()}
          ${this.renderSDKDownloads()}
        </div>

        ${this.showCreateModal ? this.renderCreateKeyModal() : ''}
      </div>
    `;
  }

  renderApiKeysSection() {
    return html`
      <div class="card api-keys-section">
        <h2>
          🔐 API Keys
          <div style="margin-left: auto;">
            <button class="btn btn-primary" @click=${() => this.showCreateModal = true}>
              + Create New Key
            </button>
          </div>
        </h2>

        ${this.apiKeys.length === 0 ? html`
          <div style="text-align: center; padding: 40px 0; color: #6b7280;">
            <p>No API keys found. Create your first key to get started.</p>
          </div>
        ` : html`
          ${this.apiKeys.map(key => html`
            <div class="api-key-item">
              <div class="api-key-info">
                <div class="api-key-name">${key.name}</div>
                <div class="api-key-value">${key.key}</div>
                <div class="api-key-meta">
                  Created: ${key.created} | Last used: ${key.lastUsed} | 
                  Permissions: ${key.permissions.join(', ')} |
                  Rate limit: ${key.rateLimit}/hour
                </div>
                <div class="rate-limit-indicator">
                  <span>${Math.floor(key.rateLimit * 0.67)}/${key.rateLimit} requests used</span>
                  <div class="rate-limit-bar">
                    <div class="rate-limit-fill" style="width: 67%"></div>
                  </div>
                </div>
              </div>
              <div class="api-key-actions">
                <button class="btn btn-secondary btn-small" @click=${() => this.copyApiKey(key.key)}>
                  📋 Copy
                </button>
                <button class="btn btn-danger btn-small" @click=${() => this.revokeApiKey(key.id)}>
                  🗑️ Revoke
                </button>
              </div>
            </div>
          `)}
        `}
      </div>
    `;
  }

  renderUsageAnalytics() {
    return html`
      <div class="card">
        <h2>📊 Usage Analytics</h2>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${this.usage.totalRequests.toLocaleString()}</div>
            <div class="stat-label">Total Requests</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.usage.requestsToday}</div>
            <div class="stat-label">Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.usage.errorRate}%</div>
            <div class="stat-label">Error Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.usage.avgResponseTime}ms</div>
            <div class="stat-label">Avg Response</div>
          </div>
        </div>

        <div class="usage-chart">
          <h4 style="margin: 0 0 16px 0; color: white;">API Usage Over Time</h4>
          <div class="chart-placeholder">
            Interactive chart would be rendered here<br>
            (Chart.js, D3, or similar visualization)
          </div>
        </div>
      </div>
    `;
  }

  renderQuickStart() {
    return html`
      <div class="card">
        <h2>⚡ Quick Start</h2>
        
        <ul class="quick-start-list">
          <li class="quick-start-item">
            <div class="quick-start-icon">📖</div>
            <div class="quick-start-content">
              <div class="quick-start-title">API Documentation</div>
              <div class="quick-start-description">Explore all available endpoints</div>
            </div>
            <button class="btn btn-secondary btn-small">View Docs</button>
          </li>
          
          <li class="quick-start-item">
            <div class="quick-start-icon">🧪</div>
            <div class="quick-start-content">
              <div class="quick-start-title">API Playground</div>
              <div class="quick-start-description">Test endpoints interactively</div>
            </div>
            <button class="btn btn-secondary btn-small">Open Playground</button>
          </li>
          
          <li class="quick-start-item">
            <div class="quick-start-icon">📚</div>
            <div class="quick-start-content">
              <div class="quick-start-title">Code Examples</div>
              <div class="quick-start-description">Copy-paste integration examples</div>
            </div>
            <button class="btn btn-secondary btn-small">Browse Examples</button>
          </li>
          
          <li class="quick-start-item">
            <div class="quick-start-icon">💬</div>
            <div class="quick-start-content">
              <div class="quick-start-title">Developer Support</div>
              <div class="quick-start-description">Get help from our team</div>
            </div>
            <button class="btn btn-secondary btn-small">Contact Support</button>
          </li>
        </ul>
      </div>
    `;
  }

  renderIntegrationGuides() {
    const guides = [
      {
        id: 'authentication',
        icon: '🔐',
        title: 'Authentication Guide',
        description: 'Learn how to authenticate and manage user sessions with JWT tokens.',
        features: ['JWT token flow', 'Refresh tokens', 'Session management', 'Security best practices']
      },
      {
        id: 'webhooks',
        icon: '🪝',
        title: 'Webhooks Setup',
        description: 'Configure real-time notifications for your application events.',
        features: ['Event subscriptions', 'Webhook verification', 'Retry logic', 'Testing tools']
      },
      {
        id: 'rate-limiting',
        icon: '⚡',
        title: 'Rate Limiting',
        description: 'Understand API limits and implement proper error handling.',
        features: ['Rate limit headers', 'Backoff strategies', 'Quota management', 'Usage optimization']
      },
      {
        id: 'pagination',
        icon: '📄',
        title: 'Pagination Guide',
        description: 'Efficiently handle large datasets with cursor-based pagination.',
        features: ['Cursor pagination', 'Performance tips', 'Data consistency', 'Error handling']
      },
      {
        id: 'testing',
        icon: '🧪',
        title: 'Testing Guide',
        description: 'Test your integration with our sandbox environment.',
        features: ['Sandbox access', 'Test data', 'Mock responses', 'CI/CD integration']
      },
      {
        id: 'production',
        icon: '🚀',
        title: 'Going Live',
        description: 'Production deployment checklist and monitoring setup.',
        features: ['Environment setup', 'Monitoring', 'Error tracking', 'Performance optimization']
      }
    ];

    return html`
      <div class="card integration-guides">
        <h2>📖 Integration Guides</h2>
        
        <div class="guide-grid">
          ${guides.map(guide => html`
            <div class="guide-card" @click=${() => this.openGuide(guide.id)}>
              <div class="guide-icon">${guide.icon}</div>
              <div class="guide-title">${guide.title}</div>
              <div class="guide-description">${guide.description}</div>
              <ul class="guide-features">
                ${guide.features.map(feature => html`<li>${feature}</li>`)}
              </ul>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  renderSDKDownloads() {
    const sdks = [
      { name: 'JavaScript', icon: '📜', version: 'v2.1.0', logo: 'JS' },
      { name: 'Python', icon: '🐍', version: 'v1.8.0', logo: 'PY' },
      { name: 'PHP', icon: '🐘', version: 'v1.5.0', logo: 'PHP' },
      { name: 'Ruby', icon: '💎', version: 'v1.3.0', logo: 'RB' },
      { name: 'Go', icon: '🐹', version: 'v1.2.0', logo: 'GO' },
      { name: 'Rust', icon: '🦀', version: 'v0.9.0', logo: 'RS' }
    ];

    return html`
      <div class="card sdk-downloads">
        <h2>📦 SDK Downloads</h2>
        
        <div class="sdk-grid">
          ${sdks.map(sdk => html`
            <div class="sdk-card" @click=${() => this.downloadSDK(sdk.name.toLowerCase())}>
              <div class="sdk-logo">${sdk.logo}</div>
              <div class="sdk-name">${sdk.name}</div>
              <div class="sdk-version">${sdk.version}</div>
              <button class="btn btn-primary btn-small">
                ⬇️ Download
              </button>
            </div>
          `)}
        </div>
        
        <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            🛠️ Need an SDK for a different language? 
            <a href="#" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Request it here</a>
          </p>
        </div>
      </div>
    `;
  }

  renderCreateKeyModal() {
    return html`
      <div class="modal" @click=${(e) => e.target === e.currentTarget && (this.showCreateModal = false)}>
        <div class="modal-content">
          <h3>Create New API Key</h3>
          
          <form @submit=${this.createApiKey}>
            <div class="form-group">
              <label for="name">Key Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                class="form-input" 
                placeholder="e.g., Production API Key"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="permissions">Permissions *</label>
              <select name="permissions" class="form-select" multiple required>
                <option value="read">Read Access</option>
                <option value="write">Write Access</option>
                <option value="delete">Delete Access</option>
                <option value="admin">Admin Access</option>
              </select>
              <small style="color: #6b7280; font-size: 12px;">Hold Ctrl/Cmd to select multiple</small>
            </div>
            
            <div class="form-group">
              <label for="rateLimit">Rate Limit (requests/hour) *</label>
              <select name="rateLimit" class="form-select" required>
                <option value="100">100 requests/hour (Development)</option>
                <option value="1000">1,000 requests/hour (Production)</option>
                <option value="5000">5,000 requests/hour (Enterprise)</option>
                <option value="10000">10,000 requests/hour (Premium)</option>
              </select>
            </div>
            
            <div style="padding: 16px; background: #fef3c7; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                ⚠️ <strong>Important:</strong> You'll only see the full API key once. 
                Make sure to copy and store it securely.
              </p>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click=${() => this.showCreateModal = false}>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                Create API Key
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}

customElements.define('developer-portal', DeveloperPortal);