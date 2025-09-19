/**
 * Collection Manager Component
 * 
 * Advanced API collection management system featuring:
 * - Save and organize API request collections
 * - Share collections with team members
 * - Import/export collections in multiple formats
 * - Version control for collections
 * - Collaborative editing and comments
 */

import { LitElement, html, css } from 'lit';

export class CollectionManager extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .collection-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .header h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-actions {
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

    .search-bar {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .collections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .collection-card {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .collection-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: #4f46e5;
    }

    .collection-card.selected {
      border-color: #4f46e5;
      background: #eff6ff;
    }

    .collection-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .collection-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 4px 0;
    }

    .collection-meta {
      font-size: 12px;
      color: #6b7280;
    }

    .collection-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .collection-card:hover .collection-actions {
      opacity: 1;
    }

    .collection-description {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .collection-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #6b7280;
    }

    .collection-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .collection-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .shared-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #059669;
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
      max-width: 600px;
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

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .tag-input-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      min-height: 44px;
      align-items: center;
    }

    .tag-input-container:focus-within {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .tag-input {
      border: none;
      outline: none;
      flex: 1;
      min-width: 100px;
      font-size: 14px;
    }

    .removable-tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .remove-tag {
      cursor: pointer;
      font-weight: bold;
      color: #7c3aed;
    }

    .remove-tag:hover {
      color: #5b21b6;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .share-section {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .share-section h4 {
      margin: 0 0 12px 0;
      color: #0369a1;
      font-size: 16px;
    }

    .share-link {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }

    .share-link input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #0ea5e9;
      border-radius: 6px;
      background: white;
      font-family: monospace;
      font-size: 13px;
    }

    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .permission-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .permission-option:hover {
      background: #f9fafb;
    }

    .permission-option.selected {
      border-color: #4f46e5;
      background: #eff6ff;
    }

    .import-export-section {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .import-export-section h4 {
      margin: 0 0 12px 0;
      color: #92400e;
      font-size: 16px;
    }

    .format-options {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .format-option {
      padding: 6px 12px;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .format-option:hover,
    .format-option.selected {
      background: #f59e0b;
      color: white;
    }

    .file-drop-zone {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      margin-top: 12px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .file-drop-zone:hover,
    .file-drop-zone.dragover {
      border-color: #4f46e5;
      background: #eff6ff;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .collections-grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
      
      .collection-stats {
        flex-direction: column;
        gap: 8px;
      }
    }
  `;

  static properties = {
    collections: { type: Array },
    selectedCollection: { type: Object },
    showCreateModal: { type: Boolean },
    showShareModal: { type: Boolean },
    showImportModal: { type: Boolean },
    searchQuery: { type: String },
    newCollection: { type: Object },
    shareSettings: { type: Object }
  };

  constructor() {
    super();
    this.collections = [];
    this.selectedCollection = null;
    this.showCreateModal = false;
    this.showShareModal = false;
    this.showImportModal = false;
    this.searchQuery = '';
    this.newCollection = this.getEmptyCollection();
    this.shareSettings = {
      permissions: 'read',
      expiry: 'never',
      public: false
    };
    
    this.loadCollections();
  }

  getEmptyCollection() {
    return {
      name: '',
      description: '',
      tags: [],
      requests: [],
      visibility: 'private',
      teamId: null
    };
  }

  loadCollections() {
    // Load from localStorage for demo
    const saved = localStorage.getItem('neoforge_collections');
    this.collections = saved ? JSON.parse(saved) : this.getSampleCollections();
    this.requestUpdate();
  }

  getSampleCollections() {
    return [
      {
        id: '1',
        name: 'User Management',
        description: 'Complete user lifecycle operations including registration, authentication, and profile management.',
        tags: ['authentication', 'users', 'security'],
        requests: [
          { method: 'POST', path: '/api/v1/auth/register', name: 'Register User' },
          { method: 'POST', path: '/api/v1/auth/login', name: 'Login User' },
          { method: 'GET', path: '/api/v1/users/me', name: 'Get Profile' },
          { method: 'PUT', path: '/api/v1/users/me', name: 'Update Profile' }
        ],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-18',
        shared: false,
        visibility: 'private',
        author: 'John Doe'
      },
      {
        id: '2',
        name: 'Project Operations',
        description: 'CRUD operations for project management with proper error handling and validation.',
        tags: ['projects', 'crud', 'management'],
        requests: [
          { method: 'GET', path: '/api/v1/projects', name: 'List Projects' },
          { method: 'POST', path: '/api/v1/projects', name: 'Create Project' },
          { method: 'GET', path: '/api/v1/projects/{id}', name: 'Get Project' },
          { method: 'PUT', path: '/api/v1/projects/{id}', name: 'Update Project' },
          { method: 'DELETE', path: '/api/v1/projects/{id}', name: 'Delete Project' }
        ],
        createdAt: '2024-01-12',
        updatedAt: '2024-01-16',
        shared: true,
        visibility: 'team',
        author: 'Jane Smith'
      },
      {
        id: '3',
        name: 'Billing & Subscriptions',
        description: 'Stripe integration workflows for subscription management and payment processing.',
        tags: ['billing', 'stripe', 'subscriptions', 'payments'],
        requests: [
          { method: 'GET', path: '/api/v1/billing/plans', name: 'Get Plans' },
          { method: 'POST', path: '/api/v1/billing/subscribe', name: 'Create Subscription' },
          { method: 'GET', path: '/api/v1/billing/invoices', name: 'List Invoices' },
          { method: 'POST', path: '/api/v1/billing/payment-method', name: 'Add Payment Method' }
        ],
        createdAt: '2024-01-10',
        updatedAt: '2024-01-14',
        shared: true,
        visibility: 'public',
        author: 'Mike Johnson'
      }
    ];
  }

  saveCollections() {
    localStorage.setItem('neoforge_collections', JSON.stringify(this.collections));
  }

  get filteredCollections() {
    if (!this.searchQuery) return this.collections;
    
    const query = this.searchQuery.toLowerCase();
    return this.collections.filter(collection => 
      collection.name.toLowerCase().includes(query) ||
      collection.description.toLowerCase().includes(query) ||
      collection.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  selectCollection(collection) {
    this.selectedCollection = collection;
    this.requestUpdate();
  }

  createCollection(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const collection = {
      id: Date.now().toString(),
      name: formData.get('name'),
      description: formData.get('description'),
      tags: this.newCollection.tags,
      requests: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      shared: false,
      visibility: formData.get('visibility'),
      author: 'Current User'
    };
    
    this.collections.push(collection);
    this.saveCollections();
    this.showCreateModal = false;
    this.newCollection = this.getEmptyCollection();
    this.requestUpdate();
  }

  deleteCollection(collectionId) {
    if (confirm('Are you sure you want to delete this collection?')) {
      this.collections = this.collections.filter(c => c.id !== collectionId);
      this.saveCollections();
      if (this.selectedCollection?.id === collectionId) {
        this.selectedCollection = null;
      }
      this.requestUpdate();
    }
  }

  duplicateCollection(collection) {
    const duplicate = {
      ...collection,
      id: Date.now().toString(),
      name: `${collection.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      shared: false,
      visibility: 'private'
    };
    
    this.collections.push(duplicate);
    this.saveCollections();
    this.requestUpdate();
  }

  shareCollection(collection) {
    this.selectedCollection = collection;
    this.showShareModal = true;
    this.requestUpdate();
  }

  generateShareLink() {
    const baseUrl = window.location.origin;
    const shareId = Math.random().toString(36).substring(2, 15);
    return `${baseUrl}/shared/collections/${shareId}`;
  }

  exportCollection(collection, format) {
    let data, filename, mimeType;
    
    switch (format) {
      case 'postman':
        data = this.convertToPostman(collection);
        filename = `${collection.name}.postman_collection.json`;
        mimeType = 'application/json';
        break;
      case 'insomnia':
        data = this.convertToInsomnia(collection);
        filename = `${collection.name}.insomnia.json`;
        mimeType = 'application/json';
        break;
      case 'openapi':
        data = this.convertToOpenAPI(collection);
        filename = `${collection.name}.openapi.yaml`;
        mimeType = 'application/x-yaml';
        break;
      default:
        data = JSON.stringify(collection, null, 2);
        filename = `${collection.name}.json`;
        mimeType = 'application/json';
    }
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  convertToPostman(collection) {
    return JSON.stringify({
      info: {
        name: collection.name,
        description: collection.description,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: collection.requests.map(request => ({
        name: request.name,
        request: {
          method: request.method,
          header: [],
          url: {
            raw: `{{baseUrl}}${request.path}`,
            host: ["{{baseUrl}}"],
            path: request.path.split('/').filter(Boolean)
          }
        }
      })),
      variable: [
        {
          key: "baseUrl",
          value: "https://api.neoforge.dev"
        }
      ]
    }, null, 2);
  }

  convertToInsomnia(collection) {
    return JSON.stringify({
      _type: "export",
      __export_format: 4,
      resources: [
        {
          _id: `wrk_${collection.id}`,
          _type: "workspace",
          name: collection.name,
          description: collection.description
        },
        ...collection.requests.map((request, index) => ({
          _id: `req_${collection.id}_${index}`,
          _type: "request",
          name: request.name,
          method: request.method,
          url: `{{ _.baseUrl }}${request.path}`,
          parentId: `wrk_${collection.id}`
        }))
      ]
    }, null, 2);
  }

  convertToOpenAPI(collection) {
    // Simplified OpenAPI conversion
    const paths = {};
    collection.requests.forEach(request => {
      if (!paths[request.path]) {
        paths[request.path] = {};
      }
      paths[request.path][request.method.toLowerCase()] = {
        summary: request.name,
        responses: {
          '200': {
            description: 'Successful response'
          }
        }
      };
    });
    
    return `openapi: 3.0.0
info:
  title: ${collection.name}
  description: ${collection.description}
  version: 1.0.0
servers:
  - url: https://api.neoforge.dev
paths:
${Object.entries(paths).map(([path, methods]) => 
  `  ${path}:\n${Object.entries(methods).map(([method, spec]) => 
    `    ${method}:\n      summary: ${spec.summary}\n      responses:\n        '200':\n          description: ${spec.responses['200'].description}`
  ).join('\n')}`
).join('\n')}`;
  }

  addTag(tag) {
    if (tag && !this.newCollection.tags.includes(tag)) {
      this.newCollection.tags.push(tag);
      this.requestUpdate();
    }
  }

  removeTag(tag) {
    this.newCollection.tags = this.newCollection.tags.filter(t => t !== tag);
    this.requestUpdate();
  }

  render() {
    return html`
      <div class="collection-container">
        ${this.renderHeader()}
        ${this.renderSearchBar()}
        ${this.renderCollections()}
        
        ${this.showCreateModal ? this.renderCreateModal() : ''}
        ${this.showShareModal ? this.renderShareModal() : ''}
        ${this.showImportModal ? this.renderImportModal() : ''}
      </div>
    `;
  }

  renderHeader() {
    return html`
      <div class="header">
        <h2>📚 API Collections</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" @click=${() => this.showImportModal = true}>
            📥 Import
          </button>
          <button class="btn btn-primary" @click=${() => this.showCreateModal = true}>
            ➕ New Collection
          </button>
        </div>
      </div>
    `;
  }

  renderSearchBar() {
    return html`
      <div class="search-bar">
        <input 
          type="text" 
          class="search-input"
          placeholder="Search collections by name, description, or tags..."
          .value=${this.searchQuery}
          @input=${(e) => this.searchQuery = e.target.value}
        />
      </div>
    `;
  }

  renderCollections() {
    const collections = this.filteredCollections;
    
    if (collections.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>No collections found</h3>
          <p>Create your first collection to organize and share your API requests.</p>
          <button class="btn btn-primary" @click=${() => this.showCreateModal = true}>
            ➕ Create Collection
          </button>
        </div>
      `;
    }
    
    return html`
      <div class="collections-grid">
        ${collections.map(collection => html`
          <div 
            class="collection-card ${this.selectedCollection?.id === collection.id ? 'selected' : ''}"
            @click=${() => this.selectCollection(collection)}
          >
            <div class="collection-header">
              <div>
                <h3 class="collection-title">${collection.name}</h3>
                <div class="collection-meta">
                  Created ${collection.createdAt} • Updated ${collection.updatedAt}
                </div>
              </div>
              <div class="collection-actions">
                <button class="btn btn-secondary btn-small" @click=${(e) => {
                  e.stopPropagation();
                  this.shareCollection(collection);
                }}>
                  🔗
                </button>
                <button class="btn btn-secondary btn-small" @click=${(e) => {
                  e.stopPropagation();
                  this.duplicateCollection(collection);
                }}>
                  📋
                </button>
                <button class="btn btn-danger btn-small" @click=${(e) => {
                  e.stopPropagation();
                  this.deleteCollection(collection.id);
                }}>
                  🗑️
                </button>
              </div>
            </div>
            
            <p class="collection-description">${collection.description}</p>
            
            <div class="collection-stats">
              <div class="stat-item">
                <span>📡</span>
                <span>${collection.requests.length} requests</span>
              </div>
              <div class="stat-item">
                <span>👤</span>
                <span>${collection.author}</span>
              </div>
            </div>
            
            <div class="collection-tags">
              ${collection.tags.map(tag => html`
                <span class="tag">${tag}</span>
              `)}
            </div>
            
            <div class="collection-footer">
              <div class="shared-indicator">
                ${collection.shared ? html`
                  <span>🔗</span>
                  <span>Shared</span>
                ` : ''}
              </div>
              <button class="btn btn-secondary btn-small" @click=${(e) => {
                e.stopPropagation();
                this.exportCollection(collection, 'json');
              }}>
                📥 Export
              </button>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  renderCreateModal() {
    return html`
      <div class="modal" @click=${(e) => e.target === e.currentTarget && (this.showCreateModal = false)}>
        <div class="modal-content">
          <h3>Create New Collection</h3>
          
          <form @submit=${this.createCollection}>
            <div class="form-group">
              <label for="name">Collection Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                class="form-input" 
                placeholder="e.g., User Management APIs"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                name="description" 
                class="form-textarea" 
                placeholder="Describe what this collection contains..."
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="tags">Tags</label>
              <div class="tag-input-container">
                ${this.newCollection.tags.map(tag => html`
                  <span class="removable-tag">
                    ${tag}
                    <span class="remove-tag" @click=${() => this.removeTag(tag)}>×</span>
                  </span>
                `)}
                <input 
                  type="text" 
                  class="tag-input"
                  placeholder="Add tags..."
                  @keydown=${(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const tag = e.target.value.trim();
                      if (tag) {
                        this.addTag(tag);
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="visibility">Visibility</label>
              <select name="visibility" class="form-select">
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click=${() => this.showCreateModal = false}>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                Create Collection
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderShareModal() {
    const shareLink = this.generateShareLink();
    
    return html`
      <div class="modal" @click=${(e) => e.target === e.currentTarget && (this.showShareModal = false)}>
        <div class="modal-content">
          <h3>Share Collection: ${this.selectedCollection?.name}</h3>
          
          <div class="share-section">
            <h4>🔗 Share Link</h4>
            <div class="share-link">
              <input type="text" value=${shareLink} readonly />
              <button class="btn btn-secondary" @click=${() => navigator.clipboard.writeText(shareLink)}>
                📋 Copy
              </button>
            </div>
            
            <div class="permissions-grid">
              <div class="permission-option ${this.shareSettings.permissions === 'read' ? 'selected' : ''}"
                   @click=${() => this.shareSettings.permissions = 'read'}>
                <input type="radio" name="permissions" value="read" ?checked=${this.shareSettings.permissions === 'read'}>
                <span>👀 View Only</span>
              </div>
              <div class="permission-option ${this.shareSettings.permissions === 'comment' ? 'selected' : ''}"
                   @click=${() => this.shareSettings.permissions = 'comment'}>
                <input type="radio" name="permissions" value="comment" ?checked=${this.shareSettings.permissions === 'comment'}>
                <span>💬 Comment</span>
              </div>
              <div class="permission-option ${this.shareSettings.permissions === 'edit' ? 'selected' : ''}"
                   @click=${() => this.shareSettings.permissions = 'edit'}>
                <input type="radio" name="permissions" value="edit" ?checked=${this.shareSettings.permissions === 'edit'}>
                <span>✏️ Edit</span>
              </div>
            </div>
          </div>
          
          <div class="import-export-section">
            <h4>📤 Export Collection</h4>
            <div class="format-options">
              <button class="format-option" @click=${() => this.exportCollection(this.selectedCollection, 'postman')}>
                Postman
              </button>
              <button class="format-option" @click=${() => this.exportCollection(this.selectedCollection, 'insomnia')}>
                Insomnia
              </button>
              <button class="format-option" @click=${() => this.exportCollection(this.selectedCollection, 'openapi')}>
                OpenAPI
              </button>
              <button class="format-option" @click=${() => this.exportCollection(this.selectedCollection, 'json')}>
                JSON
              </button>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" @click=${() => this.showShareModal = false}>
              Close
            </button>
            <button class="btn btn-primary">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderImportModal() {
    return html`
      <div class="modal" @click=${(e) => e.target === e.currentTarget && (this.showImportModal = false)}>
        <div class="modal-content">
          <h3>Import Collection</h3>
          
          <div class="import-export-section">
            <h4>📥 Import from File</h4>
            <div class="format-options">
              <button class="format-option selected">Postman</button>
              <button class="format-option">Insomnia</button>
              <button class="format-option">OpenAPI</button>
              <button class="format-option">JSON</button>
            </div>
            
            <div class="file-drop-zone">
              <p>📁 Drag and drop your collection file here</p>
              <p>or</p>
              <button class="btn btn-secondary">Choose File</button>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" @click=${() => this.showImportModal = false}>
              Cancel
            </button>
            <button class="btn btn-primary">
              Import Collection
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('collection-manager', CollectionManager);