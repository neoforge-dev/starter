/**
 * SDK Documentation Component
 * 
 * Comprehensive SDK documentation and download interface featuring:
 * - Multi-language SDK documentation
 * - Installation and setup guides
 * - Code examples and tutorials
 * - Version management and changelogs
 * - Download links and package managers
 */

import { LitElement, html, css } from 'lit';
import { Logger } from '../../utils/logger.js';

export class SDKDocumentation extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }

    .sdk-container {
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

    .sdk-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .sdk-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 32px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }

    .sdk-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
    }

    .sdk-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .sdk-logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
      font-weight: bold;
    }

    .sdk-info {
      flex: 1;
    }

    .sdk-name {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }

    .sdk-version {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }

    .sdk-description {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .sdk-features {
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
    }

    .sdk-features li {
      padding: 6px 0;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .sdk-features li::before {
      content: '✓';
      color: #10b981;
      font-weight: bold;
    }

    .sdk-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
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

    .installation-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 32px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 28px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 20px 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .language-tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .language-tab {
      padding: 12px 20px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .language-tab:hover {
      color: #374151;
    }

    .language-tab.active {
      color: #4f46e5;
      border-bottom-color: #4f46e5;
    }

    .installation-content {
      display: none;
    }

    .installation-content.active {
      display: block;
    }

    .code-block {
      background: #1f2937;
      color: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin: 16px 0;
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

    .copy-btn {
      background: #374151;
      color: #f9fafb;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: #4b5563;
    }

    .example-section {
      margin-top: 32px;
    }

    .example-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .example-card {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }

    .example-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .example-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 12px 0;
    }

    .example-description {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .package-manager-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }

    .package-manager {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .package-manager-logo {
      width: 32px;
      height: 32px;
      margin: 0 auto 8px auto;
      background: #4f46e5;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    .package-manager-name {
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .package-command {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 12px;
      color: #6b7280;
      background: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }

    .changelog-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 32px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      margin-bottom: 32px;
    }

    .changelog-item {
      border-left: 3px solid #4f46e5;
      padding-left: 20px;
      margin-bottom: 24px;
    }

    .changelog-version {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 8px 0;
    }

    .changelog-date {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .changelog-changes {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .changelog-changes li {
      padding: 4px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.5;
    }

    .changelog-changes .added::before {
      content: '+ ';
      color: #10b981;
      font-weight: bold;
    }

    .changelog-changes .fixed::before {
      content: '🔧 ';
    }

    .changelog-changes .changed::before {
      content: '📝 ';
    }

    .support-section {
      background: linear-gradient(135deg, #1f2937, #374151);
      color: white;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
    }

    .support-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .support-description {
      opacity: 0.9;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .support-links {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .support-link {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .support-link:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    @media (max-width: 768px) {
      .sdk-grid {
        grid-template-columns: 1fr;
      }
      
      .sdk-actions {
        flex-direction: column;
      }
      
      .language-tabs {
        flex-wrap: wrap;
      }
      
      .example-grid {
        grid-template-columns: 1fr;
      }
      
      .support-links {
        flex-direction: column;
        align-items: center;
      }
    }
  `;

  static properties = {
    selectedLanguage: { type: String }
  };

  constructor() {
    super();
    this.selectedLanguage = 'javascript';
  }

  selectLanguage(language) {
    this.selectedLanguage = language;
    this.requestUpdate();
  }

  copyCode(code) {
    navigator.clipboard.writeText(code);
    // Could show toast notification
  }

  downloadSDK(language) {
    // Would trigger actual SDK download
    Logger.info(`Downloading ${language} SDK`);
    // For demo purposes, we'll just show an alert
    alert(`${language} SDK download would start here`);
  }

  render() {
    return html`
      <div class="sdk-container">
        <div class="header">
          <h1>📦 SDK Documentation</h1>
          <p>Official client libraries and SDKs for seamless integration</p>
        </div>

        ${this.renderSDKGrid()}
        ${this.renderInstallationSection()}
        ${this.renderExampleSection()}
        ${this.renderChangelogSection()}
        ${this.renderSupportSection()}
      </div>
    `;
  }

  renderSDKGrid() {
    const sdks = [
      {
        name: 'JavaScript',
        version: 'v2.1.0',
        logo: 'JS',
        description: 'Modern TypeScript/JavaScript SDK with full type safety and tree-shaking support.',
        features: [
          'TypeScript support',
          'Promise-based API',
          'Automatic retries',
          'Built-in caching',
          'Bundle size < 50KB'
        ],
        packageManagers: ['npm', 'yarn', 'pnpm']
      },
      {
        name: 'Python',
        version: 'v1.8.0',
        logo: 'PY',
        description: 'Pythonic SDK with async/await support and comprehensive type hints.',
        features: [
          'Async/await support',
          'Type hints included',
          'Pydantic models',
          'Session management',
          'Rate limit handling'
        ],
        packageManagers: ['pip', 'poetry', 'conda']
      },
      {
        name: 'PHP',
        version: 'v1.5.0',
        logo: 'PHP',
        description: 'PSR-compliant PHP SDK with Composer support and modern PHP features.',
        features: [
          'PSR-4 autoloading',
          'PSR-7 HTTP messages',
          'PHP 8+ features',
          'Guzzle HTTP client',
          'Comprehensive docs'
        ],
        packageManagers: ['composer']
      },
      {
        name: 'Ruby',
        version: 'v1.3.0',
        logo: 'RB',
        description: 'Ruby gem with idiomatic Ruby patterns and comprehensive test coverage.',
        features: [
          'Ruby 3.0+ support',
          'RSpec test suite',
          'Yard documentation',
          'Faraday HTTP client',
          'Rails integration'
        ],
        packageManagers: ['gem', 'bundler']
      },
      {
        name: 'Go',
        version: 'v1.2.0',
        logo: 'GO',
        description: 'Lightweight Go module with zero dependencies and excellent performance.',
        features: [
          'Zero dependencies',
          'Context support',
          'Structured logging',
          'HTTP/2 support',
          'Comprehensive tests'
        ],
        packageManagers: ['go mod']
      },
      {
        name: 'Rust',
        version: 'v0.9.0',
        logo: 'RS',
        description: 'Memory-safe Rust crate with async/await and serde serialization.',
        features: [
          'Async/await ready',
          'Serde integration',
          'Type safety',
          'Zero-cost abstractions',
          'Tokio runtime'
        ],
        packageManagers: ['cargo']
      }
    ];

    return html`
      <div class="sdk-grid">
        ${sdks.map(sdk => html`
          <div class="sdk-card">
            <div class="sdk-header">
              <div class="sdk-logo">${sdk.logo}</div>
              <div class="sdk-info">
                <h3 class="sdk-name">${sdk.name}</h3>
                <p class="sdk-version">${sdk.version}</p>
              </div>
            </div>
            
            <p class="sdk-description">${sdk.description}</p>
            
            <ul class="sdk-features">
              ${sdk.features.map(feature => html`<li>${feature}</li>`)}
            </ul>
            
            <div class="sdk-actions">
              <button 
                class="btn btn-primary"
                @click=${() => this.downloadSDK(sdk.name.toLowerCase())}
              >
                ⬇️ Download
              </button>
              <button 
                class="btn btn-secondary"
                @click=${() => this.selectLanguage(sdk.name.toLowerCase())}
              >
                📖 View Docs
              </button>
              <a href="#" class="btn btn-secondary">
                📦 Examples
              </a>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  renderInstallationSection() {
    return html`
      <div class="installation-section">
        <h2 class="section-title">
          ⚙️ Installation Guide
        </h2>
        
        <div class="language-tabs">
          ${['javascript', 'python', 'php', 'ruby', 'go', 'rust'].map(lang => html`
            <button 
              class="language-tab ${this.selectedLanguage === lang ? 'active' : ''}"
              @click=${() => this.selectLanguage(lang)}
            >
              ${lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          `)}
        </div>

        ${this.renderInstallationContent()}
      </div>
    `;
  }

  renderInstallationContent() {
    const installations = {
      javascript: {
        packageManagers: [
          { name: 'npm', command: 'npm install @neoforge/sdk' },
          { name: 'yarn', command: 'yarn add @neoforge/sdk' },
          { name: 'pnpm', command: 'pnpm add @neoforge/sdk' }
        ],
        quickStart: `import { NeoForgeClient } from '@neoforge/sdk';

const client = new NeoForgeClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.neoforge.dev'
});

// Get current user
const user = await client.users.me();

// Create a project
const project = await client.projects.create({
  name: 'My New Project',
  description: 'A revolutionary application'
});`
      },
      python: {
        packageManagers: [
          { name: 'pip', command: 'pip install neoforge-sdk' },
          { name: 'poetry', command: 'poetry add neoforge-sdk' },
          { name: 'conda', command: 'conda install -c conda-forge neoforge-sdk' }
        ],
        quickStart: `from neoforge import NeoForgeClient

client = NeoForgeClient(
    api_key="your-api-key",
    base_url="https://api.neoforge.dev"
)

# Get current user
user = await client.users.me()

# Create a project
project = await client.projects.create(
    name="My New Project",
    description="A revolutionary application"
)`
      },
      php: {
        packageManagers: [
          { name: 'composer', command: 'composer require neoforge/sdk' }
        ],
        quickStart: `<?php
require_once 'vendor/autoload.php';

use NeoForge\\SDK\\Client;

$client = new Client([
    'api_key' => 'your-api-key',
    'base_url' => 'https://api.neoforge.dev'
]);

// Get current user
$user = $client->users()->me();

// Create a project
$project = $client->projects()->create([
    'name' => 'My New Project',
    'description' => 'A revolutionary application'
]);`
      },
      ruby: {
        packageManagers: [
          { name: 'gem', command: 'gem install neoforge-sdk' },
          { name: 'bundler', command: 'bundle add neoforge-sdk' }
        ],
        quickStart: `require 'neoforge'

client = NeoForge::Client.new(
  api_key: 'your-api-key',
  base_url: 'https://api.neoforge.dev'
)

# Get current user
user = client.users.me

# Create a project
project = client.projects.create(
  name: 'My New Project',
  description: 'A revolutionary application'
)`
      },
      go: {
        packageManagers: [
          { name: 'go mod', command: 'go get github.com/neoforge/go-sdk' }
        ],
        quickStart: `package main

import (
    "context"
    "github.com/neoforge/go-sdk"
)

func main() {
    client := neoforge.NewClient(neoforge.Config{
        APIKey:  "your-api-key",
        BaseURL: "https://api.neoforge.dev",
    })
    
    // Get current user
    user, err := client.Users.Me(context.Background())
    
    // Create a project
    project, err := client.Projects.Create(context.Background(), neoforge.ProjectCreateRequest{
        Name:        "My New Project",
        Description: "A revolutionary application",
    })
}`
      },
      rust: {
        packageManagers: [
          { name: 'cargo', command: 'cargo add neoforge-sdk' }
        ],
        quickStart: `use neoforge_sdk::{Client, Config};
use tokio;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new(Config {
        api_key: "your-api-key".to_string(),
        base_url: "https://api.neoforge.dev".to_string(),
    });
    
    // Get current user
    let user = client.users().me().await?;
    
    // Create a project
    let project = client.projects().create(&ProjectCreateRequest {
        name: "My New Project".to_string(),
        description: Some("A revolutionary application".to_string()),
    }).await?;
    
    Ok(())
}`
      }
    };

    const installation = installations[this.selectedLanguage];
    if (!installation) return '';

    return html`
      <div class="installation-content active">
        <div class="package-manager-grid">
          ${installation.packageManagers.map(pm => html`
            <div class="package-manager">
              <div class="package-manager-logo">${pm.name.toUpperCase()}</div>
              <div class="package-manager-name">${pm.name}</div>
              <div class="package-command">${pm.command}</div>
            </div>
          `)}
        </div>

        <div class="code-block">
          <div class="code-header">
            <span class="code-title">Quick Start Example</span>
            <button class="copy-btn" @click=${() => this.copyCode(installation.quickStart)}>
              📋 Copy
            </button>
          </div>
          <pre>${installation.quickStart}</pre>
        </div>
      </div>
    `;
  }

  renderExampleSection() {
    const examples = [
      {
        title: 'Authentication',
        description: 'Login, logout, and manage user sessions securely.'
      },
      {
        title: 'User Management',
        description: 'Create, update, and manage user profiles and preferences.'
      },
      {
        title: 'Project Operations',
        description: 'CRUD operations for projects with proper error handling.'
      },
      {
        title: 'File Uploads',
        description: 'Handle file uploads with progress tracking and validation.'
      },
      {
        title: 'Webhook Integration',
        description: 'Set up and manage webhooks for real-time notifications.'
      },
      {
        title: 'Error Handling',
        description: 'Comprehensive error handling patterns and best practices.'
      }
    ];

    return html`
      <div class="example-section">
        <h2 class="section-title">
          📋 Code Examples
        </h2>
        
        <div class="example-grid">
          ${examples.map(example => html`
            <div class="example-card">
              <h3 class="example-title">${example.title}</h3>
              <p class="example-description">${example.description}</p>
              <button class="btn btn-secondary">
                👀 View Example
              </button>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  renderChangelogSection() {
    const changelog = [
      {
        version: 'v2.1.0',
        date: '2024-01-15',
        changes: [
          { type: 'added', text: 'Added TypeScript strict mode support' },
          { type: 'added', text: 'New webhook management methods' },
          { type: 'fixed', text: 'Fixed memory leak in event listeners' },
          { type: 'changed', text: 'Improved error message clarity' }
        ]
      },
      {
        version: 'v2.0.0',
        date: '2024-01-01',
        changes: [
          { type: 'added', text: 'Complete API rewrite with better performance' },
          { type: 'added', text: 'Support for async/await patterns' },
          { type: 'changed', text: 'Breaking: Updated authentication flow' },
          { type: 'fixed', text: 'Resolved race conditions in concurrent requests' }
        ]
      }
    ];

    return html`
      <div class="changelog-section">
        <h2 class="section-title">
          📋 Changelog
        </h2>
        
        ${changelog.map(release => html`
          <div class="changelog-item">
            <h3 class="changelog-version">${release.version}</h3>
            <div class="changelog-date">${release.date}</div>
            <ul class="changelog-changes">
              ${release.changes.map(change => html`
                <li class="${change.type}">${change.text}</li>
              `)}
            </ul>
          </div>
        `)}
      </div>
    `;
  }

  renderSupportSection() {
    return html`
      <div class="support-section">
        <h2 class="support-title">Need Help?</h2>
        <p class="support-description">
          Our team is here to help you succeed. Get support, report issues, 
          or contribute to our open-source SDKs.
        </p>
        
        <div class="support-links">
          <a href="#" class="support-link">
            💬 Discord Community
          </a>
          <a href="#" class="support-link">
            📧 Email Support
          </a>
          <a href="#" class="support-link">
            🐛 Report Issues
          </a>
          <a href="#" class="support-link">
            📖 Documentation
          </a>
        </div>
      </div>
    `;
  }
}

customElements.define('sdk-documentation', SDKDocumentation);