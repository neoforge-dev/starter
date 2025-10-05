/**
 * Interactive API Playground Component
 * 
 * A comprehensive developer tool for testing NeoForge API endpoints with:
 * - Live request/response testing
 * - Authentication token management
 * - Request collection save/share
 * - Code generation for multiple languages
 * - Real-time validation and error handling
 */

import { LitElement, html, css } from 'lit';
import { until } from 'lit/directives/until.js';
import { Logger } from '../../utils/logger.js';

export class ApiPlayground extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }

    .playground-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
      height: 100vh;
      box-sizing: border-box;
    }

    .sidebar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow-y: auto;
    }

    .main-panel {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(90deg, #4f46e5, #7c3aed);
      color: white;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .request-panel {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .response-panel {
      flex: 1;
      padding: 20px;
      background: #f8fafc;
      border-left: 1px solid #e5e7eb;
      overflow-y: auto;
    }

    .endpoint-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .endpoint-group {
      margin-bottom: 20px;
    }

    .endpoint-group h3 {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 8px 0;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .endpoint-item {
      padding: 8px 12px;
      margin: 4px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      font-size: 13px;
    }

    .endpoint-item:hover {
      background: #f3f4f6;
    }

    .endpoint-item.active {
      background: #4f46e5;
      color: white;
    }

    .method-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      margin-right: 8px;
      min-width: 40px;
      text-align: center;
    }

    .method-get { background: #10b981; color: white; }
    .method-post { background: #3b82f6; color: white; }
    .method-put { background: #f59e0b; color: white; }
    .method-delete { background: #ef4444; color: white; }
    .method-patch { background: #8b5cf6; color: white; }

    .auth-section {
      margin-bottom: 20px;
      padding: 16px;
      background: #f0f9ff;
      border-radius: 8px;
      border: 1px solid #0ea5e9;
    }

    .auth-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #0369a1;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    }

    .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: #4f46e5;
      color: white;
    }

    .btn-primary:hover {
      background: #4338ca;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .request-url {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .request-url select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      background: white;
    }

    .request-url input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 20px;
    }

    .tab {
      padding: 12px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab:hover {
      color: #374151;
    }

    .tab.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .json-editor {
      width: 100%;
      min-height: 200px;
      padding: 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 13px;
      resize: vertical;
      background: #f8fafc;
    }

    .response-container {
      background: #1f2937;
      color: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
    }

    .response-header {
      padding: 12px 16px;
      background: #111827;
      border-bottom: 1px solid #374151;
      display: flex;
      justify-content: between;
      align-items: center;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-200 { background: #10b981; color: white; }
    .status-400 { background: #f59e0b; color: white; }
    .status-401 { background: #ef4444; color: white; }
    .status-500 { background: #ef4444; color: white; }

    .response-body {
      padding: 16px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #4f46e5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .code-example {
      margin-top: 20px;
      background: #1f2937;
      border-radius: 8px;
      overflow: hidden;
    }

    .code-example-header {
      padding: 12px 16px;
      background: #111827;
      border-bottom: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .code-example-header select {
      background: #374151;
      color: white;
      border: 1px solid #4b5563;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
    }

    .code-example-body {
      padding: 16px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 13px;
      color: #f9fafb;
      white-space: pre-wrap;
      overflow-x: auto;
    }

    .quick-auth {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
    }

    .collections-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .collections-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #374151;
      font-weight: 600;
    }

    .collection-item {
      padding: 8px 12px;
      margin: 4px 0;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .collection-item:hover {
      background: #f3f4f6;
    }

    @media (max-width: 1024px) {
      .playground-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }
      
      .sidebar {
        max-height: 300px;
      }
    }
  `;

  static properties = {
    selectedEndpoint: { type: Object },
    activeTab: { type: String },
    authToken: { type: String },
    apiKey: { type: String },
    requestBody: { type: String },
    response: { type: Object },
    loading: { type: Boolean },
    endpoints: { type: Array },
    collections: { type: Array }
  };

  constructor() {
    super();
    this.selectedEndpoint = null;
    this.activeTab = 'body';
    this.authToken = localStorage.getItem('neoforge_auth_token') || '';
    this.apiKey = localStorage.getItem('neoforge_api_key') || '';
    this.requestBody = '{}';
    this.response = null;
    this.loading = false;
    this.endpoints = [];
    this.collections = JSON.parse(localStorage.getItem('neoforge_collections') || '[]');
    
    this.loadApiSchema();
  }

  async loadApiSchema() {
    try {
      const response = await fetch('/api/openapi.json');
      const schema = await response.json();
      this.endpoints = this.parseEndpoints(schema);
      this.requestUpdate();
    } catch (error) {
      Logger.error('Failed to load API schema:', error);
    }
  }

  parseEndpoints(schema) {
    const endpoints = [];
    const paths = schema.paths || {};
    
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods)) {
        if (typeof details === 'object' && details.operationId) {
          const tags = details.tags || ['general'];
          const tag = tags[0];
          
          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: details.summary || path,
            description: details.description || '',
            tag,
            operationId: details.operationId,
            parameters: details.parameters || [],
            requestBody: details.requestBody,
            responses: details.responses || {},
            security: details.security || []
          });
        }
      }
    }
    
    return endpoints.sort((a, b) => {
      if (a.tag !== b.tag) return a.tag.localeCompare(b.tag);
      return a.path.localeCompare(b.path);
    });
  }

  groupEndpointsByTag() {
    const groups = {};
    this.endpoints.forEach(endpoint => {
      if (!groups[endpoint.tag]) {
        groups[endpoint.tag] = [];
      }
      groups[endpoint.tag].push(endpoint);
    });
    return groups;
  }

  selectEndpoint(endpoint) {
    this.selectedEndpoint = endpoint;
    this.response = null;
    
    // Set default request body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      if (endpoint.requestBody?.content?.['application/json']?.schema?.example) {
        this.requestBody = JSON.stringify(endpoint.requestBody.content['application/json'].schema.example, null, 2);
      } else {
        this.requestBody = JSON.stringify({}, null, 2);
      }
    }
    
    this.requestUpdate();
  }

  async executeRequest() {
    if (!this.selectedEndpoint) return;
    
    this.loading = true;
    this.response = null;
    
    try {
      const url = this.buildRequestUrl();
      const headers = this.buildHeaders();
      const body = this.buildRequestBody();
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: this.selectedEndpoint.method,
        headers,
        body
      });
      
      const endTime = Date.now();
      const responseData = await this.parseResponse(response);
      
      this.response = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        duration: endTime - startTime
      };
      
    } catch (error) {
      this.response = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: error.message },
        duration: 0
      };
    } finally {
      this.loading = false;
    }
  }

  buildRequestUrl() {
    const baseUrl = window.location.origin;
    const path = this.selectedEndpoint.path;
    
    // Replace path parameters if any
    let finalPath = path;
    const pathParams = this.selectedEndpoint.parameters?.filter(p => p.in === 'path') || [];
    pathParams.forEach(param => {
      const value = this.shadowRoot.querySelector(`input[name="path_${param.name}"]`)?.value || '{id}';
      finalPath = finalPath.replace(`{${param.name}}`, value);
    });
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    const queryParamInputs = this.shadowRoot.querySelectorAll('input[name^="query_"]');
    queryParamInputs.forEach(input => {
      if (input.value) {
        const paramName = input.name.replace('query_', '');
        queryParams.append(paramName, input.value);
      }
    });
    
    const queryString = queryParams.toString();
    return `${baseUrl}${finalPath}${queryString ? '?' + queryString : ''}`;
  }

  buildHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    
    return headers;
  }

  buildRequestBody() {
    if (!['POST', 'PUT', 'PATCH'].includes(this.selectedEndpoint.method)) {
      return undefined;
    }
    
    try {
      return this.requestBody.trim() ? this.requestBody : undefined;
    } catch (error) {
      return undefined;
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  async quickAuth() {
    const username = this.shadowRoot.querySelector('#quick-username').value;
    const password = this.shadowRoot.querySelector('#quick-password').value;
    
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }
    
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.authToken = data.access_token;
        localStorage.setItem('neoforge_auth_token', this.authToken);
        this.requestUpdate();
      } else {
        alert('Authentication failed');
      }
    } catch (error) {
      alert('Authentication error: ' + error.message);
    }
  }

  saveCollection() {
    const name = prompt('Collection name:');
    if (!name) return;
    
    const collection = {
      id: Date.now(),
      name,
      endpoint: this.selectedEndpoint,
      authToken: this.authToken,
      apiKey: this.apiKey,
      requestBody: this.requestBody,
      createdAt: new Date().toISOString()
    };
    
    this.collections.push(collection);
    localStorage.setItem('neoforge_collections', JSON.stringify(this.collections));
    this.requestUpdate();
  }

  loadCollection(collection) {
    this.selectedEndpoint = collection.endpoint;
    this.authToken = collection.authToken || '';
    this.apiKey = collection.apiKey || '';
    this.requestBody = collection.requestBody || '{}';
    this.requestUpdate();
  }

  generateCodeExample(language) {
    if (!this.selectedEndpoint) return '';
    
    const url = this.buildRequestUrl();
    const headers = this.buildHeaders();
    const body = this.buildRequestBody();
    
    switch (language) {
      case 'curl':
        let curl = `curl -X ${this.selectedEndpoint.method} "${url}"`;
        Object.entries(headers).forEach(([key, value]) => {
          curl += ` \\\n  -H "${key}: ${value}"`;
        });
        if (body) {
          curl += ` \\\n  -d '${body}'`;
        }
        return curl;
        
      case 'javascript':
        let js = `const response = await fetch('${url}', {\n  method: '${this.selectedEndpoint.method}',\n  headers: {\n`;
        Object.entries(headers).forEach(([key, value]) => {
          js += `    '${key}': '${value}',\n`;
        });
        js += '  }';
        if (body) {
          js += `,\n  body: ${body}`;
        }
        js += '\n});\n\nconst data = await response.json();';
        return js;
        
      case 'python':
        let python = `import requests\n\nresponse = requests.${this.selectedEndpoint.method.toLowerCase()}(\n    '${url}',\n    headers={\n`;
        Object.entries(headers).forEach(([key, value]) => {
          python += `        '${key}': '${value}',\n`;
        });
        python += '    }';
        if (body) {
          python += `,\n    json=${body}`;
        }
        python += '\n)\n\ndata = response.json()';
        return python;
        
      default:
        return '';
    }
  }

  render() {
    const endpointGroups = this.groupEndpointsByTag();
    
    return html`
      <div class="playground-container">
        ${this.renderSidebar(endpointGroups)}
        ${this.renderMainPanel()}
      </div>
    `;
  }

  renderSidebar(endpointGroups) {
    return html`
      <div class="sidebar">
        <div class="auth-section">
          <h4>🔐 Authentication</h4>
          <div class="form-group">
            <label>Auth Token:</label>
            <input 
              type="password" 
              class="form-input" 
              .value=${this.authToken}
              @input=${(e) => {
                this.authToken = e.target.value;
                localStorage.setItem('neoforge_auth_token', this.authToken);
              }}
              placeholder="Bearer token"
            />
          </div>
          <div class="form-group">
            <label>API Key:</label>
            <input 
              type="password" 
              class="form-input" 
              .value=${this.apiKey}
              @input=${(e) => {
                this.apiKey = e.target.value;
                localStorage.setItem('neoforge_api_key', this.apiKey);
              }}
              placeholder="API key"
            />
          </div>
          <div class="quick-auth">
            <input id="quick-username" type="email" class="form-input" placeholder="Email" style="margin-right: 4px;">
            <input id="quick-password" type="password" class="form-input" placeholder="Password" style="margin-right: 4px;">
            <button class="btn btn-success" @click=${this.quickAuth}>Login</button>
          </div>
        </div>

        <ul class="endpoint-list">
          ${Object.entries(endpointGroups).map(([tag, endpoints]) => html`
            <li class="endpoint-group">
              <h3>${tag}</h3>
              ${endpoints.map(endpoint => html`
                <div 
                  class="endpoint-item ${this.selectedEndpoint === endpoint ? 'active' : ''}"
                  @click=${() => this.selectEndpoint(endpoint)}
                >
                  <span class="method-badge method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                  <span>${endpoint.path}</span>
                </div>
              `)}
            </li>
          `)}
        </ul>

        ${this.collections.length > 0 ? html`
          <div class="collections-section">
            <h4>📚 Saved Collections</h4>
            ${this.collections.map(collection => html`
              <div class="collection-item" @click=${() => this.loadCollection(collection)}>
                <div style="font-weight: 500;">${collection.name}</div>
                <div style="font-size: 11px; color: #6b7280;">${collection.endpoint.method} ${collection.endpoint.path}</div>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderMainPanel() {
    return html`
      <div class="main-panel">
        <div class="header">
          <h1>🚀 NeoForge API Playground</h1>
          <p>Interactive testing environment for all API endpoints</p>
        </div>
        
        <div class="content">
          <div class="request-panel">
            ${this.selectedEndpoint ? this.renderRequestPanel() : this.renderWelcome()}
          </div>
          <div class="response-panel">
            ${this.renderResponsePanel()}
          </div>
        </div>
      </div>
    `;
  }

  renderWelcome() {
    return html`
      <div style="text-align: center; padding: 60px 20px;">
        <h2 style="color: #6b7280; margin-bottom: 16px;">Welcome to NeoForge API Playground</h2>
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.6;">
          Select an endpoint from the sidebar to start testing your API.<br>
          Live request/response testing with real authentication.
        </p>
        <div style="margin-top: 40px; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 16px 0; color: #374151;">✨ Features</h3>
          <ul style="text-align: left; color: #6b7280; line-height: 1.8;">
            <li>🔄 Live API testing with real endpoints</li>
            <li>🔐 Automatic authentication handling</li>
            <li>💾 Save and share request collections</li>
            <li>📋 Multi-language code generation</li>
            <li>⚡ Real-time validation and error handling</li>
          </ul>
        </div>
      </div>
    `;
  }

  renderRequestPanel() {
    return html`
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px; color: #111827;">
            ${this.selectedEndpoint.method} ${this.selectedEndpoint.path}
          </h3>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" @click=${this.saveCollection}>💾 Save</button>
            <button 
              class="btn btn-primary" 
              @click=${this.executeRequest}
              ?disabled=${this.loading}
            >
              ${this.loading ? html`<span class="loading-spinner"></span>` : '▶️'} 
              Send Request
            </button>
          </div>
        </div>

        <p style="color: #6b7280; margin-bottom: 20px;">${this.selectedEndpoint.description}</p>

        <div class="request-url">
          <select disabled>
            <option>${this.selectedEndpoint.method}</option>
          </select>
          <input type="text" value="${window.location.origin}${this.selectedEndpoint.path}" readonly />
        </div>

        ${this.renderParameterInputs()}

        <div class="tabs">
          <button 
            class="tab ${this.activeTab === 'body' ? 'active' : ''}"
            @click=${() => this.activeTab = 'body'}
          >
            Body
          </button>
          <button 
            class="tab ${this.activeTab === 'headers' ? 'active' : ''}"
            @click=${() => this.activeTab = 'headers'}
          >
            Headers
          </button>
          <button 
            class="tab ${this.activeTab === 'code' ? 'active' : ''}"
            @click=${() => this.activeTab = 'code'}
          >
            Code
          </button>
        </div>

        <div class="tab-content ${this.activeTab === 'body' ? 'active' : ''}">
          ${['POST', 'PUT', 'PATCH'].includes(this.selectedEndpoint.method) ? html`
            <textarea 
              class="json-editor"
              .value=${this.requestBody}
              @input=${(e) => this.requestBody = e.target.value}
              placeholder="Request body (JSON)"
            ></textarea>
          ` : html`
            <p style="color: #6b7280; font-style: italic;">No request body for ${this.selectedEndpoint.method} requests</p>
          `}
        </div>

        <div class="tab-content ${this.activeTab === 'headers' ? 'active' : ''}">
          ${this.renderHeaders()}
        </div>

        <div class="tab-content ${this.activeTab === 'code' ? 'active' : ''}">
          ${this.renderCodeExample()}
        </div>
      </div>
    `;
  }

  renderParameterInputs() {
    const pathParams = this.selectedEndpoint.parameters?.filter(p => p.in === 'path') || [];
    const queryParams = this.selectedEndpoint.parameters?.filter(p => p.in === 'query') || [];
    
    if (pathParams.length === 0 && queryParams.length === 0) {
      return '';
    }
    
    return html`
      <div style="margin-bottom: 20px;">
        ${pathParams.length > 0 ? html`
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">Path Parameters</h4>
          ${pathParams.map(param => html`
            <div class="form-group">
              <label>${param.name} ${param.required ? '*' : ''}</label>
              <input 
                type="text" 
                class="form-input" 
                name="path_${param.name}"
                placeholder="${param.description || param.name}"
              />
            </div>
          `)}
        ` : ''}
        
        ${queryParams.length > 0 ? html`
          <h4 style="margin: 20px 0 12px 0; font-size: 14px; color: #374151;">Query Parameters</h4>
          ${queryParams.map(param => html`
            <div class="form-group">
              <label>${param.name} ${param.required ? '*' : ''}</label>
              <input 
                type="text" 
                class="form-input" 
                name="query_${param.name}"
                placeholder="${param.description || param.name}"
              />
            </div>
          `)}
        ` : ''}
      </div>
    `;
  }

  renderHeaders() {
    const headers = this.buildHeaders();
    
    return html`
      <div style="font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 13px;">
        ${Object.entries(headers).map(([key, value]) => html`
          <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #4f46e5; font-weight: 600;">${key}:</span> 
            <span style="color: #374151;">${value}</span>
          </div>
        `)}
      </div>
    `;
  }

  renderCodeExample() {
    return html`
      <div class="code-example">
        <div class="code-example-header">
          <span style="color: #f9fafb; font-weight: 500;">Code Example</span>
          <select @change=${(e) => this.requestUpdate()}>
            <option value="curl">curl</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>
        <div class="code-example-body">
          ${this.generateCodeExample(this.shadowRoot?.querySelector('select')?.value || 'curl')}
        </div>
      </div>
    `;
  }

  renderResponsePanel() {
    if (!this.response) {
      return html`
        <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
          <h3 style="margin-bottom: 16px;">Response will appear here</h3>
          <p>Execute a request to see the response data, headers, and status.</p>
        </div>
      `;
    }

    const statusClass = this.response.status >= 200 && this.response.status < 300 ? 'status-200' :
                       this.response.status >= 400 && this.response.status < 500 ? 'status-400' : 'status-500';

    return html`
      <div class="response-container">
        <div class="response-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="status-badge ${statusClass}">
              ${this.response.status} ${this.response.statusText}
            </span>
            <span style="color: #9ca3af; font-size: 12px;">
              ${this.response.duration}ms
            </span>
          </div>
          <button class="btn btn-secondary" @click=${() => navigator.clipboard.writeText(JSON.stringify(this.response.data, null, 2))}>
            📋 Copy
          </button>
        </div>
        <div class="response-body">
          ${typeof this.response.data === 'object' ? 
            JSON.stringify(this.response.data, null, 2) : 
            this.response.data}
        </div>
      </div>
    `;
  }
}

customElements.define('api-playground', ApiPlayground);